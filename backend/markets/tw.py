"""Taiwan market adapter — data via yfinance (.TW suffix).

TW rules: ±10% daily price limit (since 2015), TWD, Taiwan calendar (handled by
the data source). Per-stock trend defines bull/bear/range.
State/codes are kept WITHOUT the .TW suffix (e.g. "2330"); fetch appends it.
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

# Major TWSE names (codes without suffix).
DEFAULT_SYMBOLS = [
    "2330", "2317", "2454", "2308", "2303", "2412", "2882", "2881",
    "1301", "1303", "2002", "2884", "3711", "2891", "2886", "2207",
    "2357", "3008", "2382", "2603",
]

PARAMS = dict(
    vol_window=20, vol_high=2.0, vol_low=0.5,
    pos_window=120, pos_split=0.5,
    trend_window=60, bull_th=0.12, bear_th=-0.12,
    max_h=30,
)


def _yf(code: str) -> str:
    return code if code.upper().endswith((".TW", ".TWO")) else f"{code}.TW"


def fetch(symbols, period: str = "2y") -> dict:
    symbols = list(symbols)
    ysyms = [_yf(s) for s in symbols]
    data = yf.download(ysyms, period=period, group_by="ticker",
                       auto_adjust=True, progress=False, threads=True)
    multi = isinstance(data.columns, pd.MultiIndex)
    frames: dict = {}
    for code, ysym in zip(symbols, ysyms):
        try:
            d = data[ysym].copy() if multi else data.copy()
            d.columns = [str(c).lower() for c in d.columns]
            d = d[["open", "high", "low", "close", "volume"]].dropna()
            if d.empty:
                frames[code] = None
                continue
            d = d.reset_index()
            d.columns = [str(c).lower() for c in d.columns]
            d = d.rename(columns={"index": "date"})
            d["date"] = pd.to_datetime(d["date"]).dt.strftime("%Y-%m-%d")
            frames[code] = d[["date", "open", "high", "low", "close", "volume"]]
        except Exception:
            frames[code] = None
    return frames
