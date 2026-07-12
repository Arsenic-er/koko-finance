"""Advanced 'invisible to the naked eye' analyses built from price history:
  - seasonality: month x year average return calendar
  - correlation: pairwise return correlation across the basket
Pure price-based, so it works for every market (stocks / crypto / forex).
"""
from __future__ import annotations

import math

import pandas as pd


def _clean(v):
    if v is None:
        return None
    f = float(v)
    return None if (math.isnan(f) or math.isinf(f)) else round(f, 2)


def _monthly_matrix(frames) -> pd.DataFrame:
    """DataFrame indexed by month-end date, columns = symbol, values = monthly % return."""
    series = {}
    for sym, df in frames.items():
        if df is None or len(df) < 25:
            continue
        d = df.copy()
        d["date"] = pd.to_datetime(d["date"])
        d = d.set_index("date").sort_index()
        m = d["close"].resample("ME").last()
        series[sym] = m.pct_change() * 100.0
    return pd.DataFrame(series) if series else pd.DataFrame()


def seasonality(frames) -> dict:
    mat = _monthly_matrix(frames)
    if mat.empty:
        return {"years": [], "cells": [], "month_avg": [None] * 12}
    avg = mat.mean(axis=1)                       # equal-weight basket monthly return
    df = pd.DataFrame({"ret": avg})
    df["year"] = df.index.year
    df["month"] = df.index.month
    years = sorted(int(y) for y in df["year"].unique())
    cells = [{"year": int(r["year"]), "month": int(r["month"]), "ret": _clean(r["ret"])}
             for _, r in df.iterrows() if pd.notna(r["ret"])]
    month_avg = [_clean(df[df["month"] == mo]["ret"].mean()) for mo in range(1, 13)]
    return {"years": years, "cells": cells, "month_avg": month_avg}


def correlation(frames, lookback: int = 252) -> dict:
    series = {}
    for sym, df in frames.items():
        if df is None or len(df) < 30:
            continue
        d = df.copy()
        d["date"] = pd.to_datetime(d["date"])
        d = d.set_index("date").sort_index()
        series[sym] = d["close"].pct_change()
    if len(series) < 2:
        return {"symbols": [], "matrix": [], "lookback": lookback}
    mat = pd.DataFrame(series).tail(lookback)
    corr = mat.corr()
    syms = list(corr.columns)
    matrix = [[_clean(corr.iloc[i, j]) for j in range(len(syms))] for i in range(len(syms))]
    return {"symbols": syms, "matrix": matrix, "lookback": lookback}


def analyze_advanced(frames) -> dict:
    return {"seasonality": seasonality(frames), "correlation": correlation(frames)}
