"""News fetcher for the sentiment module.

Per-market source chains, each with exponential-backoff retry and a 24h disk cache:
  cn: EastMoney via akshare stock_news_em  -> Google News RSS (zh-CN)
  us: yfinance Ticker.news                 -> Google News RSS (en-US)
  tw: yfinance Ticker.news (.TW) merged with Google News RSS (zh-TW; yf is sparse for TW)

Normalized item: {title, summary, source, url, published, lang}
"""
from __future__ import annotations

import json
import re
import time
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from xml.etree import ElementTree as ET

import requests

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
NEWS_TTL = 24 * 3600
MAX_ITEMS = 80
PER_DAY = 6       # cap per calendar day so busy names still span weeks (wider trend/backtest window)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def _retry(fn, tries=3):
    delay = 1.0
    for i in range(tries):
        try:
            r = fn()
            if r:
                return r
        except Exception:
            pass
        if i < tries - 1:
            time.sleep(delay)
            delay *= 2
    return []


def _clean(s) -> str:
    s = re.sub(r"<[^>]+>", " ", str(s or ""))
    return re.sub(r"\s+", " ", s).strip()


# ---------- cn: EastMoney via akshare ----------
def _cn_news(code: str):
    import akshare as ak
    df = ak.stock_news_em(symbol=code)
    if df is None or df.empty:
        return []
    items = []
    for _, r in df.iterrows():
        title = _clean(r.get("新闻标题"))
        if not title:
            continue
        items.append({
            "title": title,
            "summary": _clean(r.get("新闻内容"))[:300],
            "source": _clean(r.get("文章来源")) or "东方财富",
            "url": str(r.get("新闻链接") or ""),
            "published": str(r.get("发布时间") or "")[:16],
            "lang": "zh",
        })
    return items


# ---------- us/tw: yfinance ----------
def _yf_news(ysym: str, lang: str = "en"):
    import yfinance as yf
    raw = yf.Ticker(ysym).news or []
    items = []
    for it in raw:
        c = it.get("content") if isinstance(it.get("content"), dict) else it
        title = c.get("title") or ""
        if not title:
            continue
        prov = c.get("provider") or {}
        url = (((c.get("canonicalUrl") or {}).get("url"))
               or ((c.get("clickThroughUrl") or {}).get("url"))
               or it.get("link") or "")
        pub = str(c.get("pubDate") or c.get("displayTime") or "")
        if isinstance(it.get("providerPublishTime"), (int, float)):
            pub = datetime.fromtimestamp(it["providerPublishTime"]).strftime("%Y-%m-%d %H:%M")
        items.append({
            "title": _clean(title),
            "summary": _clean(c.get("summary") or c.get("description") or "")[:300],
            "source": _clean(prov.get("displayName") if isinstance(prov, dict) else it.get("publisher")) or "Yahoo",
            "url": url,
            "published": pub[:16].replace("T", " "),
            "lang": lang,
        })
    return items


# ---------- Google News RSS ----------
def _gnews(query: str, hl: str, gl: str, ceid: str, lang: str):
    url = (f"https://news.google.com/rss/search?q={requests.utils.quote(query)}"
           f"&hl={hl}&gl={gl}&ceid={ceid}")
    r = requests.get(url, headers=UA, timeout=12)
    r.raise_for_status()
    root = ET.fromstring(r.content)
    items = []
    for it in root.iter("item"):
        title = _clean(it.findtext("title"))
        if not title:
            continue
        pub = it.findtext("pubDate") or ""
        try:
            pub = parsedate_to_datetime(pub).strftime("%Y-%m-%d %H:%M")
        except Exception:
            pub = str(pub)[:16]
        items.append({
            "title": title,
            "summary": _clean(it.findtext("description"))[:300],
            "source": _clean(it.findtext("source")) or "Google News",
            "url": it.findtext("link") or "",
            "published": pub,
            "lang": lang,
        })
    return items


def _display_name(symbol: str, market: str) -> str:
    """Best-effort company name for better news search queries."""
    try:
        from . import search as s
        for sym, mkt, zh, en, _aliases in s._STOCKS:
            if sym == symbol and mkt == market:
                return zh if market in ("cn", "tw") else en
        if market == "cn":
            return s._cn_index().get(symbol, symbol)
    except Exception:
        pass
    return symbol


def _dedupe(items):
    seen, out = set(), []
    for it in items:
        k = it["title"][:30]
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out


def fetch(symbol: str, market: str, refresh: bool = False) -> dict:
    symbol = symbol.strip().upper()
    if market == "cn":
        symbol = symbol.zfill(6) if symbol.isdigit() else symbol
    cpath = CACHE_DIR / f"news-{market}-{re.sub(r'[^A-Za-z0-9.]', '_', symbol)}.json"
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < NEWS_TTL:
        try:
            return json.loads(cpath.read_text(encoding="utf-8"))
        except Exception:
            pass

    name = _display_name(symbol, market)
    items = []
    # Primary + Google News are MERGED (not fallback-only): the primary sources
    # only expose the last day or two, Google News spans weeks — merging widens
    # the trend/backtest window considerably.
    if market == "cn":
        items = _retry(lambda: _cn_news(symbol))
        items += _retry(lambda: _gnews(f"{name} 股票", "zh-CN", "CN", "CN:zh-Hans", "zh"))
    elif market == "us":
        items = _retry(lambda: _yf_news(symbol, "en"))
        q = f'"{name}" stock' if name != symbol else f"{symbol} stock"
        items += _retry(lambda: _gnews(q, "en-US", "US", "US:en", "en"))
    elif market == "tw":
        ysym = symbol if symbol.endswith((".TW", ".TWO")) else f"{symbol}.TW"
        items = _retry(lambda: _yf_news(ysym, "en"))
        items += _retry(lambda: _gnews(f"{name} 股票", "zh-TW", "TW", "TW:zh-Hant", "zh"))

    items = _dedupe(items)
    items.sort(key=lambda x: x.get("published") or "", reverse=True)
    per_day, kept = {}, []
    for it in items:
        day = (it.get("published") or "")[:10]
        per_day[day] = per_day.get(day, 0) + 1
        if per_day[day] <= PER_DAY:
            kept.append(it)
    items = kept[:MAX_ITEMS]

    out = {
        "symbol": symbol, "market": market, "name": name,
        "count": len(items), "items": items,
        "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    cpath.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    return out
