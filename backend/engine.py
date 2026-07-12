"""Shared volume-anomaly / forward-return analysis engine.

Market adapters (markets/us.py, markets/cn.py) fetch OHLCV frames and supply
market-specific parameters; this module does the common analysis and builds the
JSON bundle consumed by all 7 frontend tabs.
"""
from __future__ import annotations

import math
from typing import Optional

import numpy as np
import pandas as pd

# --- default analysis parameters (adapters override per market) -------------
DEFAULTS = dict(
    vol_window=20,      # MA window for "normal" volume
    vol_high=2.0,       # ratio >= this  -> 放量 (volume surge)
    vol_low=0.5,        # ratio <= this  -> 缩量 (volume shrink)
    pos_window=120,     # trailing window for price position
    pos_split=0.5,      # pct >= split -> 高位 else 低位
    trend_window=60,    # window for bull/bear/range trend
    bull_th=0.10,       # trend return >= +10% -> 牛
    bear_th=-0.10,      # trend return <= -10% -> 熊
    max_h=30,           # forward horizon (days)
    min_best=5,         # min samples for a combo to qualify as best/worst
    signal="volume",    # "volume" -> 放量/缩量; "volatility" -> 波动放大/收缩 (for FX, no volume)
)

POS_ORDER = ["低位", "高位"]
MKT_ORDER = ["牛", "熊", "震荡"]
VOL_ORDER = ["放量", "缩量"]
WIN_HS = [1, 5, 10, 30]
RET_HS = [1, 5, 10, 20, 30]


def _scen(pos: str, mkt: str) -> str:
    return f"{pos}+{mkt}市"


SCENARIOS = [_scen(po, mk) for po in POS_ORDER for mk in MKT_ORDER]


def _clean(o):
    """Recursively make a structure JSON-safe (no NaN/inf, no numpy types)."""
    if isinstance(o, dict):
        return {k: _clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        f = float(o)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 3)
    if isinstance(o, (np.integer,)):
        return int(o)
    return o


def classify_frame(df: pd.DataFrame, p: dict) -> pd.DataFrame:
    """Add vol_ratio / position / market / event columns to one stock frame."""
    d = df.copy()
    close, vol = d["close"], d["volume"]

    # intensity series: volume (stocks/crypto) or daily range %% (FX, no volume)
    if p.get("signal") == "volatility":
        intensity = (d["high"] - d["low"]) / close
    else:
        intensity = vol
    d["vol_ma"] = intensity.rolling(p["vol_window"]).mean()
    d["vol_ratio"] = intensity / d["vol_ma"]

    roll_min = close.rolling(p["pos_window"]).min()
    roll_max = close.rolling(p["pos_window"]).max()
    rng = (roll_max - roll_min).replace(0, np.nan)
    d["pos_pct"] = (close - roll_min) / rng
    d["position"] = np.where(d["pos_pct"] >= p["pos_split"], "高位", "低位")

    tr = close / close.shift(p["trend_window"]) - 1.0
    d["market"] = np.where(tr >= p["bull_th"], "牛",
                           np.where(tr <= p["bear_th"], "熊", "震荡"))

    d["event"] = np.where(d["vol_ratio"] >= p["vol_high"], "放量",
                          np.where(d["vol_ratio"] <= p["vol_low"], "缩量", None))
    return d


def _events_table(frames: dict, p: dict) -> pd.DataFrame:
    horizons = list(range(1, p["max_h"] + 1))
    parts = []
    need = p["pos_window"] + p["max_h"] + 5
    for sym, df in frames.items():
        if df is None or len(df) < need:
            continue
        d = classify_frame(df, p)
        for k in horizons:
            d[k] = (d["close"].shift(-k) / d["close"] - 1.0) * 100.0
        ev = d[d["event"].notna()][["date", "event", "position", "market"] + horizons].copy()
        ev.insert(0, "sym", sym)
        parts.append(ev)
    if not parts:
        return pd.DataFrame()
    out = pd.concat(parts, ignore_index=True)
    out.rename(columns={"event": "vol", "position": "pos", "market": "mkt"}, inplace=True)
    return out


def _group_curve(sub: pd.DataFrame, horizons) -> list:
    return [float(sub[k].mean()) for k in horizons]


def analyze_frames(frames: dict, params: Optional[dict] = None) -> dict:
    p = {**DEFAULTS, **(params or {})}
    horizons = list(range(1, p["max_h"] + 1))
    ev = _events_table(frames, p)

    # restrict to events that occurred within the last `window_days` (0 = all history)
    window_days = int(p.get("window_days") or 0)
    if window_days and not ev.empty:
        dts = pd.to_datetime(ev["date"])
        cutoff = dts.max() - pd.Timedelta(days=window_days)
        ev = ev[dts >= cutoff]

    stock_count = len([1 for f in frames.values() if f is not None])
    # best/worst sample threshold scales with universe size (so single stocks still qualify)
    eff_min_best = max(1, min(p["min_best"], stock_count))
    out = {
        "stock_count": stock_count,
        "params": {k: p[k] for k in ("vol_window", "vol_high", "vol_low",
                                     "pos_window", "trend_window", "bull_th",
                                     "bear_th", "max_h")},
        "scenarios": SCENARIOS,
    }

    if ev.empty:
        out.update(overview={}, return_curves={}, heatmap={}, radar={},
                   compare_30d=[], insights={}, total_events=0)
        return _clean(out)

    # ---- overview ----------------------------------------------------------
    counts_vol = ev["vol"].value_counts().to_dict()
    overview = {
        "volume_events": int(counts_vol.get("放量", 0)),
        "shrink_events": int(counts_vol.get("缩量", 0)),
        "stock_count": stock_count,
        "market_dist": {},
        "position_dist": {},
    }
    for vt in VOL_ORDER:
        sv = ev[ev["vol"] == vt]
        n = max(len(sv), 1)
        overview["market_dist"][vt] = {
            mk: round(float((sv["mkt"] == mk).sum()) / n * 100, 2) for mk in MKT_ORDER}
        overview["position_dist"][vt] = {
            po: round(float((sv["pos"] == po).sum()) / n * 100, 2) for po in POS_ORDER}

    # ---- per (vol, scenario) stats ----------------------------------------
    return_curves = {vt: {} for vt in VOL_ORDER}
    heatmap = {vt: [] for vt in VOL_ORDER}
    radar = {}
    compare = {s: {"放量": None, "缩量": None, "放量_n": 0, "缩量_n": 0} for s in SCENARIOS}
    best = {"name": None, "ret30": -1e9, "n": 0}
    worst = {"name": None, "ret30": 1e9, "n": 0}

    for vt in VOL_ORDER:
        sv = ev[ev["vol"] == vt]
        for po in POS_ORDER:
            for mk in MKT_ORDER:
                sub = sv[(sv["pos"] == po) & (sv["mkt"] == mk)]
                scen = _scen(po, mk)
                n = len(sub)
                ret30 = float(sub[30].mean()) if n else float("nan")
                return_curves[vt][scen] = _group_curve(sub, horizons) if n else []
                heatmap[vt].append({"pos": po, "mkt": mk, "count": n, "ret30": ret30})
                if n:
                    radar[f"{vt}-{scen}"] = {
                        "count": n,
                        **{f"win{k}": float((sub[k] > 0).mean() * 100) for k in WIN_HS},
                        **{f"ret{k}": float(sub[k].mean()) for k in RET_HS},
                    }
                compare[scen][vt] = ret30 if n else None
                compare[scen][f"{vt}_n"] = n
                if vt == "放量" and n >= eff_min_best:
                    if ret30 > best["ret30"]:
                        best = {"name": scen, "ret30": ret30, "n": n}
                    if ret30 < worst["ret30"]:
                        worst = {"name": scen, "ret30": ret30, "n": n}

    overview["best_combo"] = best if best["name"] else None

    compare_30d = [{"combo": s, "放量": compare[s]["放量"], "缩量": compare[s]["缩量"],
                    "放量_n": compare[s]["放量_n"], "缩量_n": compare[s]["缩量_n"]}
                   for s in SCENARIOS]

    insights = {
        "best": best if best["name"] else None,
        "worst": worst if worst["name"] else None,
        "tips": [
            "高位放量常是主力派发的烟雾弹，需警惕",
            "低位放量往往是资金入场信号",
            "缩量整理是蓄力，耐心等待方向选择",
        ],
    }

    out.update(
        total_events=int(len(ev)),
        overview=overview,
        return_curves=return_curves,
        heatmap=heatmap,
        radar=radar,
        compare_30d=compare_30d,
        insights=insights,
    )
    return _clean(out)
