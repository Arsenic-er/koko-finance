# Koko Finance — start here

**Read `HANDOFF.md` for the full picture.** This is a quick orientation.

This folder is a complete, deployable web app: **Koko Finance** (页面标题「成交量异常收益分析」)
— detects volume-anomaly (放量/缩量) events and their forward 1–30d returns across 5 markets
(美股/A股/台股/币圈/汇率), 3 languages (简/繁/英), 10 tabs, plus seasonality / correlation /
ML volatility-forecast tabs. Stack: **FastAPI + ECharts (vendored), Dockerized, public via ngrok**.

## Critical facts
- **Live now**: server `ssh jaist-gpu` at `~/stork_emotional`, public URL
  **https://mammal-alarm-stress.ngrok-free.dev** (running; no need to restart).
- **Run here / new server**: `cp .env.example .env` (set `NGROK_AUTHTOKEN`) → `./deploy.sh`.
- **Dev loop**: edit `backend/` or `frontend/` → on the server they're volume-mounted with
  `uvicorn --reload`, so frontend = refresh, backend = auto-reload; only `requirements.txt`
  changes need `docker compose up -d --build web`. Usual flow: edit locally → `scp` to the server.
- **All frontend logic + i18n** is in `frontend/assets/app.js`. Backend split:
  `app.py` (API) · `engine.py` (volume-anomaly core) · `search.py` (简繁 search) ·
  `advanced.py` (seasonality/correlation) · `mlvol.py` (vol ML) · `markets/*` (data adapters).
- **Honesty**: it's a **backtested statistical** tool — NOT real-time sentiment, NOT a
  direction predictor. Volatility is forecastable; returns/direction are not.
- **Secrets**: `.env` is NOT in this package — recreate from `.env.example`.

## Data sources (free, pinned)
yfinance==1.4.1 (us/tw/crypto/forex; 0.2.x is broken) · akshare==1.18.64 (A股 + ETF) ·
opencc-python-reimplemented==0.1.7 (简繁) · scikit-learn==1.5.2 (vol). Results cached 12h.

See `HANDOFF.md` §10 for the backlog (A-share smart-money flows, NLP sentiment, etc.).
