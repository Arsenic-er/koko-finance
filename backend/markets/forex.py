"""Forex adapter — data via yfinance (`EURUSD=X` style).

FX spot has NO volume, so this uses signal="volatility": the engine's anomaly is
built from the daily range %% instead of volume (波动放大 / 波动收缩). Trend bands
are small because FX moves far less than equities.
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

DEFAULT_SYMBOLS = [
    # USD majors
    "EURUSD=X", "USDJPY=X", "GBPUSD=X", "AUDUSD=X", "USDCAD=X", "USDCHF=X",
    # CNY (人民币) focus — in/offshore + crosses
    "USDCNY=X", "USDCNH=X", "EURCNY=X", "JPYCNY=X", "GBPCNY=X", "AUDCNY=X",
    # JPY (日元) crosses
    "EURJPY=X", "GBPJPY=X", "AUDJPY=X", "CADJPY=X",
    # EUR crosses + Asia
    "EURGBP=X", "EURCHF=X", "USDHKD=X", "USDTWD=X",
]

PARAMS = dict(
    signal="volatility",
    vol_window=20, vol_high=1.5, vol_low=0.6,
    pos_window=120, pos_split=0.5,
    trend_window=60, bull_th=0.05, bear_th=-0.05,
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
            if "volume" not in d.columns:
                d["volume"] = 0.0
            # FX volume is absent/zero — drop on price columns only.
            d = d[["open", "high", "low", "close", "volume"]].dropna(subset=["open", "high", "low", "close"])
            d["volume"] = d["volume"].fillna(0.0)
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
