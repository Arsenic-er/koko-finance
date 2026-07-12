"""Sentiment backtest — 3 strategies over the news-covered window.

Honest scope: free news APIs only expose *recent* items, so the backtest window
is however many trading days the fetched news spans (often 1-4 weeks), NOT a
multi-year study. Strategies (daily close-to-close, signal from the PREVIOUS
day's sentiment — no look-ahead; no trading costs):
  bh   buy & hold            (baseline)
  sent hold when yesterday's daily sentiment >= TH else cash
  sma  sent AND yesterday's close above its 20-day MA
"""
from __future__ import annotations

import json
import math
import re
import time
from pathlib import Path

import pandas as pd

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)
BT_TTL = 12 * 3600
TH = 55          # sentiment threshold (0-100)
MA_W = 20
MIN_DAYS = 5


def _fetch_prices(symbol: str, market: str):
    for attempt in range(3):          # akshare/yahoo hiccup occasionally — retry
        try:
            if market == "us":
                from .markets import us as M
                df = M.fetch([symbol], "1y").get(symbol)
            elif market == "cn":
                from .markets import cn as M
                df = M.fetch([symbol.lower()], "1y").get(symbol.lower())
            elif market == "tw":
                from .markets import tw as M
                df = M.fetch([symbol], "1y").get(symbol)
            else:
                return None
            if df is not None and len(df):
                return df
        except Exception:
            pass
        time.sleep(1 + attempt)
    return None


def _metrics(eq: pd.Series, pos=None):
    ret = eq.pct_change().fillna(0.0)
    total = float(eq.iloc[-1] / eq.iloc[0] - 1) * 100
    mdd = float((1 - eq / eq.cummax()).max()) * 100
    sd = float(ret.std())
    sharpe = float(ret.mean() / sd * math.sqrt(252)) if sd > 1e-12 else 0.0
    trades = int(pos.diff().abs().sum()) if pos is not None else 0
    return {"ret": round(total, 2), "mdd": round(mdd, 2), "sharpe": round(sharpe, 2), "trades": trades}


def run(symbol: str, market: str, refresh: bool = False) -> dict:
    from . import sentiment as S

    symbol = symbol.strip().upper()
    cpath = CACHE_DIR / f"bt-{market}-{re.sub(r'[^A-Za-z0-9.]', '_', symbol)}.json"
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < BT_TTL:
        try:
            return json.loads(cpath.read_text(encoding="utf-8"))
        except Exception:
            pass

    sen = S.analyze(symbol, market, refresh)
    base = {"symbol": symbol, "market": market, "name": sen.get("name", symbol),
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
    if sen.get("error") or not sen.get("trend"):
        base["error"] = sen.get("error") or "no_news"
        return base

    daily_sent = {p["date"]: p["score"] for p in sen["trend"] if p.get("score") is not None}
    start = min(daily_sent)

    df = _fetch_prices(symbol, market)
    if df is None or len(df) < MA_W + MIN_DAYS:
        base["error"] = "no_price"
        return base
    df = df.copy()
    df["ma"] = df["close"].rolling(MA_W).mean()
    win = df[df["date"] >= start].reset_index(drop=True)
    if len(win) < MIN_DAYS:
        base.update(error="window_too_short", window_days=int(len(win)))
        return base

    # forward-fill daily sentiment onto trading days
    sent, last = [], 50.0
    for d in win["date"]:
        last = daily_sent.get(d, last)
        sent.append(last)
    win["sent"] = sent

    ret = win["close"].pct_change().fillna(0.0)
    pos_sent = (win["sent"].shift(1) >= TH).astype(float).fillna(0.0)
    pos_sma = pos_sent * ((win["close"].shift(1) > win["ma"].shift(1)).astype(float).fillna(0.0))

    eq_bh = (1 + ret).cumprod() * 100
    eq_sent = (1 + ret * pos_sent).cumprod() * 100
    eq_sma = (1 + ret * pos_sma).cumprod() * 100

    base.update(
        window={"start": win["date"].iloc[0], "end": win["date"].iloc[-1], "days": int(len(win))},
        threshold=TH,
        strategies={
            "bh": _metrics(eq_bh),
            "sent": _metrics(eq_sent, pos_sent),
            "sma": _metrics(eq_sma, pos_sma),
        },
        curves={
            "dates": win["date"].tolist(),
            "bh": [round(x, 2) for x in eq_bh],
            "sent": [round(x, 2) for x in eq_sent],
            "sma": [round(x, 2) for x in eq_sma],
            "sentiment": [round(x, 1) for x in win["sent"]],
        },
    )
    cpath.write_text(json.dumps(base, ensure_ascii=False), encoding="utf-8")
    return base
