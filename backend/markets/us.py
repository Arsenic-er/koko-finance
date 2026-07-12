"""US market adapter — data via yfinance.

US rules: no daily price limit, US trading calendar (handled by the data source),
auto-adjusted close. Per-stock trend defines bull/bear/range.
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

# A liquid, diversified default basket (≈ reference's ~16 names).
DEFAULT_SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD",
    "NFLX", "JPM", "V", "JNJ", "WMT", "XOM", "BAC", "INTC",
    "AVGO", "CRM", "COST", "KO",
]

# Engine parameter overrides for US.
PARAMS = dict(
    vol_window=20, vol_high=2.0, vol_low=0.5,
    pos_window=120, pos_split=0.5,
    trend_window=60, bull_th=0.10, bear_th=-0.10,
    max_h=30,
)


def fetch(symbols, period: str = "2y") -> dict:
    """Return {symbol: DataFrame[date,open,high,low,close,volume]}."""
    symbols = list(symbols)
    data = yf.download(symbols, period=period, group_by="ticker",
                       auto_adjust=True, progress=False, threads=True)
    frames: dict = {}
    multi = isinstance(data.columns, pd.MultiIndex)
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
