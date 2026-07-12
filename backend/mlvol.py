"""Volatility forecasting pilot — honest, walk-forward, with a naive baseline.

Predicts forward H-day realized volatility (annualized %) from past-only features.
Compares:
  - baseline : persistence (forward vol = current 22d realized vol)
  - HAR      : Heterogeneous AutoRegressive (daily/weekly/monthly RV), the quant standard
  - GBM      : gradient boosting on richer features
All out-of-sample via expanding-window walk-forward (refit every 21 days). No leakage.
"""
from __future__ import annotations

import math

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

H = 5           # forecast horizon (trading days)
ANN = math.sqrt(252)
FEATS = ["absret", "rv5", "rv10", "rv22", "rv60", "ewma", "mom22", "rangevol"]
HAR_FEATS = ["absret", "rv5", "rv22"]   # daily / weekly / monthly


def portfolio_close(frames) -> pd.Series:
    """Single symbol -> its close; multiple -> equal-weight portfolio index."""
    closes = []
    for f in frames.values():
        if f is None or len(f) < 60:
            continue
        s = f.copy()
        s["date"] = pd.to_datetime(s["date"])
        # winsorize daily returns (kills data-error spikes / extreme illiquid moves)
        closes.append(s.set_index("date")["close"].pct_change().clip(-0.5, 0.5))
    if not closes:
        return pd.Series(dtype=float)
    port_ret = pd.concat(closes, axis=1).mean(axis=1).fillna(0.0)
    return (1.0 + port_ret).cumprod()


def _prep(close: pd.Series) -> pd.DataFrame:
    ret = close.pct_change().clip(-0.5, 0.5)
    df = pd.DataFrame({"ret": ret})
    df["absret"] = ret.abs() * ANN * 100
    for w in (5, 10, 22, 60):
        df[f"rv{w}"] = ret.rolling(w).std() * ANN * 100
    df["ewma"] = np.sqrt(ret.pow(2).ewm(span=20).mean()) * ANN * 100
    df["mom22"] = close.pct_change(22) * 100
    df["rangevol"] = ret.abs().rolling(5).mean() * ANN * 100
    df["target"] = ret.rolling(H).std().shift(-H) * ANN * 100   # forward H-day RV
    return df


def _metrics(actual, pred):
    actual, pred = np.asarray(actual, float), np.asarray(pred, float)
    err = actual - pred
    sse = float((err ** 2).sum())
    sst = float(((actual - actual.mean()) ** 2).sum()) or 1e-9
    r2 = 1 - sse / sst
    corr = float(np.corrcoef(pred, actual)[0, 1]) if len(actual) > 2 else None
    rmse = float(np.sqrt((err ** 2).mean()))
    return {"r2": round(r2, 3), "corr": None if corr is None or math.isnan(corr) else round(corr, 3),
            "rmse": round(rmse, 2)}


def run(frames) -> dict:
    close = portfolio_close(frames)
    if close.empty:
        return {"error": "no data"}
    df = _prep(close).dropna(subset=FEATS)
    known = df.dropna(subset=["target"])
    if len(known) < 300:
        return {"error": "not enough history"}

    init = max(252, int(len(known) * 0.4))
    K = 21
    rows = []
    i = init
    while i < len(known):
        train, test = known.iloc[:i], known.iloc[i:i + K]
        if test.empty:
            break
        ytr = train["target"].values
        # HAR (OLS)
        Ah = np.column_stack([np.ones(len(train))] + [train[f].values for f in HAR_FEATS])
        coef, *_ = np.linalg.lstsq(Ah, ytr, rcond=None)
        Ah_te = np.column_stack([np.ones(len(test))] + [test[f].values for f in HAR_FEATS])
        har = Ah_te @ coef
        # GBM
        gbm = HistGradientBoostingRegressor(max_depth=3, max_iter=150, learning_rate=0.06,
                                            l2_regularization=1.0, random_state=0)
        gbm.fit(train[FEATS].values, ytr)
        gp = gbm.predict(test[FEATS].values)
        har = np.clip(har, 0, None)        # volatility cannot be negative
        gp = np.clip(gp, 0, None)
        base = test["rv22"].values
        for j in range(len(test)):
            rows.append((test.index[j], float(test["target"].values[j]),
                         float(har[j]), float(gp[j]), float(base[j])))
        i += K

    res = pd.DataFrame(rows, columns=["date", "actual", "har", "gbm", "baseline"])
    metrics = {
        "baseline": _metrics(res["actual"], res["baseline"]),
        "har": _metrics(res["actual"], res["har"]),
        "gbm": _metrics(res["actual"], res["gbm"]),
    }

    # latest forecast: train on all known, predict the most recent (target-less) row
    Xall, yall = known[FEATS].values, known["target"].values
    gbm_f = HistGradientBoostingRegressor(max_depth=3, max_iter=150, learning_rate=0.06,
                                          l2_regularization=1.0, random_state=0).fit(Xall, yall)
    last = df[FEATS].iloc[[-1]].values
    fc = float(np.clip(gbm_f.predict(last)[0], 0, 500))
    hist = known["target"].values
    pct = float((hist < fc).mean() * 100)

    # downsample series for payload (keep most recent ~360)
    res = res.tail(360)
    return {
        "horizon": H,
        "symbols_used": [s for s, f in frames.items() if f is not None],
        "series": {
            "dates": [d.strftime("%Y-%m-%d") for d in res["date"]],
            "actual": [round(x, 2) for x in res["actual"]],
            "gbm": [round(x, 2) for x in res["gbm"]],
            "har": [round(x, 2) for x in res["har"]],
            "baseline": [round(x, 2) for x in res["baseline"]],
        },
        "metrics": metrics,
        "n_test": len(rows),
        "forecast": {"value": round(fc, 2), "percentile": round(pct, 1),
                     "as_of": df.index[-1].strftime("%Y-%m-%d")},
    }
