"""Bilingual + simplified/traditional stock search / resolution.

Resolve a free-text query (Chinese name in either 简/繁, English name, or
ticker/code) to a canonical symbol + market. All text is normalized to
Simplified Chinese (via OpenCC) before matching, so 简体 queries match 繁体
names and vice-versa.

Layers:
  1) curated bilingual alias table (US / A-share / Taiwan popular names)
  2) full A-share Chinese-name index via akshare
  3) Yahoo search fallback (US tickers/names, and .TW for Taiwan)
"""
from __future__ import annotations

import json
import time
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
_CN_IDX_TTL = 7 * 24 * 3600

# --- simplified/traditional normalization -----------------------------------
try:
    from opencc import OpenCC
    _T2S = OpenCC("t2s")

    def _norm(x: str) -> str:
        try:
            return _T2S.convert(x).lower()
        except Exception:
            return x.lower()
except Exception:  # opencc missing -> degrade to identity (simplified still works)
    def _norm(x: str) -> str:
        return x.lower()


# Chinese/English currency name -> ISO code, so a CJK query like 台币/人民币 can be
# routed to Yahoo by code (same rich pair list as typing the ascii code).
_CCY_RAW = {
    "美元": "USD", "美金": "USD", "人民币": "CNY", "离岸人民币": "CNH", "在岸人民币": "CNY",
    "日元": "JPY", "日圆": "JPY", "欧元": "EUR", "英镑": "GBP", "港币": "HKD", "港元": "HKD",
    "台币": "TWD", "新台币": "TWD", "澳元": "AUD", "澳币": "AUD", "加元": "CAD", "加币": "CAD",
    "瑞郎": "CHF", "瑞士法郎": "CHF", "韩元": "KRW", "韩币": "KRW", "新加坡元": "SGD", "新币": "SGD",
    "纽元": "NZD", "新西兰元": "NZD", "泰铢": "THB", "卢布": "RUB", "卢比": "INR", "印度卢比": "INR",
    "墨西哥比索": "MXN", "兰特": "ZAR", "南非兰特": "ZAR", "雷亚尔": "BRL",
}
CCY_NAMES = {_norm(k): v for k, v in _CCY_RAW.items()}


# --- 1) curated bilingual aliases -------------------------------------------
# (symbol, market, name_zh, name_en, [extra aliases])
_STOCKS = [
    # US — default basket
    ("AAPL", "us", "苹果", "Apple", ["apple", "苹果"]),
    ("MSFT", "us", "微软", "Microsoft", ["microsoft", "微软"]),
    ("NVDA", "us", "英伟达", "Nvidia", ["nvidia", "英伟达", "黄仁勋"]),
    ("AMZN", "us", "亚马逊", "Amazon", ["amazon", "亚马逊"]),
    ("GOOGL", "us", "谷歌", "Alphabet (Google)", ["google", "谷歌", "alphabet", "goog"]),
    ("META", "us", "Meta(脸书)", "Meta", ["meta", "facebook", "脸书", "元宇宙"]),
    ("TSLA", "us", "特斯拉", "Tesla", ["tesla", "特斯拉", "马斯克"]),
    ("AMD", "us", "超微半导体", "AMD", ["amd", "超微"]),
    ("NFLX", "us", "奈飞", "Netflix", ["netflix", "奈飞", "网飞"]),
    ("JPM", "us", "摩根大通", "JPMorgan", ["jpmorgan", "摩根大通", "小摩"]),
    ("V", "us", "维萨", "Visa", ["visa", "维萨"]),
    ("JNJ", "us", "强生", "Johnson & Johnson", ["johnson", "强生"]),
    ("WMT", "us", "沃尔玛", "Walmart", ["walmart", "沃尔玛"]),
    ("XOM", "us", "埃克森美孚", "Exxon Mobil", ["exxon", "埃克森", "美孚"]),
    ("BAC", "us", "美国银行", "Bank of America", ["bank of america", "美国银行", "美银"]),
    ("INTC", "us", "英特尔", "Intel", ["intel", "英特尔"]),
    # US — popular extras
    ("KO", "us", "可口可乐", "Coca-Cola", ["coca", "可口可乐"]),
    ("PEP", "us", "百事", "PepsiCo", ["pepsi", "百事"]),
    ("DIS", "us", "迪士尼", "Disney", ["disney", "迪士尼"]),
    ("NKE", "us", "耐克", "Nike", ["nike", "耐克"]),
    ("MCD", "us", "麦当劳", "McDonald's", ["mcdonald", "麦当劳"]),
    ("SBUX", "us", "星巴克", "Starbucks", ["starbucks", "星巴克"]),
    ("ORCL", "us", "甲骨文", "Oracle", ["oracle", "甲骨文"]),
    ("ADBE", "us", "奥多比", "Adobe", ["adobe", "奥多比"]),
    ("UBER", "us", "优步", "Uber", ["uber", "优步"]),
    ("BA", "us", "波音", "Boeing", ["boeing", "波音"]),
    ("BABA", "us", "阿里巴巴", "Alibaba", ["alibaba", "阿里巴巴", "阿里"]),
    ("PDD", "us", "拼多多", "PDD (Temu)", ["pdd", "拼多多", "temu"]),
    ("NIO", "us", "蔚来", "NIO", ["蔚来", "nio"]),
    ("BIDU", "us", "百度", "Baidu", ["baidu", "百度"]),
    # A-share — default basket
    ("600519", "cn", "贵州茅台", "Kweichow Moutai", ["茅台", "moutai", "kweichow"]),
    ("000858", "cn", "五粮液", "Wuliangye", ["五粮液", "wuliangye"]),
    ("300750", "cn", "宁德时代", "CATL", ["宁德时代", "宁德", "catl"]),
    ("002594", "cn", "比亚迪", "BYD", ["比亚迪", "byd"]),
    ("601318", "cn", "中国平安", "Ping An", ["中国平安", "平安", "ping an", "pingan"]),
    ("600036", "cn", "招商银行", "China Merchants Bank", ["招商银行", "招行", "cmb"]),
    ("000333", "cn", "美的集团", "Midea", ["美的", "midea"]),
    ("600900", "cn", "长江电力", "China Yangtze Power", ["长江电力", "长电"]),
    ("601899", "cn", "紫金矿业", "Zijin Mining", ["紫金矿业", "紫金", "zijin"]),
    ("002415", "cn", "海康威视", "Hikvision", ["海康威视", "海康", "hikvision"]),
    ("600276", "cn", "恒瑞医药", "Hengrui", ["恒瑞医药", "恒瑞", "hengrui"]),
    ("000001", "cn", "平安银行", "Ping An Bank", ["平安银行"]),
    ("601012", "cn", "隆基绿能", "LONGi", ["隆基绿能", "隆基", "longi"]),
    ("600030", "cn", "中信证券", "CITIC Securities", ["中信证券", "中信", "citic"]),
    ("000651", "cn", "格力电器", "Gree", ["格力", "gree"]),
    ("600887", "cn", "伊利股份", "Yili", ["伊利", "yili"]),
    # Taiwan — default basket (names in 繁體; normalization handles 简体 queries)
    ("2330", "tw", "台積電", "TSMC", ["台積電", "台积电", "tsmc", "台积"]),
    ("2317", "tw", "鴻海", "Hon Hai (Foxconn)", ["鴻海", "鸿海", "foxconn", "hon hai", "富士康"]),
    ("2454", "tw", "聯發科", "MediaTek", ["聯發科", "联发科", "mediatek"]),
    ("2308", "tw", "台達電", "Delta Electronics", ["台達電", "台达电", "delta"]),
    ("2303", "tw", "聯電", "UMC", ["聯電", "联电", "umc"]),
    ("2412", "tw", "中華電", "Chunghwa Telecom", ["中華電", "中华电", "chunghwa"]),
    ("2882", "tw", "國泰金", "Cathay Financial", ["國泰金", "国泰金", "cathay"]),
    ("2881", "tw", "富邦金", "Fubon Financial", ["富邦金", "fubon"]),
    ("1301", "tw", "台塑", "Formosa Plastics", ["台塑", "formosa"]),
    ("1303", "tw", "南亞", "Nan Ya Plastics", ["南亞", "南亚", "nan ya"]),
    ("2002", "tw", "中鋼", "China Steel", ["中鋼", "中钢", "china steel"]),
    ("2884", "tw", "玉山金", "E.Sun Financial", ["玉山金", "esun", "e.sun"]),
    ("3711", "tw", "日月光投控", "ASE Technology", ["日月光", "ase"]),
    ("2891", "tw", "中信金", "CTBC Financial", ["中信金", "ctbc"]),
    ("2886", "tw", "兆豐金", "Mega Financial", ["兆豐金", "兆丰金", "mega"]),
    ("2207", "tw", "和泰車", "Hotai Motor", ["和泰車", "和泰车", "hotai", "toyota台湾"]),
    # Popular ETFs / index funds (nice bilingual names; more found via live indexes)
    ("SPY", "us", "标普500 ETF", "SPDR S&P 500 ETF", ["spy", "标普500", "标普", "sp500"]),
    ("QQQ", "us", "纳指100 ETF", "Invesco QQQ (Nasdaq-100)", ["qqq", "纳指100", "纳斯达克100", "纳指"]),
    ("VOO", "us", "先锋标普500 ETF", "Vanguard S&P 500 ETF", ["voo", "vanguard 500"]),
    ("0050", "tw", "元大台灣50 ETF", "Yuanta Taiwan 50 ETF", ["0050", "元大台灣50", "台灣50", "台湾50"]),
    ("0056", "tw", "元大高股息 ETF", "Yuanta High Dividend ETF", ["0056", "元大高股息", "高股息"]),
    # Crypto (yfinance X-USD pairs)
    ("BTC-USD", "crypto", "比特币", "Bitcoin", ["btc", "比特币", "比特幣", "bitcoin", "大饼"]),
    ("ETH-USD", "crypto", "以太坊", "Ethereum", ["eth", "以太坊", "以太", "ethereum"]),
    ("BNB-USD", "crypto", "币安币", "BNB", ["bnb", "币安币", "币安", "幣安"]),
    ("SOL-USD", "crypto", "索拉纳", "Solana", ["sol", "solana", "索拉纳"]),
    ("XRP-USD", "crypto", "瑞波币", "XRP (Ripple)", ["xrp", "瑞波币", "瑞波", "ripple"]),
    ("DOGE-USD", "crypto", "狗狗币", "Dogecoin", ["doge", "狗狗币", "狗狗", "dogecoin"]),
    ("ADA-USD", "crypto", "艾达币", "Cardano", ["ada", "cardano", "艾达币"]),
    ("LTC-USD", "crypto", "莱特币", "Litecoin", ["ltc", "莱特币", "litecoin"]),
    # Forex (yfinance =X pairs)
    ("EURUSD=X", "forex", "欧元/美元", "EUR/USD", ["eurusd", "欧元美元", "欧元", "歐元"]),
    ("USDJPY=X", "forex", "美元/日元", "USD/JPY", ["usdjpy", "美元日元", "日元", "日圆"]),
    ("GBPUSD=X", "forex", "英镑/美元", "GBP/USD", ["gbpusd", "英镑美元", "英镑", "英鎊"]),
    ("USDCNY=X", "forex", "美元/人民币", "USD/CNY", ["usdcny", "美元人民币", "人民币", "在岸人民币"]),
    ("USDCNH=X", "forex", "美元/离岸人民币", "USD/CNH", ["usdcnh", "离岸人民币", "離岸人民幣"]),
    ("USDHKD=X", "forex", "美元/港币", "USD/HKD", ["usdhkd", "港币", "港元", "港幣"]),
    ("USDTWD=X", "forex", "美元/新台币", "USD/TWD", ["usdtwd", "新台币", "台币", "新台幣"]),
    ("AUDUSD=X", "forex", "澳元/美元", "AUD/USD", ["audusd", "澳元", "澳币"]),
    # CNY / JPY / EUR crosses
    ("EURCNY=X", "forex", "欧元/人民币", "EUR/CNY", ["eurcny", "欧元人民币", "歐元人民幣"]),
    ("JPYCNY=X", "forex", "日元/人民币", "JPY/CNY", ["jpycny", "日元人民币", "日圆人民币"]),
    ("GBPCNY=X", "forex", "英镑/人民币", "GBP/CNY", ["gbpcny", "英镑人民币", "英鎊人民幣"]),
    ("AUDCNY=X", "forex", "澳元/人民币", "AUD/CNY", ["audcny", "澳元人民币"]),
    ("EURJPY=X", "forex", "欧元/日元", "EUR/JPY", ["eurjpy", "欧元日元"]),
    ("GBPJPY=X", "forex", "英镑/日元", "GBP/JPY", ["gbpjpy", "英镑日元"]),
    ("AUDJPY=X", "forex", "澳元/日元", "AUD/JPY", ["audjpy", "澳元日元"]),
    ("CADJPY=X", "forex", "加元/日元", "CAD/JPY", ["cadjpy", "加元日元"]),
    ("EURGBP=X", "forex", "欧元/英镑", "EUR/GBP", ["eurgbp", "欧元英镑"]),
    ("EURCHF=X", "forex", "欧元/瑞郎", "EUR/CHF", ["eurchf", "欧元瑞郎", "瑞郎"]),
]


def _entry(symbol, market, zh, en):
    return {"symbol": symbol, "market": market, "name_zh": zh, "name_en": en}


def _alias_search(q: str):
    ql = _norm(q.strip())
    if not ql:
        return []
    hits, seen = [], set()
    for sym, mkt, zh, en, aliases in _STOCKS:
        keys = [_norm(k) for k in ([sym, zh, en] + aliases)]
        exact = any(ql == k for k in keys)
        # Allow single-CHAR queries only for CJK (e.g. 台/茅); single ASCII letters
        # stay exact-only to avoid 'v' matching 'nvidia'.
        allow_sub = len(ql) >= 2 or (len(ql) == 1 and not ql.isascii())
        sub = allow_sub and any(len(k) >= 2 and (ql in k or k in ql) for k in keys)
        if (exact or sub) and sym not in seen:
            seen.add(sym)
            hits.append((0 if exact else 1, _entry(sym, mkt, zh, en)))
    hits.sort(key=lambda x: x[0])
    return [h[1] for h in hits]


# --- 2) full A-share name index (akshare) -----------------------------------
_cn_norm_cache = None


def _cn_index() -> dict:
    path = CACHE_DIR / "cn_names.json"
    if path.exists() and (time.time() - path.stat().st_mtime) < _CN_IDX_TTL:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    try:
        import akshare as ak
        df = ak.stock_info_a_code_name()
        df.columns = [str(c).lower() for c in df.columns]
        code_col = "code" if "code" in df.columns else df.columns[0]
        name_col = "name" if "name" in df.columns else df.columns[1]
        idx = {str(r[code_col]).zfill(6): str(r[name_col]) for _, r in df.iterrows()}
        path.write_text(json.dumps(idx, ensure_ascii=False), encoding="utf-8")
        return idx
    except Exception:
        return {}


def _cn_norm_index() -> dict:
    global _cn_norm_cache
    if _cn_norm_cache is None:
        _cn_norm_cache = {c: _norm(n) for c, n in _cn_index().items()}
    return _cn_norm_cache


# A-share ETF / index-fund index (akshare spot snapshot)
_etf_cache = None
_etf_norm_cache = None


def _etf_index() -> dict:
    path = CACHE_DIR / "etf_names.json"
    if path.exists() and (time.time() - path.stat().st_mtime) < _CN_IDX_TTL:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    try:
        import akshare as ak
        df = ak.fund_etf_spot_em()
        cols = [str(c) for c in df.columns]
        df.columns = cols
        code_col = "代码" if "代码" in cols else ("code" if "code" in cols else cols[0])
        name_col = "名称" if "名称" in cols else ("name" if "name" in cols else cols[1])
        idx = {str(r[code_col]).zfill(6): str(r[name_col]) for _, r in df.iterrows()}
        path.write_text(json.dumps(idx, ensure_ascii=False), encoding="utf-8")
        return idx
    except Exception:
        return {}


def _etf_norm_index() -> dict:
    global _etf_norm_cache
    if _etf_norm_cache is None:
        _etf_norm_cache = {c: _norm(n) for c, n in _etf_index().items()}
    return _etf_norm_cache


def _cn_search(q: str):
    q = q.strip()
    sidx, eidx = _cn_index(), _etf_index()
    out = []
    if q.isdigit():
        for code, name in sidx.items():
            if code.startswith(q):
                out.append(_entry(code, "cn", name, name))
        for code, name in eidx.items():
            if code.startswith(q):
                out.append(_entry(code, "cn", f"{name}·ETF", f"{name} ETF"))
    else:
        qn = _norm(q)
        if qn:
            for code, nn in _cn_norm_index().items():
                if qn in nn:
                    out.append(_entry(code, "cn", sidx[code], sidx[code]))
            for code, nn in _etf_norm_index().items():
                if qn in nn:
                    out.append(_entry(code, "cn", f"{eidx[code]}·ETF", f"{eidx[code]} ETF"))
    return out[:10]


# --- 3) Yahoo fallback (US + Taiwan .TW) -------------------------------------
def _yahoo_search(q: str):
    try:
        from curl_cffi import requests as creq
        r = creq.get("https://query2.finance.yahoo.com/v1/finance/search",
                     params={"q": q, "quotesCount": 8, "newsCount": 0},
                     impersonate="chrome", timeout=8)
        data = r.json()
        out = []
        for it in data.get("quotes", []):
            sym = it.get("symbol")
            qt = it.get("quoteType")
            if not sym or qt not in ("EQUITY", "ETF", "CRYPTOCURRENCY", "CURRENCY"):
                continue
            name = it.get("shortname") or it.get("longname") or sym
            up = sym.upper()
            if qt == "CRYPTOCURRENCY":
                out.append(_entry(sym, "crypto", name, name))
            elif up.endswith("=X"):
                out.append(_entry(sym, "forex", name, name))
            elif qt == "CURRENCY":
                continue  # bare currency code (no =X) isn't a tradable pair
            elif up.endswith((".TW", ".TWO")):
                out.append(_entry(sym.split(".")[0], "tw", name, name))
            else:
                out.append(_entry(sym, "us", name, name))
        return out
    except Exception:
        return []


def search(q: str, market: str | None = None):
    q = (q or "").strip()
    if not q:
        return []
    results, seen = [], set()

    def add(items):
        for it in items:
            k = (it["symbol"], it["market"])
            if k not in seen:
                seen.add(k)
                results.append(it)

    add(_alias_search(q))
    has_cjk = any("一" <= ch <= "鿿" for ch in q)
    is_ascii = q.replace(".", "").replace("-", "").isascii()

    if q.isdigit():
        if len(q) >= 6:
            add(_cn_search(q))           # A-share 6-digit code
        else:
            add([_entry(q, "tw", q, q)])  # Taiwan 4-5 digit code
    elif has_cjk:
        add(_cn_search(q))
    # CJK currency name (台币/人民币/日元…) -> route to Yahoo by ISO code for full pair list
    ccy = CCY_NAMES.get(_norm(q))
    if ccy and has_cjk:
        add(_yahoo_search(ccy))
    if is_ascii and not q.isdigit():
        add(_yahoo_search(q))

    if market in ("us", "cn", "tw"):
        results.sort(key=lambda r: 0 if r["market"] == market else 1)
    return results[:10]
