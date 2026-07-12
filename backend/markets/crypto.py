"""Crypto market adapter — data via yfinance (`BTC-USD` style, 24/7, has volume).

Uses the standard volume-anomaly engine (signal="volume"). Trend bands are wider
than equities because crypto swings harder.
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

DEFAULT_SYMBOLS = [
    "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD", "DOGE-USD",
    "ADA-USD", "AVAX-USD", "LINK-USD", "DOT-USD", "TRX-USD", "LTC-USD",
    "BCH-USD", "UNI-USD", "ATOM-USD", "XLM-USD", "ETC-USD", "FIL-USD",
    "APT-USD", "ARB-USD",
]

PARAMS = dict(
    signal="volume",
    vol_window=20, vol_high=2.0, vol_low=0.5,
    pos_window=120, pos_split=0.5,
    trend_window=60, bull_th=0.20, bear_th=-0.20,
    max_h=30,
)


def fetch(symbols, period: str = "2y") -> dict:
    symbols = list(symbols)
    data = yf.download(symbols, period=period, group_by="ticker",
                       auto_adjust=True, progress=False, threads=True)
    multi = isinstance(data.columns, pd.MultiIndex)
    frames: dict = {}
    for s in symbols:
        try:
            d = data[s].copy() if multi else data.copy()
            d.columns = [str(c).lower() for c in d.columns]
            d = d[["open", "high", "low", "close", "volume"]].dropna()
            if d.empty:
                frames[s] = None
                continue
            d = d.reset_index()
            d.columns = [str(c).lower() for c in d.columns]
            d = d.rename(columns={"index": "date"})
            d["date"] = pd.to_datetime(d["date"]).dt.strftime("%Y-%m-%d")
            frames[s] = d[["date", "open", "high", "low", "close", "volume"]]
        except Exception:
            frames[s] = None
    return frames
