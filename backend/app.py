"""Stork Emotional — Volume/Emotion analysis API."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from . import engine

APP_VERSION = "0.5.0"
ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
CACHE_DIR = ROOT / "cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_TTL = 12 * 3600  # seconds
MAX_SYMBOLS = 50       # per-request cap (anti resource-exhaustion)

app = FastAPI(title="Stork Emotional", version=APP_VERSION)


@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse({
        "ok": True,
        "service": "stork_emotional",
        "version": APP_VERSION,
        "markets": ["us", "cn", "tw", "crypto", "forex"],
        "engines_ready": {"us": True, "cn": True, "tw": True, "crypto": True, "forex": True},
    })


def _cache_path(key: str) -> Path:
    h = hashlib.md5(key.encode()).hexdigest()[:16]
    return CACHE_DIR / f"{key.split('|')[0]}_{h}.json"


@app.get("/api/search")
def search_endpoint(q: str = Query("", max_length=64), market: str = Query("", max_length=8)):
    from . import search as search_mod
    return JSONResponse({"results": search_mod.search(q, market or None)})


@app.get("/api/news")
def news_endpoint(
    market: str = Query("us", pattern="^(us|cn|tw)$"),
    symbol: str = Query(..., min_length=1, max_length=16),
    refresh: int = Query(0),
):
    from . import news
    return JSONResponse(news.fetch(symbol, market, bool(refresh)))


@app.get("/api/sentiment")
def sentiment_endpoint(
    market: str = Query("us", pattern="^(us|cn|tw)$"),
    symbol: str = Query(..., min_length=1, max_length=16),
    refresh: int = Query(0),
):
    from . import sentiment
    return JSONResponse(sentiment.analyze(symbol, market, bool(refresh)))


@app.get("/api/sentibacktest")
def sentibacktest_endpoint(
    market: str = Query("us", pattern="^(us|cn|tw)$"),
    symbol: str = Query(..., min_length=1, max_length=16),
    refresh: int = Query(0),
):
    from . import sentibacktest
    return JSONResponse(sentibacktest.run(symbol, market, bool(refresh)))


def _get_frames(market: str, syms: list, period: str) -> dict:
    if market == "us":
        from .markets import us
        return us.fetch(syms or us.DEFAULT_SYMBOLS, period)
    if market == "cn":
        from .markets import cn
        return cn.fetch([s.lower() for s in syms] or cn.DEFAULT_SYMBOLS, period)
    if market == "tw":
        from .markets import tw
        return tw.fetch(syms or tw.DEFAULT_SYMBOLS, period)
    if market == "crypto":
        from .markets import crypto
        return crypto.fetch(syms or crypto.DEFAULT_SYMBOLS, period)
    if market == "forex":
        from .markets import forex
        return forex.fetch(syms or forex.DEFAULT_SYMBOLS, period)
    return {}


@app.get("/api/advanced")
def advanced(
    market: str = Query("us", pattern="^(us|cn|tw|crypto|forex)$"),
    symbols: str = Query("", max_length=2000),
    refresh: int = Query(0),
):
    from . import advanced as adv
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()][:MAX_SYMBOLS]
    key = f"adv-{market}|{','.join(sorted(syms)) or 'default'}"
    cpath = _cache_path(key)
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < CACHE_TTL:
        return JSONResponse(json.loads(cpath.read_text(encoding="utf-8")))

    frames = _get_frames(market, syms, "10y")  # long history for seasonality
    bundle = adv.analyze_advanced(frames)
    bundle["market"] = market
    bundle["symbols"] = [s for s, f in frames.items() if f is not None]
    bundle["generated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    cpath.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")
    return JSONResponse(bundle)


@app.get("/api/analyze")
def analyze(
    market: str = Query("us", pattern="^(us|cn|tw|crypto|forex)$"),
    symbols: str = Query("", max_length=2000),
    period: str = Query("2y", pattern="^(1y|2y|3y|5y)$"),
    window: int = Query(0, ge=0, le=1000),
    refresh: int = Query(0),
):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()][:MAX_SYMBOLS]
    key = f"{market}|{period}|{window}|{','.join(sorted(syms)) or 'default'}"
    cpath = _cache_path(key)

    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < CACHE_TTL:
        return JSONResponse(json.loads(cpath.read_text(encoding="utf-8")))

    extra = {"window_days": window}
    if market == "us":
        from .markets import us
        use = syms or us.DEFAULT_SYMBOLS
        frames = us.fetch(use, period)
        bundle = engine.analyze_frames(frames, {**us.PARAMS, **extra})
    elif market == "cn":
        from .markets import cn
        use = [s.lower() for s in syms] or cn.DEFAULT_SYMBOLS
        frames = cn.fetch(use, period)
        bundle = engine.analyze_frames(frames, {**cn.PARAMS, **extra})
    elif market == "tw":
        from .markets import tw
        use = syms or tw.DEFAULT_SYMBOLS
        frames = tw.fetch(use, period)
        bundle = engine.analyze_frames(frames, {**tw.PARAMS, **extra})
    elif market == "crypto":
        from .markets import crypto
        use = syms or crypto.DEFAULT_SYMBOLS
        frames = crypto.fetch(use, period)
        bundle = engine.analyze_frames(frames, {**crypto.PARAMS, **extra})
    elif market == "forex":
        from .markets import forex
        use = syms or forex.DEFAULT_SYMBOLS
        frames = forex.fetch(use, period)
        bundle = engine.analyze_frames(frames, {**forex.PARAMS, **extra})
    else:
        return JSONResponse({"error": "unknown market"}, status_code=400)

    bundle["window"] = window

    bundle["market"] = market
    bundle["period"] = period
    bundle["symbols"] = [s for s, f in frames.items() if f is not None]
    bundle["generated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    cpath.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")
    return JSONResponse(bundle)


@app.get("/api/correlation")
def correlation_endpoint(
    market: str = Query("us", pattern="^(us|cn|tw|crypto|forex)$"),
    symbols: str = Query("", max_length=2000),
    refresh: int = Query(0),
):
    from . import advanced as adv
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()][:MAX_SYMBOLS]
    if len(syms) < 2:
        return JSONResponse({"symbols": [], "matrix": [], "market": market})
    key = f"corr-{market}|{','.join(sorted(syms))}"
    cpath = _cache_path(key)
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < CACHE_TTL:
        return JSONResponse(json.loads(cpath.read_text(encoding="utf-8")))
    frames = _get_frames(market, syms, "2y")
    res = adv.correlation(frames, 252)
    res["market"] = market
    cpath.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
    return JSONResponse(res)


@app.get("/api/mlvol")
def mlvol_endpoint(
    market: str = Query("us", pattern="^(us|cn|tw|crypto|forex)$"),
    symbols: str = Query("", max_length=2000),
    refresh: int = Query(0),
):
    from . import mlvol
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()][:MAX_SYMBOLS]
    key = f"mlvol-{market}|{','.join(sorted(syms)) or 'default'}"
    cpath = _cache_path(key)
    if not refresh and cpath.exists() and (time.time() - cpath.stat().st_mtime) < CACHE_TTL:
        return JSONResponse(json.loads(cpath.read_text(encoding="utf-8")))

    frames = _get_frames(market, syms, "5y")
    bundle = mlvol.run(frames)
    bundle["market"] = market
    bundle["generated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    cpath.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")
    return JSONResponse(bundle)


# Serve the SPA (frontend/) at root. API routes above take precedence.
if FRONTEND_DIR.exists():
    from fastapi.responses import FileResponse

    @app.get("/")
    def index():
        # index.html must never be cached — it carries the ?v= asset versions.
        return FileResponse(str(FRONTEND_DIR / "index.html"),
                            headers={"Cache-Control": "no-cache, must-revalidate"})

    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
