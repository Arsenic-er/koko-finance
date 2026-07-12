/* Sentiment module frontend. Loads after app.js and shares its globals
   (state, I18N, t, mkChart, disposeCharts, C, baseTooltip, MB). */
"use strict";

/* ---------- i18n ---------- */
Object.assign(I18N.zh, {
  sentSearchPh: "搜索股票：贵州茅台 / Apple / 2330（支持 A股/美股/台股）",
  sentHint: "输入代码或名称，AI 抓取新闻并分析市场情绪（首次分析需加载模型，约 10~20 秒）",
  sentPick: "热门示例：", sentLoading: "抓取新闻并进行 AI 情感分析中…（首次需加载模型，请稍候）",
  sentNoNews: "没有抓到该标的的相关新闻，换一个试试", sentErr: "分析失败",
  sScore: "综合情感评分", sConf: "分析置信度", sNewsN: "新闻数量", sPosR: "正面新闻占比", sImpact: "市场影响力",
  sBandArr: ["积极", "中性偏强", "中性", "中性偏弱", "消极"],
  sSumT: "分析总结", sExpT: "市场预期", sTrdT: "趋势预测",
  sSumTpl: "基于 {n} 条新闻，整体情感{band}（{score} 分）：正面 {pos}%、负面 {neg}%、中性 {neu}%。",
  sExpHigh: "市场预期偏乐观，正面因素占主导，但需留意情绪透支后的回落风险。",
  sExpMid: "市场预期偏谨慎，多空信息交织，短期方向有待确认。",
  sExpLow: "市场预期偏悲观，利空因素仍需消化，短期波动风险较高。",
  sTrdUp: "近期情绪呈上升趋势，关注正面催化是否持续。",
  sTrdFlat: "近期情绪相对平稳，缺乏明确方向性催化，建议保持跟踪。",
  sTrdDown: "近期情绪呈下降趋势，需警惕负面因素持续发酵。",
  sGaugeScore: "综合评分", sGaugeConf: "置信度", sGaugeImpact: "影响力", sGaugeRisk: "风险",
  sDistT: "情绪分布", sSrcT: "信息来源分布", sRadarT: "六维情感雷达", sRankT: "主题情感评分排行",
  sTrendT: "情感时间趋势（含关键事件标注）", sIRT: "影响力 & 风险", sFeedT: "实时新闻情感流", sTLT: "关键事件时间线",
  sPos: "正面", sNeg: "负面", sNeu: "中性", sRiskArr: { low: "低", mid: "中", high: "高" },
  sTierArr: { official: "官方公告", mainstream: "主流媒体", financial: "财经媒体", other: "自媒体/其他" },
  sThemeName: { operate: "公司经营", finance: "财务表现", compete: "市场竞争", product: "产品技术", policy: "行业政策", capital: "资本市场" },
  sModels: "本地模型", sSent: "情感",
});
Object.assign(I18N.tw, {
  sentSearchPh: "搜尋股票：台積電 / Apple / 600519（支援 A股/美股/台股）",
  sentHint: "輸入代碼或名稱，AI 抓取新聞並分析市場情緒（首次分析需載入模型，約 10~20 秒）",
  sentPick: "熱門示例：", sentLoading: "抓取新聞並進行 AI 情感分析中…（首次需載入模型，請稍候）",
  sentNoNews: "沒有抓到該標的的相關新聞，換一個試試", sentErr: "分析失敗",
  sScore: "綜合情感評分", sConf: "分析置信度", sNewsN: "新聞數量", sPosR: "正面新聞佔比", sImpact: "市場影響力",
  sBandArr: ["積極", "中性偏強", "中性", "中性偏弱", "消極"],
  sSumT: "分析總結", sExpT: "市場預期", sTrdT: "趨勢預測",
  sSumTpl: "基於 {n} 條新聞，整體情感{band}（{score} 分）：正面 {pos}%、負面 {neg}%、中性 {neu}%。",
  sExpHigh: "市場預期偏樂觀，正面因素佔主導，但需留意情緒透支後的回落風險。",
  sExpMid: "市場預期偏謹慎，多空信息交織，短期方向有待確認。",
  sExpLow: "市場預期偏悲觀，利空因素仍需消化，短期波動風險較高。",
  sTrdUp: "近期情緒呈上升趨勢，關注正面催化是否持續。",
  sTrdFlat: "近期情緒相對平穩，缺乏明確方向性催化，建議保持跟蹤。",
  sTrdDown: "近期情緒呈下降趨勢，需警惕負面因素持續發酵。",
  sGaugeScore: "綜合評分", sGaugeConf: "置信度", sGaugeImpact: "影響力", sGaugeRisk: "風險",
  sDistT: "情緒分佈", sSrcT: "信息來源分佈", sRadarT: "六維情感雷達", sRankT: "主題情感評分排行",
  sTrendT: "情感時間趨勢（含關鍵事件標註）", sIRT: "影響力 & 風險", sFeedT: "即時新聞情感流", sTLT: "關鍵事件時間線",
  sPos: "正面", sNeg: "負面", sNeu: "中性", sRiskArr: { low: "低", mid: "中", high: "高" },
  sTierArr: { official: "官方公告", mainstream: "主流媒體", financial: "財經媒體", other: "自媒體/其他" },
  sThemeName: { operate: "公司經營", finance: "財務表現", compete: "市場競爭", product: "產品技術", policy: "行業政策", capital: "資本市場" },
  sModels: "本地模型", sSent: "情感",
});
Object.assign(I18N.en, {
  sentSearchPh: "Search a stock: Apple / 贵州茅台 / 2330 (US / CN / TW)",
  sentHint: "Enter a ticker or name — AI fetches news and scores market sentiment (first run loads the model, ~10–20s)",
  sentPick: "Try:", sentLoading: "Fetching news & running AI sentiment… (first run loads the model)",
  sentNoNews: "No news found for this name — try another", sentErr: "Analysis failed",
  sScore: "Composite Sentiment", sConf: "Confidence", sNewsN: "News Count", sPosR: "Positive Share", sImpact: "Market Impact",
  sBandArr: ["Bullish", "Lean Bullish", "Neutral", "Lean Bearish", "Bearish"],
  sSumT: "Summary", sExpT: "Market Expectation", sTrdT: "Trend Outlook",
  sSumTpl: "Based on {n} news items, overall sentiment is {band} ({score}): {pos}% positive, {neg}% negative, {neu}% neutral.",
  sExpHigh: "Expectations lean optimistic — positive drivers dominate; watch for sentiment overheating.",
  sExpMid: "Expectations are cautious — mixed signals; near-term direction unconfirmed.",
  sExpLow: "Expectations lean pessimistic — negatives still being digested; elevated short-term volatility risk.",
  sTrdUp: "Sentiment is trending up — watch whether positive catalysts persist.",
  sTrdFlat: "Sentiment is flat — no clear directional catalyst; keep monitoring.",
  sTrdDown: "Sentiment is trending down — beware of compounding negatives.",
  sGaugeScore: "Composite", sGaugeConf: "Confidence", sGaugeImpact: "Impact", sGaugeRisk: "Risk",
  sDistT: "Sentiment Mix", sSrcT: "Source Mix", sRadarT: "Six-Theme Radar", sRankT: "Theme Score Ranking",
  sTrendT: "Sentiment Trend (key events annotated)", sIRT: "Impact & Risk", sFeedT: "News Sentiment Feed", sTLT: "Key Event Timeline",
  sPos: "Positive", sNeg: "Negative", sNeu: "Neutral", sRiskArr: { low: "Low", mid: "Mid", high: "High" },
  sTierArr: { official: "Official", mainstream: "Mainstream", financial: "Financial media", other: "Other" },
  sThemeName: { operate: "Operations", finance: "Financials", compete: "Competition", product: "Product & Tech", policy: "Policy", capital: "Capital Markets" },
  sModels: "Local models", sSent: "sentiment",
});

Object.assign(I18N.zh, {
  sModeBt: "情绪回测", sBtPh: "输入单只代码：600519 / AAPL / 2330", sBtGo: "开始回测",
  sBtWindow: "回测区间", sBtDays: "个交易日", sBtCurve: "策略净值曲线（起点=100）", sBtSent: "每日情绪",
  sBtStrat: { bh: "买入持有", sent: "纯情绪", sma: "情绪+均线" },
  sBtRet: "收益率", sBtMdd: "最大回撤", sBtSharpe: "夏普比率", sBtTrades: "调仓次数",
  sBtShort: "新闻只覆盖了 {n} 个交易日，太短无法回测——免费新闻接口只提供最近的新闻，这是数据天花板，不是故障。可试新闻多的活跃标的。",
  sBtNote: "⚠️ 诚实说明：回测区间=新闻覆盖期（通常几周），非长期研究；信号用前一日情绪（无未来函数）；未计交易成本；样本极小，结论仅供参考。",
  sBtNoPrice: "拿不到该标的的行情数据",
  sModeSingle: "单只分析", sModeBatch: "批量分析",
  sBatchPh: "输入多只代码，逗号分隔，最多20只：600519,AAPL,2330,TSLA",
  sBatchGo: "开始批量", sBatchHint: "自动识别每只所属市场；完成后按情绪评分排行，点任意一行看完整报告",
  sBatchProg: "分析进度", sBatchFailN: "{n} 只失败或无新闻",
  sTblH: ["#", "名称", "市场", "评分", "情绪", "正面", "负面", "新闻", "风险"],
});
Object.assign(I18N.tw, {
  sModeBt: "情緒回測", sBtPh: "輸入單只代碼：2330 / AAPL / 600519", sBtGo: "開始回測",
  sBtWindow: "回測區間", sBtDays: "個交易日", sBtCurve: "策略淨值曲線（起點=100）", sBtSent: "每日情緒",
  sBtStrat: { bh: "買入持有", sent: "純情緒", sma: "情緒+均線" },
  sBtRet: "收益率", sBtMdd: "最大回撤", sBtSharpe: "夏普比率", sBtTrades: "調倉次數",
  sBtShort: "新聞只覆蓋了 {n} 個交易日，太短無法回測——免費新聞接口只提供最近的新聞，這是數據天花板，不是故障。可試新聞多的活躍標的。",
  sBtNote: "⚠️ 誠實說明：回測區間=新聞覆蓋期（通常幾週），非長期研究；信號用前一日情緒（無未來函數）；未計交易成本；樣本極小，結論僅供參考。",
  sBtNoPrice: "拿不到該標的的行情數據",
  sModeSingle: "單只分析", sModeBatch: "批量分析",
  sBatchPh: "輸入多只代碼，逗號分隔，最多20只：2330,AAPL,600519",
  sBatchGo: "開始批量", sBatchHint: "自動識別每只所屬市場；完成後按情緒評分排行，點任意一行看完整報告",
  sBatchProg: "分析進度", sBatchFailN: "{n} 只失敗或無新聞",
  sTblH: ["#", "名稱", "市場", "評分", "情緒", "正面", "負面", "新聞", "風險"],
});
Object.assign(I18N.en, {
  sModeBt: "Backtest", sBtPh: "One ticker: AAPL / 600519 / 2330", sBtGo: "Run backtest",
  sBtWindow: "Window", sBtDays: "trading days", sBtCurve: "Strategy equity curves (start = 100)", sBtSent: "Daily sentiment",
  sBtStrat: { bh: "Buy & Hold", sent: "Pure Sentiment", sma: "Sentiment + MA" },
  sBtRet: "Return", sBtMdd: "Max DD", sBtSharpe: "Sharpe", sBtTrades: "Trades",
  sBtShort: "News only covers {n} trading days — too short to backtest. Free news APIs expose only recent items (a data ceiling, not a bug). Try a more active name.",
  sBtNote: "⚠️ Honest scope: window = news-covered period (usually weeks), not a long-term study; signals use the previous day's sentiment (no look-ahead); no trading costs; tiny sample — for reference only.",
  sBtNoPrice: "No price data for this name",
  sModeSingle: "Single", sModeBatch: "Batch",
  sBatchPh: "Comma-separated tickers, up to 20: AAPL,TSLA,600519,2330",
  sBatchGo: "Run batch", sBatchHint: "Market auto-detected per ticker; ranked by sentiment when done — click a row for the full report",
  sBatchProg: "Progress", sBatchFailN: "{n} failed / no news",
  sTblH: ["#", "Name", "Mkt", "Score", "Mood", "Pos", "Neg", "News", "Risk"],
});

/* ---------- glossary for the 3 sentiment sub-modes ---------- */
const SENT_GL = {
  zh: {
    single: `本页：输入标的 → 自动抓取新闻 → FinBERT 逐条打分（0~100，>55 偏正面、<45 偏负面）→ 按来源可靠性加权汇总成报告。<hr>
<b>名词</b><br>· <b>综合情感评分</b>：全部新闻的加权平均分，50 为中性<br>· <b>置信度</b>：新闻数量 × 来源质量 × 观点一致性，越高结论越可信<br>· <b>市场影响力</b>：新闻热度 × 来源级别 × 新近度<br>· <b>风险</b>：负面新闻占比 + 情绪分歧度，≥60 高风险<br>· <b>六维主题</b>：经营/财务/竞争/产品/政策/资本，按关键词自动归类<br>· <b>来源分层</b>：官方公告 &gt; 主流媒体 &gt; 财经媒体 &gt; 自媒体，权重递减<br>· <b>关键事件</b>：偏离中性最远且来源可靠的新闻`,
    batch: `本页：一次分析多只（上限 20，防新闻接口限流），并发抓取+打分，完成后按综合情感评分排行。<hr>
<b>名词</b><br>· <b>市场自动识别</b>：6 位数字=A股、4~5 位=台股、字母=美股<br>· <b>评分/情绪/正负面/风险</b>：含义与单只分析一致<br>· 点击任意一行 → 跳转该股完整报告`,
    bt: `本页：把每日新闻情绪变成交易信号，在「新闻覆盖期」内模拟三种策略并对比。<hr>
<b>策略</b><br>· <b>买入持有</b>：基准线，什么都不做<br>· <b>纯情绪</b>：前一日情绪 ≥55 持仓，否则空仓（无未来函数）<br>· <b>情绪+均线</b>：在纯情绪基础上，还要求收盘价站上 20 日均线<br>
<b>指标</b><br>· <b>收益率</b>：区间累计收益<br>· <b>最大回撤</b>：净值从高点最大跌幅<br>· <b>夏普比率</b>：风险调整后收益（年化），越高越好<br>· <b>调仓次数</b>：持仓↔空仓切换次数<br>
⚠️ 窗口=新闻覆盖期（免费接口只给近期新闻）；未计交易成本`,
  },
  tw: {
    single: `本頁：輸入標的 → 自動抓取新聞 → FinBERT 逐條打分（0~100，>55 偏正面、<45 偏負面）→ 按來源可靠性加權匯總成報告。<hr>
<b>名詞</b><br>· <b>綜合情感評分</b>：全部新聞的加權平均分，50 為中性<br>· <b>置信度</b>：新聞數量 × 來源質量 × 觀點一致性<br>· <b>市場影響力</b>：新聞熱度 × 來源級別 × 新近度<br>· <b>風險</b>：負面新聞佔比 + 情緒分歧度，≥60 高風險<br>· <b>六維主題</b>：經營/財務/競爭/產品/政策/資本，按關鍵詞自動歸類<br>· <b>來源分層</b>：官方公告 &gt; 主流媒體 &gt; 財經媒體 &gt; 自媒體<br>· <b>關鍵事件</b>：偏離中性最遠且來源可靠的新聞`,
    batch: `本頁：一次分析多只（上限 20，防新聞接口限流），完成後按綜合情感評分排行。<hr>
<b>名詞</b><br>· <b>市場自動識別</b>：6 位數字=A股、4~5 位=台股、字母=美股<br>· 點擊任意一行 → 跳轉該股完整報告`,
    bt: `本頁：把每日新聞情緒變成交易信號，在「新聞覆蓋期」內模擬三種策略並對比。<hr>
<b>策略</b><br>· <b>買入持有</b>：基準線<br>· <b>純情緒</b>：前一日情緒 ≥55 持倉，否則空倉（無未來函數）<br>· <b>情緒+均線</b>：另要求收盤價站上 20 日均線<br>
<b>指標</b><br>· <b>收益率</b>：區間累計收益<br>· <b>最大回撤</b>：淨值最大跌幅<br>· <b>夏普比率</b>：風險調整後收益（年化）<br>· <b>調倉次數</b>：持倉↔空倉切換次數<br>
⚠️ 窗口=新聞覆蓋期；未計交易成本`,
  },
  en: {
    single: `This page: enter a name → auto-fetch news → FinBERT scores each item (0–100; >55 positive, <45 negative) → weighted by source reliability into one report.<hr>
<b>Terms</b><br>· <b>Composite</b>: weighted average of all items; 50 = neutral<br>· <b>Confidence</b>: news count × source quality × agreement<br>· <b>Impact</b>: news volume × source tier × recency<br>· <b>Risk</b>: negative share + dispersion; ≥60 = high<br>· <b>Six themes</b>: operations/financials/competition/product/policy/capital, keyword-classified<br>· <b>Source tiers</b>: official &gt; mainstream &gt; financial media &gt; other<br>· <b>Key events</b>: reliable items farthest from neutral`,
    batch: `This page: analyze up to 20 names at once (capped to avoid rate limits), ranked by composite sentiment when done.<hr>
<b>Terms</b><br>· <b>Market auto-detect</b>: 6 digits = CN, 4–5 digits = TW, letters = US<br>· Click a row → full single report`,
    bt: `This page: turns daily news sentiment into trading signals and simulates 3 strategies over the news-covered window.<hr>
<b>Strategies</b><br>· <b>Buy & Hold</b>: baseline<br>· <b>Pure Sentiment</b>: hold when yesterday's sentiment ≥55, else cash (no look-ahead)<br>· <b>Sentiment + MA</b>: additionally requires close above the 20-day MA<br>
<b>Metrics</b><br>· <b>Return</b>: cumulative over the window<br>· <b>Max DD</b>: worst peak-to-trough drop<br>· <b>Sharpe</b>: risk-adjusted return (annualized)<br>· <b>Trades</b>: position switches<br>
⚠️ Window = news coverage only; costs excluded`,
  },
};

function sentGlossaryHTML() {
  const L = SENT_GL[state.lang] || SENT_GL.zh;
  const title = sentSt.mode === "batch" ? t("sModeBatch") : sentSt.mode === "bt" ? t("sModeBt") : t("sModeSingle");
  return `<div class="hp-t">${t("sentTitle")} · ${title}</div>${L[sentSt.mode] || L.single}`;
}

const SENT_QUICK = [
  ["600519", "贵州茅台", "cn"], ["AAPL", "Apple", "us"], ["2330", "台積電", "tw"],
  ["TSLA", "Tesla", "us"], ["300750", "宁德时代", "cn"],
];
const SENT_BATCH_MAX = 20;
const sentSt = { mode: "single", target: null, data: null, loading: false, timer: null, batch: null, batchInput: "" };
const detectMk = (s) => (/^\d{6}$/.test(s) ? "cn" : /^\d{4,5}$/.test(s) ? "tw" : "us");

/* ---------- helpers ---------- */
const bandOf = (v) => (v >= 65 ? 0 : v >= 55 ? 1 : v >= 45 ? 2 : v >= 35 ? 3 : 4);
const bandColor = (v) => (v >= 55 ? C.green : v >= 45 ? C.orange : C.red);
const themeName = (k) => (t("sThemeName")[k] || k);
const labWord = (l) => (l === "pos" ? t("sPos") : l === "neg" ? t("sNeg") : t("sNeu"));

function sGauge(el, val, name, color) {
  mkChart(document.getElementById(el)).setOption({
    series: [{
      type: "gauge", min: 0, max: 100, startAngle: 210, endAngle: -30,
      progress: { show: true, width: 14, itemStyle: { color } },
      axisLine: { lineStyle: { width: 14, color: [[1, "#1e2a44"]] } },
      pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { color: C.muted, distance: 20, fontSize: 10 },
      title: { offsetCenter: [0, "32%"], color: C.muted, fontSize: 13 },
      detail: { offsetCenter: [0, "-10%"], fontSize: 30, color: "#fff", formatter: (v) => v.toFixed(1) },
      data: [{ value: val, name }],
    }],
  });
}

/* ---------- page ---------- */
function renderSentiment() {
  disposeCharts();
  document.getElementById("helpLabel").textContent = t("glossary");
  document.getElementById("helpPop").innerHTML = sentGlossaryHTML();
  const el = document.getElementById("sentView");
  el.innerHTML = `
    <div style="display:flex;justify-content:center;margin-bottom:14px">
      <div class="subtoggle" style="margin-bottom:0">
        <button data-m="single">${t("sModeSingle")}</button>
        <button data-m="batch">${t("sModeBatch")}</button>
        <button data-m="bt">${t("sModeBt")}</button>
      </div>
    </div>
    <div id="sentModeBody"></div>`;
  el.querySelectorAll(".subtoggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.m === sentSt.mode);
    b.onclick = () => { sentSt.mode = b.dataset.m; renderSentiment(); };
  });
  const body = el.querySelector("#sentModeBody");
  if (sentSt.mode === "batch") renderBatchView(body);
  else if (sentSt.mode === "bt") renderBtView(body);
  else renderSingleView(body);
}

/* ---------- backtest ---------- */
function renderBtView(root) {
  root.innerHTML = `
    <div class="controls" style="margin-top:0">
      <div class="searchbox">
        <input id="btInput" type="text" autocomplete="off" style="min-width:min(300px,80vw)"
          placeholder="${t("sBtPh")}" value="${sentSt.btInput || ""}" />
        <div class="dropdown" id="btDrop"></div>
      </div>
      <button id="btGo">${t("sBtGo")}</button>
      <span class="hint">${t("sBtNote")}</span>
    </div>
    <div id="btBody" style="max-width:1050px;margin:0 auto"></div>`;
  const inp = root.querySelector("#btInput");
  const go = async () => {
    const q = inp.value.trim();
    if (!q) return;
    const r = await resolveToken(q);
    if (r) { sentSt.btInput = r.symbol; inp.value = r.symbol; runBt(r.symbol, r.market); }
  };
  attachStockSearch(inp, root.querySelector("#btDrop"), (it) => {
    sentSt.btInput = it.symbol; inp.value = it.symbol; runBt(it.symbol, it.market);
  }, { onEnter: go });
  root.querySelector("#btGo").onclick = go;
  drawBtBody();
}

async function runBt(symbol, market) {
  sentSt.bt = { loading: true };
  drawBtBody();
  try {
    const r = await fetch(`/api/sentibacktest?market=${market}&symbol=${encodeURIComponent(symbol)}`, { headers: { "ngrok-skip-browser-warning": "1" } });
    sentSt.bt = await r.json();
    const d = sentSt.bt;
    if (d && !d.error && d.window) {
      try { addHistory({ symbol: d.symbol, market: d.market, name_zh: d.name, name_en: d.name }); } catch (e) {}
    }
  } catch (e) { sentSt.bt = { error: String(e) }; }
  drawBtBody();
}

function drawBtBody() {
  const el = document.getElementById("btBody");
  if (!el) return;
  const d = sentSt.bt;
  if (!d) {
    el.innerHTML = `<div class="loading" style="padding:44px 0">📈 ${t("sBtNote")}<div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      ${SENT_QUICK.map(([sym, nm]) => `<button class="fbk" data-s="${sym}" style="background:var(--panel2);color:var(--cyan);border:1px solid var(--border)">▶ ${nm} ${sym}</button>`).join("")}
    </div></div>`;
    el.querySelectorAll("button[data-s]").forEach((b) => (b.onclick = () => {
      sentSt.btInput = b.dataset.s;
      const bi = document.getElementById("btInput");
      if (bi) bi.value = b.dataset.s;
      runBt(b.dataset.s, detectMk(b.dataset.s));
    }));
    return;
  }
  if (d.loading) { el.innerHTML = `<div class="loading">🧠 ${t("sentLoading")}</div>`; return; }
  if (d.error === "window_too_short") { el.innerHTML = `<div class="loading">${t("sBtShort").replace("{n}", d.window_days ?? "?")}</div>`; return; }
  if (d.error === "no_news") { el.innerHTML = `<div class="loading">${t("sentNoNews")}</div>`; return; }
  if (d.error === "no_price") { el.innerHTML = `<div class="loading">${t("sBtNoPrice")}</div>`; return; }
  if (d.error) { el.innerHTML = `<div class="loading">${t("sentErr")} · ${d.error}</div>`; return; }

  const S = d.strategies, keys = ["bh", "sent", "sma"];
  const colors = { bh: C.muted, sent: C.cyan, sma: C.purple };
  el.innerHTML = `
    <div class="title" style="padding:0 0 10px"><div class="meta">${d.name} (${d.symbol}) · ${t("sBtWindow")}: ${d.window.start} ~ ${d.window.end} · ${d.window.days} ${t("sBtDays")}</div></div>
    <div class="panel"><div style="overflow-x:auto"><table class="stable"><thead>
      <tr><th></th><th>${t("sBtRet")}</th><th>${t("sBtMdd")}</th><th>${t("sBtSharpe")}</th><th>${t("sBtTrades")}</th></tr></thead><tbody>
      ${keys.map((k) => `<tr>
        <td style="color:${colors[k]};font-weight:800">${t("sBtStrat")[k]}</td>
        <td style="color:${S[k].ret >= 0 ? C.green : C.red};font-weight:700">${S[k].ret >= 0 ? "+" : ""}${S[k].ret}%</td>
        <td style="color:${C.red}">-${S[k].mdd}%</td>
        <td>${S[k].sharpe}</td><td>${S[k].trades}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="panel"><h3>${t("sBtCurve")}</h3><div class="chart" id="btChart" style="height:380px"></div></div>
    <div style="text-align:center;color:var(--muted);font-size:12px;margin:2px 0 12px">${t("sBtNote")}</div>`;

  mkChart(document.getElementById("btChart")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis" },
    legend: { top: 0, textStyle: { color: C.muted }, data: [...keys.map((k) => t("sBtStrat")[k]), t("sBtSent")] },
    grid: { left: 52, right: 52, top: 36, bottom: 42 },
    xAxis: { type: "category", data: d.curves.dates, axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: [
      { type: "value", scale: true, axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .35 } } },
      { type: "value", min: 0, max: 100, axisLabel: { color: C.muted, formatter: "{value}" }, splitLine: { show: false } },
    ],
    series: [
      ...keys.map((k) => ({ name: t("sBtStrat")[k], type: "line", smooth: true, showSymbol: false,
        data: d.curves[k], lineStyle: { color: colors[k], width: k === "bh" ? 1.5 : 2.5, type: k === "bh" ? "dashed" : "solid" }, itemStyle: { color: colors[k] } })),
      { name: t("sBtSent"), type: "bar", yAxisIndex: 1, data: d.curves.sentiment, barMaxWidth: 6,
        itemStyle: { color: "rgba(245,158,11,.35)" } },
    ],
  });
}

function renderSingleView(root) {
  root.innerHTML = `
    <div class="controls" style="margin-top:0">
      <div class="searchbox">
        <input id="sentInput" type="text" autocomplete="off" placeholder="${t("sentSearchPh")}" />
        <div class="dropdown" id="sentDrop"></div>
      </div>
      <button id="sentGo">${t("analyzeBtn")}</button>
      <span class="hint">${t("sentHint")}</span>
    </div>
    <div class="squick" id="sentQuick"><span style="color:var(--muted);font-size:12px">${t("sentPick")}</span></div>
    <div id="sentBody"></div>`;

  const qk = root.querySelector("#sentQuick");
  SENT_QUICK.forEach(([sym, nm, mk]) => {
    const b = document.createElement("button");
    b.textContent = `${nm} ${sym}`;
    b.onclick = () => sentAnalyze(sym, mk);
    qk.appendChild(b);
  });
  bindSentSearch();

  const body = root.querySelector("#sentBody");
  if (sentSt.loading) {
    body.innerHTML = `<div class="loading">🧠 ${t("sentLoading")}</div>`;
  } else if (sentSt.data) {
    renderSentReport(body, sentSt.data);
  } else {
    body.innerHTML = `<div class="loading" style="padding:50px 0">☝️ ${t("sentHint")}</div>`;
  }
}

/* ---------- batch ---------- */
function renderBatchView(root) {
  root.innerHTML = `
    <div class="controls" style="margin-top:0">
      <div class="searchbox">
        <input id="batchInput" type="text" autocomplete="off" style="min-width:min(420px,86vw)"
          placeholder="${t("sBatchPh")}" value="${sentSt.batchInput}" />
        <div class="dropdown" id="batchDrop"></div>
      </div>
      <button id="batchGo">${t("sBatchGo")}</button>
      <span class="hint">${t("sBatchHint")}</span>
    </div>
    <div id="batchBody" style="max-width:1000px;margin:0 auto"></div>`;
  const inp = root.querySelector("#batchInput");
  // token autocomplete: picking a stock replaces the text after the last comma
  attachStockSearch(inp, root.querySelector("#batchDrop"), (it) => {
    const parts = inp.value.split(/[,，]/);
    parts[parts.length - 1] = it.symbol;
    inp.value = parts.map((s) => s.trim()).filter(Boolean).join(",") + ",";
    sentSt.batchInput = inp.value;
    inp.focus();
  }, { tokenMode: true });
  const go = async () => {
    const raw = inp.value.trim().replace(/，/g, ",");
    sentSt.batchInput = raw;
    const toks = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, SENT_BATCH_MAX);
    if (!toks.length) return;
    const pairs = (await Promise.all(toks.map(resolveToken))).filter(Boolean);
    runBatch(pairs);
  };
  root.querySelector("#batchGo").onclick = go;
  drawBatchBody();
}

function drawBatchBody() {
  const el = document.getElementById("batchBody");
  if (!el) return;
  const b = sentSt.batch;
  if (!b) {
    const demo = "600519,AAPL,2330,TSLA,300750";
    el.innerHTML = `<div class="loading" style="padding:44px 0">📊 ${t("sBatchHint")}<div style="margin-top:16px"><button class="fbk" id="batchDemo">▶ ${t("sBatchGo")}: ${demo}</button></div></div>`;
    el.querySelector("#batchDemo").onclick = () => {
      sentSt.batchInput = demo;
      const bi = document.getElementById("batchInput");
      if (bi) bi.value = demo;
      runBatch(demo.split(",").map((s) => ({ symbol: s, market: detectMk(s) })));
    };
    return;
  }
  const pct = b.total ? Math.round(b.done / b.total * 100) : 0;
  el.innerHTML = `
    <div class="panel">
      <h3>${t("sBatchProg")} · ${b.done}/${b.total}</h3>
      <div class="sbarWrap"><div class="sbar" style="width:${pct}%"></div></div>
      <div style="overflow-x:auto">${batchTableHTML()}</div>
    </div>`;
  el.querySelectorAll("tr[data-s]").forEach((tr) => (tr.onclick = () => {
    sentSt.mode = "single";
    sentAnalyze(tr.dataset.s, tr.dataset.m);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

function batchTableHTML() {
  const b = sentSt.batch;
  const ok = b.results.filter((r) => r.ok).sort((x, y) => y.d.composite - x.d.composite);
  const bad = b.results.filter((r) => !r.ok);
  if (!ok.length && b.running) return "";
  const H = t("sTblH");
  let html = `<table class="stable"><thead><tr>${H.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
  ok.forEach((r, i) => {
    const d = r.d;
    html += `<tr data-s="${r.symbol}" data-m="${r.market}">
      <td>${i + 1}</td>
      <td><b>${d.name}</b> <span style="color:var(--muted);font-size:11px">${r.symbol}</span></td>
      <td>${MK_NAME[state.lang][r.market] || r.market}</td>
      <td style="color:${bandColor(d.composite)};font-weight:800">${d.composite}</td>
      <td>${t("sBandArr")[bandOf(d.composite)]}</td>
      <td style="color:${C.green}">${d.dist.pos}%</td>
      <td style="color:${C.red}">${d.dist.neg}%</td>
      <td>${d.n_news}</td>
      <td>${t("sRiskArr")[d.risk_level]}</td></tr>`;
  });
  html += "</tbody></table>";
  if (bad.length) html += `<div style="color:var(--muted);font-size:12px;margin-top:8px">${t("sBatchFailN").replace("{n}", bad.length)}: ${bad.map((r) => r.symbol).join(", ")}</div>`;
  return html;
}

async function runBatch(pairs) {
  sentSt.batch = { running: true, done: 0, total: pairs.length, results: [] };
  drawBatchBody();
  const queue = [...pairs];
  const worker = async () => {
    while (queue.length) {
      const { symbol: s, market: mk } = queue.shift();
      try {
        const r = await fetch(`/api/sentiment?market=${mk}&symbol=${encodeURIComponent(s)}`, { headers: { "ngrok-skip-browser-warning": "1" } });
        const d = await r.json();
        const ok = !d.error && d.n_news > 0;
        sentSt.batch.results.push({ symbol: s, market: mk, ok, d });
        if (ok) { try { addHistory({ symbol: d.symbol, market: d.market, name_zh: d.name, name_en: d.name }); } catch (e) {} }
      } catch (e) {
        sentSt.batch.results.push({ symbol: s, market: mk, ok: false });
      }
      sentSt.batch.done++;
      drawBatchBody();
    }
  };
  await Promise.all(Array.from({ length: Math.min(2, pairs.length) }, worker));
  sentSt.batch.running = false;
  drawBatchBody();
}

/* Generic stock-search dropdown: shared history (same store as the volume
   module) + recommendations + live results. tokenMode = autocomplete the text
   after the last comma (for the batch input). */
function attachStockSearch(inp, dd, onPick, opts = {}) {
  const allowed = ["us", "cn", "tw"];
  let flat = [], timer = null;
  const label = (x) => ((state.lang === "en" ? x.name_en : x.name_zh) || x.symbol);
  const row = (x, i) => `<div class="it" data-i="${i}"><div><span class="nm">${label(x)}</span><span class="sub">${x.symbol}</span></div><span class="mk">${MK_NAME[state.lang][x.market] || x.market}</span></div>`;
  const curQuery = () => (opts.tokenMode ? inp.value.split(/[,，]/).pop() : inp.value).trim();

  const build = (results) => {
    const q = curQuery().toLowerCase();
    flat = [];
    let html = `<div class="dh">${t("histTitle")}</div>`;
    const hist = getHistory().filter((h) => allowed.includes(h.market))
      .filter((h) => !q || [h.symbol, h.name_zh, h.name_en].some((s) => (s || "").toLowerCase().includes(q)))
      .slice(0, 5);
    if (hist.length) hist.forEach((h) => { html += row(h, flat.length); flat.push(h); });
    else html += `<div class="empty">${t("noHist")}</div>`;
    const list = q ? (results || [])
      : SENT_QUICK.map(([symbol, nm, market]) => ({ symbol, market, name_zh: nm, name_en: nm }));
    html += `<div class="dh">${q ? t("resultsTitle") : t("recoTitle")}</div>`;
    if (list.length) list.forEach((x) => { html += row(x, flat.length); flat.push(x); });
    else html += `<div class="empty">${t("noMatch")}</div>`;
    dd.innerHTML = html;
    dd.classList.add("show");
    dd.querySelectorAll(".it").forEach((n) => (n.onmousedown = (e) => {
      e.preventDefault(); dd.classList.remove("show");
      const it = flat[+n.dataset.i];
      try { addHistory(it); } catch (err) {}
      onPick(it);
    }));
  };

  inp.addEventListener("focus", () => build([]));
  inp.addEventListener("input", () => {
    clearTimeout(timer);
    const q = curQuery();
    if (!q) { build([]); return; }
    timer = setTimeout(async () => {
      let rs = [];
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { headers: { "ngrok-skip-browser-warning": "1" } });
        rs = ((await r.json()).results || []).filter((x) => allowed.includes(x.market));
      } catch (e) {}
      build(rs);
    }, 250);
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); dd.classList.remove("show"); opts.onEnter && opts.onEnter(); }
    else if (e.key === "Escape") dd.classList.remove("show");
  });
  inp.addEventListener("blur", () => setTimeout(() => dd.classList.remove("show"), 160));
}

/* Resolve free text (code / zh name / en name) to {symbol, market}. */
async function resolveToken(tok) {
  tok = (tok || "").trim();
  if (!tok) return null;
  if (/^\d{6}$/.test(tok)) return { symbol: tok, market: "cn" };
  if (/^\d{4,5}$/.test(tok)) return { symbol: tok, market: "tw" };
  if (/^[A-Za-z][A-Za-z0-9.\-]{0,7}$/.test(tok)) return { symbol: tok.toUpperCase(), market: "us" };
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(tok)}`, { headers: { "ngrok-skip-browser-warning": "1" } });
    const rs = ((await r.json()).results || []).filter((x) => ["us", "cn", "tw"].includes(x.market));
    if (rs.length) return { symbol: rs[0].symbol, market: rs[0].market, name_zh: rs[0].name_zh, name_en: rs[0].name_en };
  } catch (e) {}
  return { symbol: tok.toUpperCase(), market: detectMk(tok) };
}

function bindSentSearch() {
  const inp = document.getElementById("sentInput");
  const dd = document.getElementById("sentDrop");
  const go = async () => {
    const q = inp.value.trim();
    if (!q) return;
    const r = await resolveToken(q);
    if (r) { inp.value = r.symbol; sentAnalyze(r.symbol, r.market); }
  };
  attachStockSearch(inp, dd, (it) => { inp.value = it.symbol; sentAnalyze(it.symbol, it.market); }, { onEnter: go });
  document.getElementById("sentGo").onclick = go;
}

async function sentAnalyze(symbol, market) {
  sentSt.target = { symbol, market };
  sentSt.loading = true; sentSt.data = null;
  renderSentiment();
  try {
    const r = await fetch(`/api/sentiment?market=${market}&symbol=${encodeURIComponent(symbol)}`, { headers: { "ngrok-skip-browser-warning": "1" } });
    sentSt.data = await r.json();
    const d = sentSt.data;
    if (d && !d.error && d.n_news) {
      try { addHistory({ symbol: d.symbol, market: d.market, name_zh: d.name, name_en: d.name }); } catch (e) {}
    }
  } catch (e) { sentSt.data = { error: String(e) }; }
  sentSt.loading = false;
  renderSentiment();
}

/* ---------- report ---------- */
function renderSentReport(root, d) {
  if (d.error === "no_news") { root.innerHTML = `<div class="loading">${t("sentNoNews")}</div>`; return; }
  if (d.error) { root.innerHTML = `<div class="loading">${t("sentErr")} · ${d.error}</div>`; return; }

  const band = t("sBandArr")[bandOf(d.composite)];
  const exp = d.composite >= 60 ? t("sExpHigh") : d.composite >= 45 ? t("sExpMid") : t("sExpLow");
  const lastTrend = d.trend.length ? d.trend[d.trend.length - 1].score : d.composite;
  const drift = lastTrend - d.composite;
  const trd = drift > 5 ? t("sTrdUp") : drift < -5 ? t("sTrdDown") : t("sTrdFlat");
  const sum = t("sSumTpl").replace("{n}", d.n_news).replace("{band}", band).replace("{score}", d.composite)
    .replace("{pos}", d.dist.pos).replace("{neg}", d.dist.neg).replace("{neu}", d.dist.neu);

  root.innerHTML = `
    <div class="title" style="padding:2px 0 12px">
      <div class="meta">${d.name} (${d.symbol}) · ${MK_NAME[state.lang][d.market]} · ${t("updated")} ${d.generated_at}</div>
    </div>
    <div class="cards c5">
      <div class="card"><div class="lbl">🧠 ${t("sScore")}</div><div class="val" style="color:${bandColor(d.composite)}">${d.composite}</div><div class="sub">/100 · ${band}</div></div>
      <div class="card"><div class="lbl">🔒 ${t("sConf")}</div><div class="val">${d.confidence}</div><div class="sub">%</div></div>
      <div class="card"><div class="lbl">📰 ${t("sNewsN")}</div><div class="val">${d.n_news}</div><div class="sub"></div></div>
      <div class="card"><div class="lbl">📈 ${t("sPosR")}</div><div class="val" style="color:${C.purple}">${d.dist.pos}</div><div class="sub">%</div></div>
      <div class="card"><div class="lbl">⚡ ${t("sImpact")}</div><div class="val" style="color:${C.orange}">${d.impact}</div><div class="sub">%</div></div>
    </div>
    <div class="insights" style="margin-bottom:16px">
      <div class="ins"><div class="h"><span class="d" style="background:${C.cyan}"></span>${t("sSumT")}</div><div style="color:var(--muted);font-size:13px;line-height:1.9">${sum}</div></div>
      <div class="ins"><div class="h"><span class="d" style="background:${C.orange}"></span>${t("sExpT")}</div><div style="color:var(--muted);font-size:13px;line-height:1.9">${exp}</div></div>
      <div class="ins"><div class="h"><span class="d" style="background:${C.purple}"></span>${t("sTrdT")}</div><div style="color:var(--muted);font-size:13px;line-height:1.9">${trd}</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>${t("sScore")}</h3><div class="chart" id="sg1" style="height:260px"></div></div>
      <div class="panel"><h3>${t("sConf")}</h3><div class="chart" id="sg2" style="height:260px"></div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>${t("sDistT")}</h3><div class="chart" id="sd1" style="height:280px"></div></div>
      <div class="panel"><h3>${t("sSrcT")}</h3><div class="chart" id="sd2" style="height:280px"></div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>${t("sRadarT")}</h3><div class="chart" id="sr1" style="height:330px"></div></div>
      <div class="panel"><h3>${t("sRankT")}</h3><div class="chart" id="sr2" style="height:330px"></div></div>
    </div>
    <div class="panel"><h3>${t("sTrendT")}</h3><div class="chart" id="st1" style="height:330px"></div></div>
    <div class="panel"><h3>${t("sIRT")}</h3><div class="chart" id="sir" style="height:240px"></div></div>
    <div class="panel"><h3>${t("sFeedT")}</h3><div class="sfeed" id="sfeed"></div></div>
    <div class="panel"><h3>${t("sTLT")}</h3><div class="stimeline" id="stl"></div></div>
    <div style="text-align:center;color:var(--muted);font-size:11px;opacity:.7;margin-top:4px">
      ${t("sModels")}: ${(d.models && Object.values(d.models).join(" · ")) || "FinBERT"}</div>`;

  sGauge("sg1", d.composite, band, bandColor(d.composite));
  sGauge("sg2", d.confidence, t("sGaugeConf"), C.cyan);

  const donut = (el, data) => mkChart(document.getElementById(el)).setOption({
    tooltip: { ...baseTooltip, trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: C.muted } },
    series: [{ type: "pie", radius: ["42%", "66%"], center: ["50%", "44%"], label: { color: C.txt, formatter: "{b}\n{d}%" }, data }],
  });
  donut("sd1", [
    { name: t("sPos"), value: Math.round(d.dist.pos * d.n_news / 100), itemStyle: { color: C.green } },
    { name: t("sNeg"), value: Math.round(d.dist.neg * d.n_news / 100), itemStyle: { color: C.red } },
    { name: t("sNeu"), value: Math.round(d.dist.neu * d.n_news / 100), itemStyle: { color: C.orange } },
  ].filter((x) => x.value > 0));
  const tierColors = { official: C.cyan, mainstream: C.green, financial: C.orange, other: "#64748b" };
  donut("sd2", Object.entries(d.sources || {}).map(([k, v]) => ({ name: t("sTierArr")[k] || k, value: v, itemStyle: { color: tierColors[k] } })));

  const themeMap = {};
  (d.themes || []).forEach((x) => (themeMap[x.key] = x));
  const tKeys = ["operate", "finance", "compete", "product", "policy", "capital"];
  mkChart(document.getElementById("sr1")).setOption({
    tooltip: { ...baseTooltip, formatter: () => tKeys.map((k) => `${themeName(k)}: ${themeMap[k] ? themeMap[k].score + " (n" + themeMap[k].n + ")" : "-"}`).join("<br/>") },
    radar: { indicator: tKeys.map((k) => ({ name: themeName(k), max: 100 })), axisName: { color: C.muted },
      splitLine: { lineStyle: { color: C.grid } }, splitArea: { areaStyle: { color: ["transparent"] } }, axisLine: { lineStyle: { color: C.grid } } },
    series: [{ type: "radar", data: [{ value: tKeys.map((k) => (themeMap[k] ? themeMap[k].score : 50)), name: t("sRadarT"),
      lineStyle: { color: C.green, width: 2 }, itemStyle: { color: C.green }, areaStyle: { opacity: 0.15 } }] }],
  });
  const ranked = (d.themes || []).slice().sort((a, b) => a.score - b.score);
  mkChart(document.getElementById("sr2")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: MB() ? 86 : 110, right: 46, top: 8, bottom: 26 },
    xAxis: { type: "value", max: 100, axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .35 } } },
    yAxis: { type: "category", data: ranked.map((x) => themeName(x.key)), axisLabel: { color: C.muted } },
    series: [{ type: "bar", data: ranked.map((x) => ({ value: x.score, itemStyle: { color: x.score >= 55 ? C.green : x.score >= 45 ? C.orange : C.red } })),
      label: { show: true, position: "right", color: C.muted, formatter: "{c}%" }, barMaxWidth: 20 }],
  });

  const dates = d.trend.map((p) => p.date);
  const marks = (d.events || []).filter((e) => dates.includes(e.date)).slice(0, 5).map((e) => ({
    coord: [dates.indexOf(e.date), d.trend[dates.indexOf(e.date)].score],
    value: e.title.slice(0, 12) + "…",
    itemStyle: { color: e.score >= 55 ? C.green : e.score >= 45 ? C.orange : C.red },
  }));
  mkChart(document.getElementById("st1")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis", formatter: (ps) => { const i = ps[0].dataIndex; const p = d.trend[i]; return `${p.date}<br/>${t("sSent")}: ${p.score} (n=${p.n})`; } },
    grid: { left: 46, right: 24, top: 30, bottom: 34 },
    xAxis: { type: "category", data: dates, axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .35 } } },
    series: [{ type: "line", smooth: true, data: d.trend.map((p) => p.score),
      lineStyle: { color: C.cyan, width: 2.5 }, itemStyle: { color: C.cyan }, symbolSize: 7,
      areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(34,211,238,.28)" }, { offset: 1, color: "rgba(34,211,238,0)" }] } },
      markLine: { silent: true, symbol: "none", lineStyle: { color: C.grid, type: "dashed" }, label: { color: C.muted }, data: [{ yAxis: 50 }] },
      markPoint: { symbol: "pin", symbolSize: 44, label: { color: "#fff", fontSize: 9, formatter: (p) => p.value }, data: marks } }],
  });

  mkChart(document.getElementById("sir")).setOption({
    series: [
      { type: "gauge", center: ["27%", "58%"], radius: "88%", min: 0, max: 100, startAngle: 200, endAngle: -20,
        progress: { show: true, width: 12, itemStyle: { color: C.cyan } }, axisLine: { lineStyle: { width: 12, color: [[1, "#1e2a44"]] } },
        pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        title: { offsetCenter: [0, "36%"], color: C.muted, fontSize: 12 },
        detail: { offsetCenter: [0, "-6%"], fontSize: 22, color: "#fff", formatter: "{value}%" },
        data: [{ value: d.impact, name: t("sGaugeImpact") }] },
      { type: "gauge", center: ["73%", "58%"], radius: "88%", min: 0, max: 100, startAngle: 200, endAngle: -20,
        progress: { show: true, width: 12, itemStyle: { color: d.risk_level === "high" ? C.red : d.risk_level === "mid" ? C.orange : C.green } },
        axisLine: { lineStyle: { width: 12, color: [[1, "#1e2a44"]] } },
        pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        title: { offsetCenter: [0, "36%"], color: C.muted, fontSize: 12 },
        detail: { offsetCenter: [0, "-6%"], fontSize: 22, color: "#fff", formatter: () => `${d.risk} · ${t("sRiskArr")[d.risk_level]}` },
        data: [{ value: d.risk, name: t("sGaugeRisk") }] },
    ],
  });

  const feed = document.getElementById("sfeed");
  feed.innerHTML = (d.news || []).slice(0, 20).map((n) => `
    <div class="sitem ${n.label}">
      ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>` : `<span style="font-weight:600;font-size:13.5px">${n.title}</span>`}
      <div class="smeta"><span>🕐 ${n.published} · ${n.source} · ${themeName(n.theme)}</span>
      <span class="sscore" style="color:${n.score >= 55 ? C.green : n.score >= 45 ? C.orange : C.red}">${n.score}%</span></div>
    </div>`).join("");

  const tl = document.getElementById("stl");
  tl.innerHTML = (d.events || []).map((e) => `
    <div class="stl-item">
      <div class="stl-date">${e.date}</div>
      <div class="stl-title">${e.url ? `<a href="${e.url}" target="_blank" rel="noopener" style="color:var(--txt);text-decoration:none">${e.title}</a>` : e.title}</div>
      <span class="badge" style="background:${e.score >= 55 ? "rgba(34,197,94,.15)" : e.score >= 45 ? "rgba(245,158,11,.15)" : "rgba(239,68,68,.15)"};color:${e.score >= 55 ? C.green : e.score >= 45 ? C.orange : C.red}">${t("sSent")} ${e.score}%</span>
    </div>`).join("");
}
