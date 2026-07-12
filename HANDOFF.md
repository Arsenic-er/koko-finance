# Koko Finance — Handoff / AI Context

> Read this first. It tells another AI (or human) exactly what this project is,
> how it's built, how to run it, and what was decided & deliberately left out.
> The folder you're looking at **is** the whole, self-contained, deployable app.

---

## 0. Update (checkpoint) — TWO modules now

The app has a **language splash → module chooser → app** flow. Header has a
量价/情绪 (Volume/Sentiment) toggle. `state.module` + `body.mod-*` CSS gate which
chrome shows. Two modules:

- **Volume** (original) — everything in sections 1–11 below; UI in `assets/app.js`.
- **Sentiment** (added later) — UI in `assets/app.js` shell + **`assets/sent.js`**.
  Backend: `news.py` (fetch), `sentiment.py` (FinBERT, lazy-load + 30-min idle
  auto-unload, pluggable model list), `sentibacktest.py` (3-strategy backtest).
  Endpoints: `/api/news`, `/api/sentiment`, `/api/sentibacktest`.
  Three sub-modes: single report (8 charts + news feed + timeline), batch (≤20,
  progress + ranking), backtest (buy&hold / pure-sentiment / sentiment+MA over the
  news-covered window only). Each sentiment input reuses `attachStockSearch`
  (shared localStorage history with the volume module) and `resolveToken`
  (zh/en name → {symbol, market}).

**Cache-busting:** `index.html` references assets as `?v=N`; `const BUILD` in
app.js is shown in the footer; `/` is served with `Cache-Control: no-cache`.
Bump the `?v=` AND `BUILD` together on every frontend change (browsers 304-cache
aggressively — this was the cause of several "blank page" reports).

**Verify UI fixes by computed visibility** (`el.offsetParent !== null`), not just
element existence — a `.controls` class-name collision once hid the sentiment
inputs while they still "existed" in the DOM.

The Dockerfile installs **CPU PyTorch + transformers**; image is ~3 GB and
`mem_limit` is 3g. FinBERT models cache under `cache/hf/` (a volume). Everything
below (sections 1–11) still describes the Volume module in full.

---

## 1. What it is

**Koko Finance** (页面标题「成交量异常收益分析」/ Volume Anomaly Return Analysis) is an
interactive web app that, for a basket (or a single name), detects **volume-anomaly
events** (放量 surge / 缩量 shrink) and measures their **forward 1–30 day returns**,
sliced by market-state scenarios (价位 高/低 × 行情 牛/熊/震荡). It also has advanced
analytics: **seasonality calendar**, **correlation matrix**, and a **walk-forward
volatility ML forecast**.

- 5 markets: **美股 us / A股 cn / 台股 tw / 币圈 crypto / 汇率 forex**
- 3 languages: **简体 zh / 繁體 tw / English en** (with a language entry splash)
- 10 tabs (see §5). Search any stock/ETF/coin/FX pair by Chinese (简/繁), English, or code.
- Stack: **FastAPI + Apache ECharts (vendored)**, fully **Dockerized**, public via **ngrok**.

It is a **backtested statistical tool**, NOT a real-time "today's sentiment" gauge, and
NOT a direction predictor. Be honest about this with the user.

---

## 2. Live deployment (already running — do not need to restart)

- **Server:** `ssh jaist-gpu` ( = `ssh ubuntu@150.65.181.215` ), project at `~/stork_emotional`
- **Public URL (fixed):** https://mammal-alarm-stress.ngrok-free.dev  (ngrok reserved domain)
- Runs as 2 Docker containers: `stork_web` (FastAPI) + `stork_tunnel` (ngrok).
- The server has its own `.env` (NGROK_AUTHTOKEN + NGROK_DOMAIN). **This local package
  excludes `.env`** (secret) — recreate it from `.env.example` to deploy elsewhere.
- ngrok free interstitial: a browser's first visit shows a "Visit Site" warning page; click through. For curl/API, send header `ngrok-skip-browser-warning: 1`.

The folder name (`finance` / `stork_emotional`) is cosmetic; nothing depends on it.

---

## 3. Run it

### A new server (or fresh machine) — Docker, no sudo needed
```bash
cp .env.example .env          # set NGROK_AUTHTOKEN (+ optional NGROK_DOMAIN for a fixed URL)
./deploy.sh                   # installs compose plugin, fetches echarts if missing, builds, runs, prints URL
```
Requirements: Docker usable without sudo + outbound HTTPS. No domain? leave NGROK_DOMAIN empty → random quick-tunnel URL.

### Local dev without Docker
```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload          # run from the project root
# open http://127.0.0.1:8000
```

### Package to move it
```bash
./pack.sh                     # -> a .tgz (excludes .env, regenerable caches)
```

---

## 4. Architecture & files

```
backend/
  app.py            FastAPI app + all endpoints + static SPA mount + disk cache
  engine.py         shared volume-anomaly analysis (the core 7 tabs' data)
  search.py         bilingual + 简繁 search (OpenCC) → symbol/market; stocks/ETF/crypto/FX
  advanced.py       seasonality (year×month) + correlation (pairwise)
  mlvol.py          walk-forward volatility forecast (HAR + GBM + baseline)
  markets/us.py     US        (yfinance)
  markets/cn.py     A股       (akshare; stocks + ETFs via fund_etf_hist_em)
  markets/tw.py     台股      (yfinance, .TW)
  markets/crypto.py 币圈      (yfinance, BTC-USD style)
  markets/forex.py  汇率      (yfinance, EURUSD=X; NO volume → volatility signal)
  requirements.txt
frontend/
  index.html        shell (splash, header, search, scale selector, glossary, tabs, view)
  assets/app.js     ALL logic: state, i18n (I18N + Object.assign blocks), ECharts renderers
  assets/app.css    dark theme + responsive
  assets/echarts.min.js, echarts-gl.min.js   vendored (no runtime CDN)
cache/
  cn_names.json     full A-share code→name index (akshare snapshot; regenerable)
  etf_names.json    A-share ETF code→name index (regenerable)
  (analyze/adv/corr/mlvol result caches are created at runtime, 12h TTL)
Dockerfile  docker-compose.yml  deploy.sh  pack.sh  README.md  .env.example
```

### API endpoints (all GET, JSON)
- `/api/health`
- `/api/analyze?market=&symbols=&period=2y&window=90&refresh=0` — main bundle for the 7 core tabs.
  `symbols` empty = market's DEFAULT_SYMBOLS (20). `window` = event-recency filter in days (0 = all). Capped at 50 symbols.
- `/api/search?q=&market=` — resolve free text (zh/简繁/en/code) → `{results:[{symbol,market,name_zh,name_en}]}`. Current market sorted first.
- `/api/advanced?market=&symbols=` — `{seasonality, correlation}` from a 10y fetch.
- `/api/correlation?market=&symbols=` — pairwise correlation for an explicit symbol list (the correlation tab's comparison set). Needs ≥2 symbols.
- `/api/mlvol?market=&symbols=` — `{metrics, series, forecast}` volatility forecast (5y fetch).

### engine.py (the heart)
`classify_frame` adds, per day:
- **vol_ratio**: intensity / its 20-day MA. Intensity = **volume** (stocks/crypto) or **daily range %** when `PARAMS["signal"]=="volatility"` (forex, which has no volume).
  - 放量 if ratio ≥ vol_high (2.0); 缩量 if ≤ vol_low (0.5).
- **position** 高位/低位: price percentile in trailing `pos_window` (120d), split at 0.5.
- **market** 牛/熊/震荡: by `trend_window` (60d) return vs bull_th/bear_th.
`analyze_frames` then computes forward 1–30d returns per event and aggregates into:
overview (event counts, best combo, distributions), return_curves, heatmap, radar, compare_30d, insights.
`window_days` filters events by recency. `eff_min_best` scales the best/worst sample threshold with universe size. **Internal labels are always 放量/缩量**; the frontend relabels them to **波动放大/波动收缩** for the forex market.

---

## 5. The 10 tabs (frontend `app.js`)

| key | 中文 | what |
|-----|------|------|
| overview | 概览 | stat cards + 行情/位置分布 donuts |
| returns | 收益曲线 | future 1–30d avg-return lines per scenario (toggle 放量/缩量) |
| surface3d | 3D曲面 | echarts-gl dual 3D return surfaces |
| radar | 雷达 | combos × {1/5/10/30d win-rate, 30d return} |
| heatmap | 热力 | 位置×行情 grid, cell = "count \| 30d%" |
| compare | 对比 | 放量 vs 缩量 30d bars + insight cards |
| insights | 发现 | best/worst cards + full ranking bar |
| seasonality | 季节性 | year×month return calendar (10y) + monthly avg |
| correlation | 相关性 | comparison-set heatmap (chips + add-search) |
| mlvol | 波动预测 | walk-forward vol forecast (HAR/GBM/baseline) |

Frontend state: `market, lang, tab, window, symbols{per market}, corrSet{per market}`.
Other UI: language splash, per-tab **ⓘ glossary** (hover/tap, 1s fade), content fade on switch,
**search box with localStorage history** + system recommendations, time-window selector
(近1季/半年/1年/全部, default 近1季), responsive 2-row tabs.

---

## 6. Data sources (all free) & pins

- **yfinance 1.4.1** — us/tw/crypto/forex. ⚠️ 0.2.x is BROKEN against Yahoo; must be ≥1.4.
- **akshare 1.18.64** — A-share stocks (`stock_zh_a_hist`) + ETFs (`fund_etf_hist_em`, codes starting 1/5) + name indexes.
- **opencc-python-reimplemented 0.1.7** — 简↔繁 normalization for search.
- **scikit-learn 1.5.2** — HistGradientBoosting for vol forecast.
- Results cached 12h on disk (`cache/`). `MAX_SYMBOLS=50`, `CACHE_TTL` in app.py.

### Per-market logic (markets/*.py `PARAMS` + `DEFAULT_SYMBOLS`)
- us: no price limit. bull/bear ±10%.
- cn: ±10% limit world; bull/bear ±15%; ETF codes auto-routed to fund endpoint.
- tw: `.TW` suffix; ±10%; bull/bear ±12%.
- crypto: `BTC-USD` style, 24/7; bull/bear ±20%.
- forex: `EURUSD=X` style; **no volume → `signal="volatility"`** (uses daily range); bull/bear ±5%; UI shows 波动放大/收缩.

---

## 7. Dev workflow (important for editing)

- On the **server**, `backend/` and `frontend/` are **volume-mounted** with `uvicorn --reload`.
  So: edit a file on the server (or `scp` it there) → **frontend changes apply on browser
  refresh; backend changes auto-reload**. Only **dependency changes** (requirements.txt)
  need a rebuild: `cd ~/stork_emotional && docker compose up -d --build web`.
- The usual loop in this project: **edit locally → `scp` to `jaist-gpu:~/stork_emotional/...`
  → refresh** (frontend) or wait for reload (backend).
- All chart logic + i18n is in `frontend/assets/app.js`. i18n = the `I18N` object plus several
  `Object.assign(I18N.zh/tw/en, {...})` blocks. Add a key to all three when adding UI text.
- Windows note: passing Chinese on the Git Bash command line mangles it — test Chinese via a
  UTF-8 `.py` file run inside the container, not inline `curl`/`-c`.

---

## 8. Resource & security posture

- web container hard-capped: `cpus: 2.0, mem_limit: 2g, cpu_shares: 256`. App is **CPU-only
  (no GPU)** — it cannot disturb the host's GPU/DL jobs. Tunnel capped at 0.5 CPU / 256MB.
- **Public, no auth** (user's choice). No database. Secrets (`.env`) are NOT web-served
  (only `frontend/` is static-mounted). Inputs validated: `market` regex, `period` whitelist,
  `symbols`/`q` length caps, 50-symbol cap. No shell/SQL injection surface (verified).

---

## 9. Honest limitations (tell the user)

- It's a **backtested statistical pattern**, not live sentiment, not a direction call.
- **Daily-bar** data; the analysis only meaningfully changes ~once per trading day → 12h cache is plenty. 1-minute refresh would be pointless on this design and risks data-source rate-limiting.
- Short look-backs (<1 quarter) are too sparse → only 近1季/半年/1年/全部 are offered.
- **Vol forecast**: GBM beats the naive "tomorrow≈today vol" baseline clearly on **US**
  (OOS R²≈0.15), marginal on diversified baskets / FX. It forecasts **volatility magnitude,
  not direction**, and excludes trading costs. Single liquid names forecast better than baskets.
- **Correlation** comparison is **within one market** (US/A/TW/crypto/FX have different calendars).
- **China access**: ngrok is unreliable in mainland China. The ready upgrade (not built) is an
  offshore VPS + `frp` relay. ngrok free allows only 1 simultaneous tunnel per account.

---

## 10. Discussed but NOT built (backlog / good next steps)

- **A-share "smart money" via akshare** (all free): 北向资金, 主力/大单资金流, 融资融券余额,
  龙虎榜, 股东户数/筹码集中度 — biggest retail-vs-institution info gap.
- **NLP news/social sentiment** as a feature — this is where the H100/deep learning would
  actually pay off (vs gradient boosting on tabular price data, which usually wins for price-only).
- A real-time **"today's sentiment" snapshot** (separate, lightweight, frequent refresh).
- More ML: market-regime detection (HMM/clustering), cross-sectional ranking.
- Replicate more modules from a reference video (user was sending screenshots).
- Stable China access (VPS + frp). Cross-market correlation. Nicer name labels on the correlation axes.
- Lower vol-forecast default to a single symbol; per-symbol vol page.

---

## 11. One-line orientation for the next AI

> FastAPI backend (`backend/app.py` → engine/search/advanced/mlvol + markets/*) serving a
> vanilla-JS ECharts SPA (`frontend/assets/app.js`), Dockerized, live on `jaist-gpu` at a fixed
> ngrok URL. Edit → scp to server → refresh. Add features as new endpoints + new tabs. Keep the
> honesty: it backtests volume-anomaly patterns + advanced analytics; it does not predict direction.
