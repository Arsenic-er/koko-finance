# Koko Finance

An interactive quantitative-analysis web platform with two modules:

1. **Volume Anomaly Return Analysis** — detects volume surge / shrink (放量/缩量)
   events and their forward 1–30 day returns across five markets, plus seasonality,
   correlation and a walk-forward ML volatility forecast.
2. **Market Sentiment Analysis** — enter a ticker, auto-fetch news, score it with a
   local FinBERT model, and render an interactive sentiment report (with batch
   analysis and a sentiment backtest).

Stack: **FastAPI + Apache ECharts (vendored) + FinBERT (transformers/PyTorch, CPU)**,
fully Dockerized, exposed publicly via an ngrok tunnel. CPU-only — it never uses a GPU.

---

## Quick start (any server with Docker + outbound HTTPS, no sudo needed)

```bash
cp .env.example .env          # put your NGROK_AUTHTOKEN in it (+ optional NGROK_DOMAIN)
./deploy.sh                   # builds the image, starts web + tunnel, prints the public URL
```

`deploy.sh` installs the docker-compose plugin (user-local), fetches the ECharts
libraries if missing, builds the image (Python deps + CPU PyTorch + transformers),
and starts the stack. First build takes a few minutes; FinBERT models (~500 MB)
download from HuggingFace on the first sentiment request and are cached on disk.

Local dev without Docker:
```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload      # http://127.0.0.1:8000
```

Repackage to move it: `./pack.sh` → a portable `.tgz` (excludes secrets & caches).

---

## Architecture

```
backend/
  app.py            FastAPI: all endpoints + static SPA mount + 12h disk cache
  engine.py         volume-anomaly analysis (the volume module's core)
  search.py         bilingual + simplified/traditional search (OpenCC) -> symbol/market
  advanced.py       seasonality (year x month) + correlation (pairwise)
  mlvol.py          walk-forward volatility forecast (HAR + gradient boosting + baseline)
  news.py           news fetcher (EastMoney/akshare, yfinance, Google News RSS)
  sentiment.py      FinBERT sentiment engine — lazy-loaded, auto-unloads when idle
  sentibacktest.py  3-strategy sentiment backtest
  markets/*.py      data adapters: us / cn / tw / crypto / forex
frontend/
  index.html                 shell (language splash -> module chooser -> app)
  assets/app.js              volume module + shared state/i18n/chart helpers
  assets/sent.js             sentiment module
  assets/app.css             dark theme, responsive
  assets/echarts*.min.js     vendored (no runtime CDN)
Dockerfile  docker-compose.yml  deploy.sh  pack.sh
.env.example                 template for NGROK_AUTHTOKEN / NGROK_DOMAIN
HANDOFF.md                   deep technical handoff for developers / another AI
```

**API:** `/api/health` · `/api/analyze` · `/api/search` · `/api/advanced` ·
`/api/correlation` · `/api/mlvol` · `/api/news` · `/api/sentiment` · `/api/sentibacktest`

**Data sources (all free):** yfinance 1.4.1 (US/TW/crypto/forex), akshare 1.18.64
(A-share stocks + ETFs + news), Google News RSS (news fallback), FinBERT models
(`yiyanghkust/finbert-tone-chinese` + `yiyanghkust/finbert-tone`). Results cached 12h.

**Resource safety:** the web container is capped at `cpus: 2.0, mem: 3g,
cpu_shares: 256`, and FinBERT models are loaded on demand and freed after 30 min
idle, so the app never disturbs other GPU/DL jobs on the host.

---

## Honest limitations

- The volume module is a **backtested statistical pattern** tool — not real-time
  sentiment, and it does **not** predict price direction (only volatility is
  forecastable, and only modestly).
- The sentiment module depends on **free news APIs, which only expose recent news**
  (typically the last few weeks). The sentiment backtest window is therefore short —
  a data ceiling, not a bug.
- Public with no login by design; secrets live only in `.env` (never committed).
- ngrok is unreliable inside mainland China; a paid offshore VPS + `frp` relay is
  the upgrade path.

For every deeper detail (module internals, dev workflow, backlog), see **HANDOFF.md**.

---
---

# Koko Finance（中文说明）

一个交互式量化分析网页平台，包含两大模块：

1. **成交量异常收益分析** —— 检测放量/缩量事件及其未来 1–30 日收益规律，覆盖五个市场
   （美股 / A股 / 台股 / 币圈 / 汇率），另有 3D 曲面、季节性、相关性、机器学习波动预测。
2. **市场情绪分析** —— 输入股票代码，自动抓取新闻，用本地 FinBERT 模型判断情绪，生成交互式
   情绪报告（含批量分析与情绪回测）。

技术栈：**FastAPI + Apache ECharts（本地内置）+ FinBERT（transformers/PyTorch，CPU 推理）**，
全程 Docker 化，通过 ngrok 隧道对外公开访问。**纯 CPU，不占用 GPU。**

---

## 快速开始（任何装了 Docker、能出站 HTTPS 的服务器，无需 sudo）

```bash
cp .env.example .env          # 填入你的 NGROK_AUTHTOKEN（可选填固定域名 NGROK_DOMAIN）
./deploy.sh                   # 构建镜像、启动 web + 隧道、打印公网网址
```

`deploy.sh` 会把 docker-compose 插件装到用户目录、缺 ECharts 库时自动下载、构建镜像
（Python 依赖 + CPU 版 PyTorch + transformers）并启动。首次构建需几分钟；FinBERT 模型
（约 500MB）在**首次进行情绪分析时**从 HuggingFace 下载并缓存到磁盘。

不用 Docker 的本地开发：
```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload      # http://127.0.0.1:8000
```

迁移打包：`./pack.sh` → 生成可移植 `.tgz`（不含密钥与缓存）。

---

## 架构

```
backend/
  app.py            FastAPI：全部接口 + 静态页面挂载 + 12 小时磁盘缓存
  engine.py         成交量异常分析（量价模块核心）
  search.py         中英 + 简繁搜索（OpenCC）-> 代码/市场
  advanced.py       季节性（年 x 月）+ 相关性（两两）
  mlvol.py          滚动样本外波动预测（HAR + 梯度提升 + 朴素基准）
  news.py           新闻抓取（东方财富/akshare、yfinance、Google News RSS）
  sentiment.py      FinBERT 情感引擎 —— 懒加载，空闲自动卸载
  sentibacktest.py  三策略情绪回测
  markets/*.py      数据适配器：美股/A股/台股/币圈/汇率
frontend/
  index.html                 骨架（语言选择 -> 模块选择 -> 应用）
  assets/app.js              量价模块 + 共享状态/多语言/图表工具
  assets/sent.js             情绪模块
  assets/app.css             深色主题、响应式
  assets/echarts*.min.js     本地内置（不依赖外部 CDN）
Dockerfile  docker-compose.yml  deploy.sh  pack.sh
.env.example                 NGROK_AUTHTOKEN / NGROK_DOMAIN 模板
HANDOFF.md                   面向开发者/其他 AI 的深度技术交接文档
```

**接口：** `/api/health` · `/api/analyze` · `/api/search` · `/api/advanced` ·
`/api/correlation` · `/api/mlvol` · `/api/news` · `/api/sentiment` · `/api/sentibacktest`

**数据源（全免费）：** yfinance 1.4.1（美股/台股/币圈/汇率）、akshare 1.18.64
（A股个股+ETF+新闻）、Google News RSS（新闻兜底）、FinBERT 模型
（`yiyanghkust/finbert-tone-chinese` + `yiyanghkust/finbert-tone`）。结果缓存 12 小时。

**资源保护：** web 容器锁死 `cpus: 2.0, mem: 3g, cpu_shares: 256`，FinBERT 模型按需加载、
空闲 30 分钟后自动释放，绝不干扰宿主机上的其他 GPU/深度学习任务。

---

## 诚实的边界

- 量价模块是**基于历史的统计规律**工具——不是实时情绪，也**不预测涨跌**（只有波动可预测，
  且效果有限）。
- 情绪模块依赖**免费新闻接口，只能拿到近期新闻**（通常最近几周），所以情绪回测窗口很短——
  这是数据天花板，不是故障。
- 默认公开、无需登录；密钥只存在 `.env` 中（绝不提交进仓库）。
- ngrok 在中国大陆不稳定；升级方案是付费的海外 VPS + `frp` 中转。

更多细节（模块内部实现、开发流程、待办清单）见 **HANDOFF.md**。
