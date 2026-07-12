"""FinBERT-based news sentiment engine.

Design goals (per user):
  * lazy-load — models are NOT loaded at startup; first request loads them
  * idle auto-unload — a reaper thread frees models after 30 min without use
  * pluggable — per-language candidate lists; first loadable model wins
  * CPU-only (torch threads capped at 2) — never touches the host GPU

Pipeline per stock: fetch news (backend.news) -> score each item with the
zh/en financial BERT -> six-theme keyword classification -> source-reliability
weighting -> composite score / confidence / impact / risk / trend / key events.
"""
from __future__ import annotations

import gc
import json
import math
import re
import threading
import time
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
SENT_TTL = 12 * 3600
IDLE_UNLOAD = 30 * 60          # unload models after 30 min idle
BATCH = 16
MAX_LEN = 256

# First loadable candidate wins (pluggable: edit this list to swap models).
MODEL_CANDIDATES = {
    "zh": [
        "yiyanghkust/finbert-tone-chinese",
        "bardsai/finance-sentiment-zh-base",
        "IDEA-CCNL/Erlangshen-Roberta-110M-Sentiment",
    ],
    "en": [
        "yiyanghkust/finbert-tone",
        "ProsusAI/finbert",
    ],
}

_lock = threading.Lock()
_models: dict = {}             # lang -> {name, tok, model, last}
_reaper_on = False

try:
    from opencc import OpenCC
    _T2S = OpenCC("t2s")
except Exception:
    _T2S = None


def _t2s(s: str) -> str:
    try:
        return _T2S.convert(s) if _T2S else s
    except Exception:
        return s


def _ensure_reaper():
    global _reaper_on
    if _reaper_on:
        return
    _reaper_on = True

    def loop():
        while True:
            time.sleep(300)
            with _lock:
                now = time.time()
                for lang in list(_models):
                    if now - _models[lang]["last"] > IDLE_UNLOAD:
                        del _models[lang]
                        gc.collect()

    threading.Thread(target=loop, daemon=True).start()


def _load(lang: str) -> dict:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    torch.set_num_threads(2)
    errors = []
    for name in MODEL_CANDIDATES[lang]:
        try:
            tok = AutoTokenizer.from_pretrained(name)
            mdl = AutoModelForSequenceClassification.from_pretrained(name)
            mdl.eval()
            return {"name": name, "tok": tok, "model": mdl, "last": time.time()}
        except Exception as e:
            errors.append(f"{name}: {type(e).__name__}")
    raise RuntimeError(f"no {lang} sentiment model loadable ({'; '.join(errors)})")


def _get(lang: str) -> dict:
    with _lock:
        m = _models.get(lang)
        if m is None:
            m = _load(lang)
            _models[lang] = m
            _ensure_reaper()
        m["last"] = time.time()
        return m


def engine_status() -> dict:
    with _lock:
        return {lang: m["name"] for lang, m in _models.items()}


def score_texts(texts, lang: str):
    """Return per-text {score∈[0,1], label, p_pos, p_neg, p_neu}."""
    import torch
    eng = _get(lang)
    tok, mdl = eng["tok"], eng["model"]
    id2label = {int(k): str(v).lower() for k, v in mdl.config.id2label.items()}
    out = []
    with torch.no_grad():
        for i in range(0, len(texts), BATCH):
            batch = [t[:600] for t in texts[i:i + BATCH]]
            enc = tok(batch, truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")
            probs = torch.softmax(mdl(**enc).logits, dim=-1)
            for row in probs:
                p = {id2label[j]: float(row[j]) for j in range(row.shape[0])}
                ppos = sum(v for k, v in p.items() if "pos" in k)
                pneg = sum(v for k, v in p.items() if "neg" in k)
                pneu = max(0.0, 1.0 - ppos - pneg)
                top = max(p, key=p.get)
                label = "pos" if "pos" in top else ("neg" if "neg" in top else "neu")
                out.append({"score": ppos + 0.5 * pneu, "label": label,
                            "p_pos": ppos, "p_neg": pneg, "p_neu": pneu})
    eng["last"] = time.time()
    return out


# ---------------- six-theme keyword classification ----------------
THEMES = {
    "operate": (["经营", "管理", "高管", "董事", "人事", "战略", "合作", "签约", "订单", "扩张", "裁员", "重组", "股东大会", "任命"],
                ["management", "ceo", "executive", "strategy", "partnership", "deal", "contract", "order", "expansion", "layoff", "restructur", "appoint"]),
    "finance": (["财报", "业绩", "营收", "净利", "利润", "亏损", "毛利", "分红", "派现", "季报", "年报", "预告", "净利润"],
                ["earnings", "revenue", "profit", "loss", "margin", "dividend", "guidance", "quarterly", "eps", "income", "beat", "miss"]),
    "compete": (["竞争", "对手", "市场份额", "价格战", "份额", "替代", "抢占", "垄断"],
                ["competition", "competitor", "market share", "rival", "price war", "monopol"]),
    "product": (["产品", "技术", "研发", "专利", "发布", "新品", "芯片", "创新", "升级", "智能", "系统"],
                ["product", "technology", "r&d", "patent", "launch", "chip", "innovation", "upgrade", " ai ", "model", "device"]),
    "policy": (["政策", "监管", "关税", "补贴", "法规", "审查", "批准", "禁令", "央行", "利率", "政府", "立案"],
               ["policy", "regulat", "tariff", "subsid", "law", "approval", "ban", "fed", "rate", "government", "antitrust", "probe"]),
    "capital": (["股价", "涨停", "跌停", "增持", "减持", "回购", "融资", "上市", "评级", "目标价", "北向", "主力", "资金", "机构", "做空", "市值", "股票"],
                ["stock", "share", "buyback", "stake", "rating", "price target", "short", "ipo", "valuation", "fund", "investor", "upgrade", "downgrade", "market cap"]),
}


def classify_theme(text: str, lang: str) -> str:
    tl = f" {text.lower()} "
    best, best_n = "capital", 0
    for key, (zh, en) in THEMES.items():
        kws = zh if lang == "zh" else en
        n = sum(1 for k in kws if k.lower() in tl)
        if n > best_n:
            best, best_n = key, n
    return best


# ---------------- source reliability ----------------
_T1 = ["新华", "人民", "央视", "央广", "公告", "证监", ".gov"]
_T2 = ["证券时报", "上海证券报", "中国证券报", "财联社", "reuters", "bloomberg", "wsj", "wall street", "financial times", "barron", "cnbc", "经济参考"]
_T3 = ["界面", "第一财经", "每日经济", "21世纪", "东方财富", "同花顺", "yahoo", "marketwatch", "techcrunch", "thestreet", "今周刊", "经济日报", "工商时报", "investing", "benzinga", "motley", "simply wall", "钛媒体", "澎湃"]


def source_weight(src: str):
    s = (src or "").lower()
    if any(k in s for k in _T1):
        return 1.0, "official"
    if any(k in s for k in _T2):
        return 0.9, "mainstream"
    if any(k in s for k in _T3):
        return 0.75, "financial"
    return 0.55, "other"


# ---------------- aggregation ----------------
def _r(x, n=1):
    try:
        f = float(x)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, n)
    except Exception:
        return None


def analyze(symbol: str, market: str, refresh: bool = False) -> dict:
    from . import news as news_mod

    symbol = symbol.strip().upper()
    cpath = CACHE_DIR / f"sent-{market}-{re.sub(r'[^A-Za-z0-9.]', '_', symbol)}.json"
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < SENT_TTL:
        try:
            return json.loads(cpath.read_text(encoding="utf-8"))
        except Exception:
            pass

    ndata = news_mod.fetch(symbol, market, refresh)
    items = ndata.get("items") or []
    base = {"symbol": ndata.get("symbol", symbol), "market": market,
            "name": ndata.get("name", symbol),
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
    if not items:
        base.update(n_news=0, error="no_news")
        return base

    # --- score every item with the right-language model ---
    texts, langs = [], []
    for it in items:
        txt = f"{it['title']}。 {it.get('summary') or ''}"[:500]
        lg = "zh" if it.get("lang") == "zh" else "en"
        if lg == "zh":
            txt = _t2s(txt)
        texts.append(txt)
        langs.append(lg)
    scores = [None] * len(texts)
    for lg in ("zh", "en"):
        idx = [i for i, l in enumerate(langs) if l == lg]
        if idx:
            res = score_texts([texts[i] for i in idx], lg)
            for i, r_ in zip(idx, res):
                scores[i] = r_

    enriched = []
    for it, tx, lg, sc in zip(items, texts, langs, scores):
        w, tier = source_weight(it.get("source"))
        enriched.append({
            "title": it["title"], "summary": it.get("summary") or "",
            "source": it.get("source") or "", "url": it.get("url") or "",
            "published": it.get("published") or "", "lang": lg,
            "score": _r(sc["score"] * 100), "label": sc["label"],
            "theme": classify_theme(tx, lg), "weight": w, "tier": tier,
        })

    n = len(enriched)
    wsum = sum(e["weight"] for e in enriched) or 1.0
    composite = sum(e["score"] * e["weight"] for e in enriched) / wsum
    raw = [e["score"] / 100 for e in enriched]
    mean = sum(raw) / n
    disp = math.sqrt(sum((x - mean) ** 2 for x in raw) / n)          # 0..~0.5
    agreement = max(0.0, 1.0 - disp * 2.5)
    avg_w = wsum / n
    confidence = 100 * (0.35 * min(1.0, n / 20) + 0.35 * avg_w + 0.30 * agreement)

    today = time.strftime("%Y-%m-%d")
    recent = sum(1 for e in enriched if (e["published"] or "")[:10] >= today[:8] + "01")  # this month
    impact = 100 * (0.45 * min(1.0, n / 15) + 0.35 * avg_w + 0.20 * min(1.0, recent / max(n, 1)))

    dist = {"pos": 0, "neg": 0, "neu": 0}
    for e in enriched:
        dist[e["label"]] += 1
    neg_ratio = dist["neg"] / n
    risk_score = 100 * (0.65 * neg_ratio + 0.35 * min(1.0, disp * 2.5))
    risk_level = "high" if risk_score >= 60 else ("mid" if risk_score >= 35 else "low")

    themes = []
    for key in THEMES:
        sub = [e for e in enriched if e["theme"] == key]
        if sub:
            themes.append({"key": key, "n": len(sub),
                           "score": _r(sum(e["score"] for e in sub) / len(sub))})

    tiers = {}
    for e in enriched:
        tiers[e["tier"]] = tiers.get(e["tier"], 0) + 1

    by_day = {}
    for e in enriched:
        d = (e["published"] or "")[:10]
        if len(d) == 10:
            by_day.setdefault(d, []).append(e)
    trend = [{"date": d, "score": _r(sum(x["score"] for x in v) / len(v)), "n": len(v)}
             for d, v in sorted(by_day.items())]

    events = sorted(enriched, key=lambda e: abs(e["score"] - 50) * e["weight"], reverse=True)[:6]
    events = [{"date": (e["published"] or "")[:10], "title": e["title"][:60],
               "score": e["score"], "source": e["source"], "url": e["url"]} for e in events]

    base.update(
        n_news=n,
        composite=_r(composite), confidence=_r(confidence),
        impact=_r(impact), risk=_r(risk_score), risk_level=risk_level,
        dist={k: _r(v / n * 100) for k, v in dist.items()},
        themes=themes, sources=tiers, trend=trend, events=events,
        news=[{k: e[k] for k in ("title", "summary", "source", "url", "published", "score", "label", "theme")} for e in enriched],
        models=engine_status(),
    )
    cpath.write_text(json.dumps(base, ensure_ascii=False), encoding="utf-8")
    return base
