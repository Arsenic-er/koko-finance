"""A-share (China) market adapter — data via akshare.

A-share rules differ from US:
  * daily price limit ±10% (主板) — markets are more momentum/trend driven,
    so bull/bear thresholds are set wider than US.
  * Chinese trading calendar (handled by the data source).
  * qfq (forward-adjusted) prices.
Volume ratio is unit-independent, so the shared engine applies unchanged.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import akshare as ak
import pandas as pd

# Liquid, diversified A-share basket (6-digit codes for akshare).
DEFAULT_SYMBOLS = [
    "600519", "000858", "300750", "002594", "601318", "600036",
    "000333", "600900", "601899", "002415", "600276", "000001",
    "601012", "600030", "000651", "600887",
    "002475", "601166", "600585", "000725",
]

# Engine parameter overrides for A-share (wider bull/bear bands; ±10% limit world).
PARAMS = dict(
    vol_window=20, vol_high=2.0, vol_low=0.5,
    pos_window=120, pos_split=0.5,
    trend_window=60, bull_th=0.15, bear_th=-0.15,
    max_h=30,
)

_PERIOD_DAYS = {"1y": 365, "2y": 730, "3y": 1095, "5y": 1825, "10y": 3650}


def _is_fund(code: str) -> bool:
    """A-share fund/ETF codes start with 5 (SH) or 1 (SZ 15x/16x/18x); stocks start 0/3/6."""
    return code[:1] in ("1", "5")


def _yf_fallback(code: str, period: str):
    """EastMoney sometimes drops connections (rate limits) — fall back to Yahoo (.SS/.SZ)."""
    try:
        import yfinance as yf
        suf = ".SS" if code[:1] in ("5", "6", "9") else ".SZ"
        d = yf.download(f"{code}{suf}", period=period if period in ("1y", "2y", "5y", "10y") else "2y",
                        auto_adjust=True, progress=False, threads=False)
        if d is None or d.empty:
            return None
        d.columns = [str(c[0] if isinstance(c, tuple) else c).lower() for c in d.columns]
        d = d[["open", "high", "low", "close", "volume"]].dropna().reset_index()
        d.columns = [str(c).lower() for c in d.columns]
        d = d.rename(columns={"index": "date"})
        d["date"] = pd.to_datetime(d["date"]).dt.strftime("%Y-%m-%d")
        return d[["date", "open", "high", "low", "close", "volume"]]
    except Exception:
        return None


def fetch(symbols, period: str = "2y") -> dict:
    """Return {code: DataFrame[date,open,high,low,close,volume]}. Handles stocks and ETFs."""
    days = _PERIOD_DAYS.get(period, 730)
    end = datetime.now()
    start = end - timedelta(days=days)
    sd, ed = start.strftime("%Y%m%d"), end.strftime("%Y%m%d")

    frames: dict = {}
    for code in symbols:
        try:
            if _is_fund(code):
                df = ak.fund_etf_hist_em(symbol=code, period="daily",
                                         start_date=sd, end_date=ed, adjust="qfq")
            else:
                df = ak.stock_zh_a_hist(symbol=code, period="daily",
                                        start_date=sd, end_date=ed, adjust="qfq")
            if df is None or df.empty:
                frames[code] = _yf_fallback(code, period)
                continue
            df = df.rename(columns={
                "日期": "date", "开盘": "open", "收盘": "close",
                "最高": "high", "最低": "low", "成交量": "volume",
            })
            df = df[["date", "open", "high", "low", "close", "volume"]].copy()
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            frames[code] = df.reset_index(drop=True)
        except Exception:
            frames[code] = _yf_fallback(code, period)
    return frames
