/* Stork Emotional — frontend app (overview / returns / compare + placeholders). */
"use strict";

const BUILD = "v11";   // bump together with the ?v= asset version in index.html
const state = { module: "volume", market: "us", lang: "zh", tab: "overview", window: 90, symbols: { us: "", cn: "", tw: "", crypto: "", forex: "" }, corrSet: {}, loading: false };
let charts = [];
const cache = {}; // keyed by `${market}|${window}|${symbols}`
const cacheKey = () => `${state.market}|${state.window}|${state.symbols[state.market]}`;
function curData() { return cache[cacheKey()]; }

/* ---------------- i18n ---------------- */
const I18N = {
  zh: {
    title: "成交量异常收益分析", subtitle: "VOLUME ANOMALY · RETURN ANALYSIS",
    overview: "概览", returns: "收益曲线", surface3d: "3D曲面", radar: "雷达",
    heatmap: "热力", compare: "对比", insights: "发现",
    volEvents: "放量事件", shrinkEvents: "缩量事件", best: "最佳组合", stocks: "股票", unit: "个",
    volMarketDist: "放量 · 行情分布", shrinkMarketDist: "缩量 · 行情分布",
    volPosDist: "放量 · 位置分布", shrinkPosDist: "缩量 · 位置分布",
    returnsTitle: "成交量{v}后 未来1~30日平均收益率", futDay: "未来交易日", avgRet: "平均收益率(%)",
    compareTitle: "放量 vs 缩量 · 30日平均收益对比", ret30Axis: "30日平均收益率(%)",
    trap: "最大陷阱", opp: "最佳机会", playbook: "策略口诀", ret30: "30日收益",
    soon: "该模块将在下一步接入", loading: "数据计算中…", noData: "暂无数据",
    surge: "放量", shrink: "缩量",
    footer: "基于公开数据回测生成 · 仅供参考，不构成任何投资建议",
    updated: "更新于", events: "事件",
    analyzeBtn: "分析", resetBtn: "默认组合", custom: "自定义", searching: "搜索中…", noMatch: "无匹配",
    symPlaceholderUs: "搜索：苹果 / Apple / AAPL（留空=默认组合）",
    symPlaceholderCn: "搜索：贵州茅台 / 茅台 / 600519（留空=默认组合）",
    symPlaceholderTw: "搜索：台积电 / 台積電 / 2330（留空=默认组合）",
    symHintUs: "中英文或代码均可搜，选中即跳转该股并自动切换市场；逗号分隔多只=组合",
    symHintCn: "中英文或代码均可搜，选中即跳转该股并自动切换市场；逗号分隔多只=组合",
    symHintTw: "简繁体均可搜（简体也能搜到繁体股票）；选中即跳转并自动切换市场；逗号分隔多只=组合",
  },
  en: {
    title: "Volume Anomaly Return Analysis", subtitle: "VOLUME ANOMALY · RETURN ANALYSIS",
    overview: "Overview", returns: "Returns", surface3d: "3D", radar: "Radar",
    heatmap: "Heatmap", compare: "Compare", insights: "Insights",
    volEvents: "Surge Events", shrinkEvents: "Shrink Events", best: "Best Combo", stocks: "Stocks", unit: "",
    volMarketDist: "Surge · Trend Mix", shrinkMarketDist: "Shrink · Trend Mix",
    volPosDist: "Surge · Position Mix", shrinkPosDist: "Shrink · Position Mix",
    returnsTitle: "Avg forward 1–30d return after volume {v}", futDay: "Forward trading days", avgRet: "Avg return (%)",
    compareTitle: "Surge vs Shrink · 30-day avg return", ret30Axis: "30-day avg return (%)",
    trap: "Biggest Trap", opp: "Best Opportunity", playbook: "Playbook", ret30: "30d return",
    soon: "This module arrives in the next step", loading: "Crunching data…", noData: "No data",
    surge: "Surge", shrink: "Shrink",
    footer: "Backtested on public data · for reference only, not investment advice",
    updated: "updated", events: "events",
    analyzeBtn: "Analyze", resetBtn: "Default basket", custom: "Custom",
    symPlaceholderUs: "US ticker(s), e.g. AAPL or AAPL,MSFT (blank = default 16)",
    symPlaceholderCn: "A-share code(s), e.g. 600519 or 600519,000858 (blank = default 16)",
    searching: "Searching…", noMatch: "No match",
    symPlaceholderTw: "Search: TSMC / 台積電 / 2330 (blank = default basket)",
    symHintUs: "Search by name (zh/en) or ticker. Pick one to jump & auto-switch market; comma = basket.",
    symHintCn: "Search by name (zh/en) or ticker. Pick one to jump & auto-switch market; comma = basket.",
    symHintTw: "Search in 简/繁 or by code. Pick one to jump & auto-switch market; comma = basket.",
  },
  tw: {
    title: "成交量異常收益分析", subtitle: "VOLUME ANOMALY · RETURN ANALYSIS",
    overview: "概覽", returns: "收益曲線", surface3d: "3D曲面", radar: "雷達",
    heatmap: "熱力", compare: "對比", insights: "發現",
    volEvents: "放量事件", shrinkEvents: "縮量事件", best: "最佳組合", stocks: "股票", unit: "個",
    volMarketDist: "放量 · 行情分佈", shrinkMarketDist: "縮量 · 行情分佈",
    volPosDist: "放量 · 位置分佈", shrinkPosDist: "縮量 · 位置分佈",
    returnsTitle: "成交量{v}後 未來1~30日平均收益率", futDay: "未來交易日", avgRet: "平均收益率(%)",
    compareTitle: "放量 vs 縮量 · 30日平均收益對比", ret30Axis: "30日平均收益率(%)",
    trap: "最大陷阱", opp: "最佳機會", playbook: "策略口訣", ret30: "30日收益",
    soon: "該模組將在下一步接入", loading: "數據計算中…", noData: "暫無數據",
    surge: "放量", shrink: "縮量",
    footer: "基於公開數據回測生成 · 僅供參考，不構成任何投資建議",
    updated: "更新於", events: "事件",
    analyzeBtn: "分析", resetBtn: "預設組合", custom: "自訂", searching: "搜尋中…", noMatch: "無匹配",
    symPlaceholderUs: "搜尋：蘋果 / Apple / AAPL（留空=預設組合）",
    symPlaceholderCn: "搜尋：貴州茅台 / 茅台 / 600519（留空=預設組合）",
    symPlaceholderTw: "搜尋：台積電 / 台积电 / 2330（留空=預設組合）",
    symHintUs: "中英文或代碼均可搜尋，選中即跳轉該股並自動切換市場；逗號分隔多隻=組合",
    symHintCn: "中英文或代碼均可搜尋，選中即跳轉該股並自動切換市場；逗號分隔多隻=組合",
    symHintTw: "簡繁體均可搜尋（簡體也能搜到繁體股票）；選中即跳轉並自動切換市場；逗號分隔多隻=組合",
  },
};
Object.assign(I18N.zh, {
  surf3d: "3D收益率曲面", surf3dHint: "可拖动旋转 · 滚轮缩放 · 悬停看数值",
  heat30: "30日收益热力图", radarTitle: "策略组合综合对比 · 雷达图",
  radar1: "1日胜率", radar5: "5日胜率", radar10: "10日胜率", radar30: "30日胜率", radarRet: "30日收益",
  rankTitle: "各组合 · 30日收益排行", dayU: "日",
});
Object.assign(I18N.en, {
  surf3d: "3D return surface", surf3dHint: "Drag to rotate · scroll to zoom · hover for values",
  heat30: "30-day return heatmap", radarTitle: "Strategy combos · Radar",
  radar1: "1d win%", radar5: "5d win%", radar10: "10d win%", radar30: "30d win%", radarRet: "30d ret",
  rankTitle: "All combos · 30-day return ranking", dayU: "Day",
});
Object.assign(I18N.tw, {
  surf3d: "3D收益率曲面", surf3dHint: "可拖動旋轉 · 滾輪縮放 · 懸停看數值",
  heat30: "30日收益熱力圖", radarTitle: "策略組合綜合對比 · 雷達圖",
  radar1: "1日勝率", radar5: "5日勝率", radar10: "10日勝率", radar30: "30日勝率", radarRet: "30日收益",
  rankTitle: "各組合 · 30日收益排行", dayU: "日",
});
Object.assign(I18N.zh, {
  distMarket: "行情分布", distPos: "位置分布", compareSuffix: "30日平均收益对比",
  returnsTitle: "{v}后 未来1~30日平均收益率",
  symPlaceholderCrypto: "搜索：比特币 / BTC / 以太坊（留空=默认组合）",
  symHintCrypto: "24小时交易；有成交量，放量/缩量分析照常",
  symPlaceholderForex: "搜索：欧元 / 美元人民币 / EURUSD（留空=默认组合）",
  symHintForex: "汇率无成交量，改用「波动放大/收缩」信号分析",
  histTitle: "历史搜索", noHist: "没有更多历史记录", recoTitle: "系统推荐", resultsTitle: "搜索结果",
  glossary: "名词解释", scaleLabel: "情绪时间范围：",
  seasonality: "季节性", correlation: "相关性",
  seasonTitle: "月度收益日历（年 × 月，10年）", monthAvgTitle: "各月平均收益（看常年强弱月份）",
  seasonNote: "绿涨红跌；纵看某一年，横看某个月历年是否偏强/偏弱——藏在多年里的季节规律",
  corrTitle: "相关性 · 联动热力图（近1年日收益）", corrLabel: "相关系数",
  corrNote: "越红=联动越强（常同涨同跌），看似分散其实是一个仓；越蓝=反向；接近0才真分散",
  corrAdd: "搜索添加对比标的…", corrEmpty: "还没有对比标的", corrNeedMore: "再添加至少 1 个标的才能计算相关性",
  mlvol: "波动预测", mlForecast: "未来{H}日预测波动", annualized: "年化", mlPercentile: "历史波动分位",
  vsOwnHistory: "相对自身历史", oosR2: "样本外R²", vsBaseline: "vs 朴素基准", beats: "跑赢基准", nobeat: "未跑赢",
  volHigh: "偏高", volMid: "适中", volLow: "偏低", actual: "实际", baseline: "朴素基准",
  mlSeriesTitle: "实际 vs 预测 波动（样本外）", mlModelTitle: "模型对比（样本外 · 越高越准）",
  mlNote: "滚动样本外验证、不偷看未来。GBM 明显强于「明日波动≈今日」的朴素基准——波动确实可预测；但这≠预测涨跌，且未计交易成本，仅供参考。",
});
Object.assign(I18N.tw, {
  distMarket: "行情分佈", distPos: "位置分佈", compareSuffix: "30日平均收益對比",
  returnsTitle: "{v}後 未來1~30日平均收益率",
  symPlaceholderCrypto: "搜尋：比特幣 / BTC / 以太坊（留空=預設組合）",
  symHintCrypto: "24小時交易；有成交量，放量/縮量分析照常",
  symPlaceholderForex: "搜尋：歐元 / 美元人民幣 / EURUSD（留空=預設組合）",
  symHintForex: "匯率無成交量，改用「波動放大/收縮」信號分析",
  histTitle: "歷史搜尋", noHist: "沒有更多歷史記錄", recoTitle: "系統推薦", resultsTitle: "搜尋結果",
  glossary: "術語說明", scaleLabel: "情緒時間範圍：",
  seasonality: "季節性", correlation: "相關性",
  seasonTitle: "月度收益日曆（年 × 月，10年）", monthAvgTitle: "各月平均收益（看常年強弱月份）",
  seasonNote: "綠漲紅跌；縱看某一年，橫看某個月歷年是否偏強/偏弱——藏在多年裡的季節規律",
  corrTitle: "相關性 · 聯動熱力圖（近1年日收益）", corrLabel: "相關係數",
  corrNote: "越紅=聯動越強（常同漲同跌），看似分散其實是一個倉；越藍=反向；接近0才真分散",
  corrAdd: "搜尋添加對比標的…", corrEmpty: "還沒有對比標的", corrNeedMore: "再添加至少 1 個標的才能計算相關性",
  mlvol: "波動預測", mlForecast: "未來{H}日預測波動", annualized: "年化", mlPercentile: "歷史波動分位",
  vsOwnHistory: "相對自身歷史", oosR2: "樣本外R²", vsBaseline: "vs 樸素基準", beats: "跑贏基準", nobeat: "未跑贏",
  volHigh: "偏高", volMid: "適中", volLow: "偏低", actual: "實際", baseline: "樸素基準",
  mlSeriesTitle: "實際 vs 預測 波動（樣本外）", mlModelTitle: "模型對比（樣本外 · 越高越準）",
  mlNote: "滾動樣本外驗證、不偷看未來。GBM 明顯強於「明日波動≈今日」的樸素基準——波動確實可預測；但這≠預測漲跌，且未計交易成本，僅供參考。",
});
Object.assign(I18N.en, {
  distMarket: "Trend mix", distPos: "Position mix", compareSuffix: "30-day avg return",
  returnsTitle: "Avg forward 1–30d return after {v}",
  symPlaceholderCrypto: "Search: Bitcoin / BTC / Ethereum (blank = default basket)",
  symHintCrypto: "24/7; has volume — standard surge/shrink analysis",
  symPlaceholderForex: "Search: EUR/USD / USDCNY / EURUSD (blank = default basket)",
  symHintForex: "FX has no volume — analyzed via volatility expand/contract",
  histTitle: "Recent", noHist: "No search history yet", recoTitle: "Suggestions", resultsTitle: "Results",
  glossary: "Glossary", scaleLabel: "Lookback:",
  seasonality: "Seasonality", correlation: "Correlation",
  seasonTitle: "Monthly return calendar (year × month, 10y)", monthAvgTitle: "Average return by month",
  seasonNote: "Green up / red down. Read down a year, or across a month over years to spot seasonal strength/weakness hidden across years.",
  corrTitle: "Correlation heatmap (last 1y daily returns)", corrLabel: "Correlation",
  corrNote: "Redder = move together (hidden concentration despite 'diversifying'); bluer = inverse; near 0 = truly diversified",
  corrAdd: "Search to add a name…", corrEmpty: "No names yet", corrNeedMore: "Add at least 1 more name to compute correlation",
  mlvol: "Vol Forecast", mlForecast: "{H}-day vol forecast", annualized: "annualized", mlPercentile: "Vol percentile",
  vsOwnHistory: "vs its own history", oosR2: "OOS R²", vsBaseline: "vs naive baseline", beats: "beats baseline", nobeat: "no edge",
  volHigh: "High", volMid: "Normal", volLow: "Low", actual: "Actual", baseline: "Naive baseline",
  mlSeriesTitle: "Actual vs predicted volatility (out-of-sample)", mlModelTitle: "Model comparison (out-of-sample · higher = better)",
  mlNote: "Walk-forward out-of-sample, no look-ahead. GBM clearly beats the 'tomorrow≈today vol' baseline — volatility IS predictable; but this is NOT return prediction, costs not included, for reference only.",
});
const t = (k) => (I18N[state.lang][k] ?? k);
const evWord = () => (state.lang === "en" ? " " + t("events") : t("events"));
// market-aware "instrument" label (股票 / 币种 / 货币对)
const UNIT_LABEL = {
  zh: { us: "股票", cn: "股票", tw: "股票", crypto: "币种", forex: "货币对" },
  tw: { us: "股票", cn: "股票", tw: "股票", crypto: "幣種", forex: "貨幣對" },
  en: { us: "Stocks", cn: "Stocks", tw: "Stocks", crypto: "Coins", forex: "Pairs" },
};
const unitLabel = () => UNIT_LABEL[state.lang][state.market];

/* ---------------- glossary / term explanations ---------------- */
const GL_INTRO = {
  zh: {
    overview: "本页：放量/缩量事件总数、最佳组合，以及事件在不同行情、不同价位下的分布饼图。",
    returns: "本页：每条曲线是一个「位置+行情」组合，事件发生后未来第 1~30 个交易日的平均收益率走势。",
    surface3d: "本页：把收益曲线立体化。X=未来交易日，Y=场景组合，Z=收益率(%)，红低绿高。可拖动旋转、滚轮缩放。",
    radar: "本页：每个组合在 1/5/10/30 日胜率与 30 日收益共 5 个维度上的综合对比，覆盖面积越大越强。",
    heatmap: "本页：行=价位(低/高)，列=行情(牛/熊/震荡)，格内「样本数 | 30日收益%」，绿涨红跌。",
    compare: "本页：同一场景下放量 vs 缩量的 30 日收益对比柱状图，下方三张卡给出最佳/最差组合与口诀。",
    insights: "本页：最佳机会、最大陷阱，以及全部组合按 30 日收益的排行榜。",
    seasonality: "本页：把过去约10年每个月的收益排成「年×月」日历，揭示『某月历年偏强/偏弱』这种藏在多年里、肉眼翻不出来的季节规律。下方是各月历年平均。",
    correlation: "本页：篮子里各标的近1年日收益的两两相关系数。越红=越同涨同跌——你以为分散持仓，其实高度联动、本质一个仓；接近0才是真分散。",
    mlvol: "本页：机器学习预测未来5日波动率。用滚动「样本外」验证（只用过去数据训练、预测未来、再滚动），并和「明日波动≈今日」的朴素基准对比——GBM 跑赢=模型真有用。注意：预测的是波动不是涨跌，未计交易成本。",
  },
  tw: {
    overview: "本頁：放量/縮量事件總數、最佳組合，以及事件在不同行情、不同價位下的分佈圓餅圖。",
    returns: "本頁：每條曲線是一個「位置+行情」組合，事件發生後未來第 1~30 個交易日的平均收益率走勢。",
    surface3d: "本頁：把收益曲線立體化。X=未來交易日，Y=場景組合，Z=收益率(%)，紅低綠高。可拖動旋轉、滾輪縮放。",
    radar: "本頁：每個組合在 1/5/10/30 日勝率與 30 日收益共 5 個維度上的綜合對比，覆蓋面積越大越強。",
    heatmap: "本頁：列=價位(低/高)，欄=行情(牛/熊/震盪)，格內「樣本數 | 30日收益%」，綠漲紅跌。",
    compare: "本頁：同一場景下放量 vs 縮量的 30 日收益對比長條圖，下方三張卡給出最佳/最差組合與口訣。",
    insights: "本頁：最佳機會、最大陷阱，以及全部組合按 30 日收益的排行榜。",
    seasonality: "本頁：把過去約10年每個月的收益排成「年×月」日曆，揭示『某月歷年偏強/偏弱』這種藏在多年裡、肉眼翻不出來的季節規律。下方是各月歷年平均。",
    correlation: "本頁：籃子裡各標的近1年日收益的兩兩相關係數。越紅=越同漲同跌——你以為分散持倉，其實高度聯動、本質一個倉；接近0才是真分散。",
    mlvol: "本頁：機器學習預測未來5日波動率。用滾動「樣本外」驗證（只用過去資料訓練、預測未來、再滾動），並和「明日波動≈今日」的樸素基準對比——GBM 跑贏=模型真有用。注意：預測的是波動不是漲跌，未計交易成本。",
  },
  en: {
    overview: "This page: total surge/shrink events, the best combo, and pie charts of how events split by market trend and price position.",
    returns: "This page: each line is one position+trend combo — the average return on each of the next 1–30 trading days after an event.",
    surface3d: "This page: the return curves as a 3D surface. X=forward day, Y=combo, Z=return(%); red low, green high. Drag to rotate, scroll to zoom.",
    radar: "This page: each combo compared across 5 axes — 1/5/10/30-day win-rate + 30-day return. Bigger area = stronger.",
    heatmap: "This page: rows=position(low/high), cols=trend(bull/bear/range); each cell shows 'sample count | 30-day return%'. Green up, red down.",
    compare: "This page: surge vs shrink 30-day return per scenario (bars), plus cards for the best/worst combo and a playbook.",
    insights: "This page: best opportunity, biggest trap, and a ranking of every combo by 30-day return.",
    seasonality: "This page: ~10 years of monthly returns laid out as a year×month calendar — revealing which months are habitually strong/weak, a pattern hidden across years.",
    correlation: "This page: pairwise correlation of each name's daily returns over the last year. Redder = move together (hidden concentration); near 0 = truly diversified.",
    mlvol: "This page: ML forecast of the next 5-day volatility. Walk-forward out-of-sample (train on past, predict forward, roll on), compared to a 'tomorrow≈today vol' baseline — GBM beating it = the model adds value. Note: forecasts volatility, not direction; costs excluded.",
  },
};
function glossaryHTML(tab) {
  const L = state.lang, fx = state.market === "forex";
  if (tab === "seasonality" || tab === "correlation" || tab === "mlvol") {
    return `<div class="hp-t">${t(tab)}</div>${(GL_INTRO[L] || GL_INTRO.zh)[tab] || ""}`;
  }
  const su = trVol("放量"), sh = trVol("缩量");
  const vw = { zh: fx ? "波动幅度" : "成交量", tw: fx ? "波動幅度" : "成交量", en: fx ? "volatility" : "volume" }[L];
  const intro = (GL_INTRO[L] || GL_INTRO.zh)[tab] || "";
  const terms = {
    zh: `<b>名词</b><br>· <b>${su} / ${sh}</b>：当日${vw}相对近20日均值明显放大(≥2倍) / 收缩(≤0.5倍)<br>`
      + `· <b>高位 / 低位</b>：当前价在近120日高低区间的相对位置（≥50%为高位，否则低位）<br>`
      + `· <b>牛市 / 熊市 / 震荡市</b>：按近60日涨跌趋势划分<br>`
      + `· <b>胜率</b>：事件后该周期收益为正的比例<br>`
      + `· <b>收益率</b>：事件后第 N 个交易日相对事件日的平均涨跌幅(%)`,
    tw: `<b>名詞</b><br>· <b>${su} / ${sh}</b>：當日${vw}相對近20日均值明顯放大(≥2倍) / 收縮(≤0.5倍)<br>`
      + `· <b>高位 / 低位</b>：當前價在近120日高低區間的相對位置（≥50%為高位，否則低位）<br>`
      + `· <b>牛市 / 熊市 / 震盪市</b>：按近60日漲跌趨勢劃分<br>`
      + `· <b>勝率</b>：事件後該週期收益為正的比例<br>`
      + `· <b>收益率</b>：事件後第 N 個交易日相對事件日的平均漲跌幅(%)`,
    en: `<b>Terms</b><br>· <b>${su} / ${sh}</b>: today's ${vw} is well above (≥2×) / below (≤0.5×) its 20-day average<br>`
      + `· <b>High / Low</b>: where price sits in its 120-day range (≥50% high, else low)<br>`
      + `· <b>Bull / Bear / Range</b>: by the 60-day price trend<br>`
      + `· <b>Win-rate</b>: share of events with a positive return over that horizon<br>`
      + `· <b>Return</b>: average % change on the Nth day after the event`,
  }[L];
  return `<div class="hp-t">${t(tab)}</div>${intro}<hr>${terms}`;
}

const POS_MAP = { "低位": "Low", "高位": "High" };
const MKT_MAP = { "牛": "Bull", "熊": "Bear", "震荡": "Range" };
const MKTM_MAP = { "牛市": "Bull", "熊市": "Bear", "震荡市": "Range" };
const MKTM_TW = { "牛市": "牛市", "熊市": "熊市", "震荡市": "震盪市" };
function trScen(s) {
  if (state.lang === "zh") return s;
  const [pos, mkt] = s.split("+");
  if (state.lang === "tw") return `${pos}+${MKTM_TW[mkt] || mkt}`;
  return `${POS_MAP[pos] || pos}+${MKTM_MAP[mkt] || mkt}`;
}
const VOL_LABELS = {
  // [zh, tw, en] for surge / shrink, per signal type
  volume: { "放量": ["放量", "放量", "Surge"], "缩量": ["缩量", "縮量", "Shrink"] },
  vola: { "放量": ["波动放大", "波動放大", "Vol expand"], "缩量": ["波动收缩", "波動收縮", "Vol contract"] },
};
const trVol = (v) => {
  const set = state.market === "forex" ? VOL_LABELS.vola : VOL_LABELS.volume;
  const i = state.lang === "en" ? 2 : state.lang === "tw" ? 1 : 0;
  return (set[v] || [v, v, v])[i];
};
function trCombo(key) { const i = key.indexOf("-"); return `${trVol(key.slice(0, i))} ${trScen(key.slice(i + 1))}`; }
const trMkt = (m) => (state.lang === "en" ? (MKT_MAP[m] || m)
  : state.lang === "tw" ? (m === "震荡" ? "震盪" : m) : m);
const trPos = (p) => (state.lang === "en" ? (POS_MAP[p] || p) : p);

/* ---------------- colors ---------------- */
const C = { cyan: "#22d3ee", purple: "#a855f7", green: "#22c55e", red: "#ef4444", orange: "#f59e0b", blue: "#3b82f6", pink: "#ec4899", muted: "#8aa0c0", grid: "#1e2a44" };
const MK_LABEL = { us: "US", cn: "A股", tw: "台股", crypto: "币", forex: "汇率" };
const MK_NAME = {
  zh: { us: "美股", cn: "A股", tw: "台股", crypto: "币圈", forex: "汇率" },
  tw: { us: "美股", cn: "A股", tw: "台股", crypto: "幣圈", forex: "匯率" },
  en: { us: "US", cn: "A-Share", tw: "Taiwan", crypto: "Crypto", forex: "Forex" },
};
const SCEN_STYLE = {
  "低位+牛市": { color: C.purple, dashed: false },
  "低位+熊市": { color: C.green, dashed: false },
  "低位+震荡市": { color: C.cyan, dashed: false },
  "高位+牛市": { color: C.red, dashed: true },
  "高位+熊市": { color: C.orange, dashed: true },
  "高位+震荡市": { color: C.pink, dashed: true },
};

/* ---------------- chart helpers ---------------- */
function disposeCharts() { charts.forEach((c) => c.dispose()); charts = []; }
function mkChart(el) { const c = echarts.init(el, null, { renderer: "canvas" }); charts.push(c); return c; }
const MB = () => window.innerWidth <= 600;   // narrow-screen / phone
// On resize/rotate: re-render the active tab so charts pick up mobile-optimized options.
let _rsTimer = null;
window.addEventListener("resize", () => {
  charts.forEach((c) => c.resize());
  clearTimeout(_rsTimer);
  _rsTimer = setTimeout(() => renderNow(), 220);   // no fade on resize
});
const axisCommon = { axisLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .4 } } };
const baseTooltip = { backgroundColor: "rgba(15,22,38,.95)", borderColor: C.grid, textStyle: { color: C.txt } };

/* ---------------- data ---------------- */
async function loadData(force) {
  const mk = state.market, syms = state.symbols[mk], w = state.window;
  const key = cacheKey();
  if (cache[key] && !force) { render(); return cache[key]; }
  state.loading = true; render();
  try {
    const q = `/api/analyze?market=${mk}&window=${w}` + (syms ? `&symbols=${encodeURIComponent(syms)}` : "");
    const r = await fetch(q, { headers: { "ngrok-skip-browser-warning": "1" } });
    cache[key] = await r.json();
  } catch (e) {
    cache[key] = { error: String(e) };
  }
  state.loading = false; render();
  return cache[key];
}

/* ---------------- tabs ---------------- */
const TABS = ["overview", "returns", "surface3d", "radar", "heatmap", "compare", "insights", "seasonality", "correlation", "mlvol"];
const IMPLEMENTED = new Set(TABS);

/* ML volatility forecast — separate endpoint */
const mlCache = {};
let mlLoading = false;
const mlKey = () => `${state.market}|${state.symbols[state.market]}`;
async function loadMl() {
  const mk = state.market, syms = state.symbols[mk], k = mlKey();
  mlLoading = true;
  try {
    const q = `/api/mlvol?market=${mk}` + (syms ? `&symbols=${encodeURIComponent(syms)}` : "");
    const r = await fetch(q, { headers: { "ngrok-skip-browser-warning": "1" } });
    mlCache[k] = await r.json();
  } catch (e) { mlCache[k] = { error: String(e) }; }
  mlLoading = false; renderNow();
}

/* advanced analyses (seasonality / correlation) — separate long-history endpoint */
const advCache = {};
let advLoading = false;
const advKey = () => `${state.market}|${state.symbols[state.market]}`;
async function loadAdvanced() {
  const mk = state.market, syms = state.symbols[mk], k = advKey();
  advLoading = true;
  try {
    const q = `/api/advanced?market=${mk}` + (syms ? `&symbols=${encodeURIComponent(syms)}` : "");
    const r = await fetch(q, { headers: { "ngrok-skip-browser-warning": "1" } });
    advCache[k] = await r.json();
  } catch (e) { advCache[k] = { error: String(e) }; }
  advLoading = false; renderNow();
}
/* correlation comparison set (per market) */
const corrCache = {};
let corrLoading = false, corrAddTimer = null, corrAddResults = [];
const corrKey = () => `${state.market}|${[...(state.corrSet[state.market] || [])].sort().join(",")}`;
async function loadCorr() {
  const set = state.corrSet[state.market] || [], k = corrKey();
  corrLoading = true;
  try {
    const r = await fetch(`/api/correlation?market=${state.market}&symbols=${encodeURIComponent(set.join(","))}`, { headers: { "ngrok-skip-browser-warning": "1" } });
    corrCache[k] = await r.json();
  } catch (e) { corrCache[k] = { error: String(e) }; }
  corrLoading = false; renderNow();
}

const monthLabels = () => state.lang === "en"
  ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  : ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const WIN_OPTS = [
  { d: 90, zh: "近1季", tw: "近1季", en: "1Q" },
  { d: 182, zh: "近半年", tw: "近半年", en: "6M" },
  { d: 365, zh: "近1年", tw: "近1年", en: "1Y" },
  { d: 0, zh: "全部", tw: "全部", en: "All" },
];
const winName = (d) => { const o = WIN_OPTS.find((x) => x.d === d); return o ? o[state.lang] : ""; };

function renderScale() {
  const el = document.getElementById("scale"); el.innerHTML = "";
  const lab = document.createElement("span"); lab.className = "lbl"; lab.textContent = t("scaleLabel");
  el.appendChild(lab);
  WIN_OPTS.forEach((o) => {
    const b = document.createElement("button");
    b.textContent = o[state.lang];
    if (o.d === state.window) b.className = "active";
    b.onclick = () => { if (state.window !== o.d) { state.window = o.d; loadData(false); } };
    el.appendChild(b);
  });
}

function renderTabs() {
  const nav = document.getElementById("tabs"); nav.innerHTML = "";
  TABS.forEach((key) => {
    const b = document.createElement("button");
    b.textContent = t(key);
    if (key === state.tab) b.className = "active";
    if (!IMPLEMENTED.has(key)) b.classList.add("soon");
    b.onclick = () => { state.tab = key; render(); };
    nav.appendChild(b);
  });
}

/* ---------------- render root ---------------- */
function applyStaticText() {
  document.documentElement.lang = { zh: "zh-Hans", tw: "zh-Hant", en: "en" }[state.lang] || "zh";
  const sen = state.module === "sentiment";
  document.getElementById("appTitle").textContent = sen ? t("sentTitle") : t("title");
  document.getElementById("appSubtitle").textContent = sen ? "MARKET SENTIMENT · AI POWERED" : t("subtitle");
  if (sen) document.getElementById("appMeta").textContent = "";
  document.getElementById("footer").textContent = `${t("footer")} · build ${BUILD}`;
  document.querySelectorAll("#module button").forEach((b) => {
    b.textContent = t(b.dataset.mod === "volume" ? "modVolume" : "modSentiment");
    b.classList.toggle("active", b.dataset.mod === state.module);
  });
  document.getElementById("modChooseSub").textContent = t("modChoose");
  document.getElementById("mcVolT").textContent = t("title");
  document.getElementById("mcVolD").textContent = t("mcVolD");
  document.getElementById("mcSenT").textContent = t("sentTitle");
  document.getElementById("mcSenD").textContent = t("mcSenD");
  document.querySelectorAll("#market button").forEach((b) => { b.textContent = MK_NAME[state.lang][b.dataset.mk] || b.dataset.mk; });
  const mk = state.market;
  const pmap = { us: "symPlaceholderUs", cn: "symPlaceholderCn", tw: "symPlaceholderTw", crypto: "symPlaceholderCrypto", forex: "symPlaceholderForex" };
  const hmap = { us: "symHintUs", cn: "symHintCn", tw: "symHintTw", crypto: "symHintCrypto", forex: "symHintForex" };
  const inp = document.getElementById("symInput");
  inp.placeholder = t(pmap[mk]);
  inp.value = state.symbols[mk];
  document.getElementById("analyzeBtn").textContent = t("analyzeBtn");
  document.getElementById("resetBtn").textContent = t("resetBtn");
  document.getElementById("symHint").textContent = t(hmap[mk]);
}

let _fadeTok = 0;
function render() {            // fade out -> swap -> fade in
  const view = document.getElementById("view");
  document.getElementById("help").classList.remove("open");
  const tok = ++_fadeTok;
  view.classList.add("fading");
  setTimeout(() => {
    if (tok !== _fadeTok) { view.classList.remove("fading"); return; }
    try { renderNow(); }
    catch (e) { console.error("render error:", e); view.innerHTML = `<div class="loading">⚠ ${e.message}</div>`; }
    finally { requestAnimationFrame(() => view.classList.remove("fading")); }
  }, 230);
}

function renderNow() {
  applyStaticText();
  if (state.module === "sentiment") { renderSentiment(); return; }
  renderTabs();
  renderScale();
  document.getElementById("helpLabel").textContent = t("glossary");
  document.getElementById("helpPop").innerHTML = glossaryHTML(state.tab);
  const view = document.getElementById("view");
  disposeCharts();

  const d = curData();
  const meta = document.getElementById("appMeta");

  if (state.loading || !d) { view.innerHTML = `<div class="loading">${t("loading")}</div>`; meta.textContent = ""; return; }
  if (d.error || d.total_events === 0) {
    meta.textContent = "";
    if (d.error) { view.innerHTML = `<div class="loading">${t("noData")} · ${d.error}</div>`; return; }
    if ((d.stock_count || 0) === 0) { view.innerHTML = `<div class="loading">${t("noSymbolData")}</div>`; return; }
    // has price data, just no anomaly events in the chosen window
    const showBtn = state.window !== 0;
    view.innerHTML = `<div class="loading">${t("noEventsWindow")}${showBtn ? `<div style="margin-top:16px"><button class="fbk" id="tryAllBtn">${t("tryAllWindow")}</button></div>` : ""}</div>`;
    if (showBtn) document.getElementById("tryAllBtn").onclick = () => { state.window = 0; loadData(false); };
    return;
  }
  const symLabel = state.symbols[state.market] ? `${t("custom")}: ${state.symbols[state.market]} · ` : "";
  meta.textContent = `${symLabel}${winName(state.window)} · ${d.stock_count} ${unitLabel()} · ${d.total_events} ${t("events")} · ${t("updated")} ${d.generated_at || ""}`;

  if (!IMPLEMENTED.has(state.tab)) { view.innerHTML = `<div class="loading">${t(state.tab)} · ${t("soon")}</div>`; return; }
  if (state.tab === "overview") renderOverview(view, d);
  else if (state.tab === "returns") renderReturns(view, d);
  else if (state.tab === "compare") renderCompare(view, d);
  else if (state.tab === "surface3d") renderSurface3d(view, d);
  else if (state.tab === "radar") renderRadar(view, d);
  else if (state.tab === "heatmap") renderHeatmap(view, d);
  else if (state.tab === "insights") renderInsights(view, d);
  else if (state.tab === "seasonality") renderAdvTab(view, "seasonality");
  else if (state.tab === "correlation") renderCorrTab(view, d);
  else if (state.tab === "mlvol") renderMlTab(view);
}

function renderMlTab(view) {
  const ml = mlCache[mlKey()];
  if (!ml) { view.innerHTML = `<div class="loading">${t("loading")}</div>`; if (!mlLoading) loadMl(); return; }
  if (ml.error) { view.innerHTML = `<div class="loading">${t("noData")} · ${ml.error}</div>`; return; }
  renderMlvol(view, ml);
}

function renderMlvol(view, ml) {
  const f = ml.forecast, m = ml.metrics, s = ml.series, H = ml.horizon;
  const pct = f.percentile;
  const level = pct >= 70 ? t("volHigh") : pct <= 30 ? t("volLow") : t("volMid");
  const beats = m.gbm.rmse < m.baseline.rmse;
  view.innerHTML = `
    <div class="cards">
      <div class="card"><div class="lbl">${t("mlForecast").replace("{H}", H)}</div><div class="val">${f.value}%</div><div class="sub">${t("annualized")} · ${f.as_of}</div></div>
      <div class="card"><div class="lbl">${t("mlPercentile")}</div><div class="val small">${pct}% · ${level}</div><div class="sub">${t("vsOwnHistory")}</div></div>
      <div class="card"><div class="lbl">GBM ${t("oosR2")}</div><div class="val">${m.gbm.r2}</div><div class="sub">corr ${m.gbm.corr}</div></div>
      <div class="card"><div class="lbl">${t("vsBaseline")}</div><div class="val small" style="color:${beats ? C.green : C.red}">${beats ? "✓ " + t("beats") : t("nobeat")}</div><div class="sub">rmse ${m.gbm.rmse} / ${m.baseline.rmse}</div></div>
    </div>
    <div class="panel"><h3>${t("mlSeriesTitle")}</h3><div class="chart" id="c_ml" style="height:380px"></div>
      <div style="text-align:center;color:var(--muted);font-size:12px;margin-top:4px">${t("mlNote")}</div></div>
    <div class="panel"><h3>${t("mlModelTitle")}</h3><div class="chart" id="c_mlm" style="height:280px"></div></div>`;
  mkChart(document.getElementById("c_ml")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis" },
    legend: { top: 0, textStyle: { color: C.muted }, data: [t("actual"), "GBM", t("baseline")] },
    grid: { left: MB() ? 42 : 50, right: 18, top: 40, bottom: 50 },
    xAxis: { type: "category", data: s.dates, axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "value", name: "%", axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .4 } } },
    series: [
      { name: t("actual"), type: "line", showSymbol: false, smooth: true, lineStyle: { color: C.muted, width: 1.5 }, itemStyle: { color: C.muted }, data: s.actual },
      { name: "GBM", type: "line", showSymbol: false, smooth: true, lineStyle: { color: C.cyan, width: 2 }, itemStyle: { color: C.cyan }, data: s.gbm },
      { name: t("baseline"), type: "line", showSymbol: false, smooth: true, lineStyle: { color: C.orange, width: 1, type: "dashed" }, itemStyle: { color: C.orange }, data: s.baseline },
    ],
  });
  const mods = [["Baseline", m.baseline], ["HAR", m.har], ["GBM", m.gbm]];
  mkChart(document.getElementById("c_mlm")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis" },
    legend: { top: 0, textStyle: { color: C.muted }, data: ["R²", "corr"] },
    grid: { left: 48, right: 18, top: 36, bottom: 28 },
    xAxis: { type: "category", data: mods.map((x) => x[0]), axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "value", axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .3 } } },
    series: [
      { name: "R²", type: "bar", data: mods.map((x) => x[1].r2), itemStyle: { color: C.cyan }, label: { show: true, position: "top", color: C.muted, fontSize: 10 } },
      { name: "corr", type: "bar", data: mods.map((x) => x[1].corr), itemStyle: { color: C.purple }, label: { show: true, position: "top", color: C.muted, fontSize: 10 } },
    ],
  });
}

function renderAdvTab(view, kind) {
  const adv = advCache[advKey()];
  if (!adv) { view.innerHTML = `<div class="loading">${t("loading")}</div>`; if (!advLoading) loadAdvanced(); return; }
  if (adv.error) { view.innerHTML = `<div class="loading">${t("noData")}</div>`; return; }
  if (kind === "seasonality") renderSeasonality(view, adv);
}

function renderSeasonality(view, adv) {
  const s = adv.seasonality || {}, years = s.years || [], cells = s.cells || [];
  view.innerHTML = `
    <div class="panel"><h3>${t("seasonTitle")}</h3>
      <div class="chart" id="c_seas" style="height:${Math.max(300, years.length * 32 + 70)}px"></div>
      <div style="text-align:center;color:var(--muted);font-size:12px;margin-top:4px">${t("seasonNote")}</div></div>
    <div class="panel"><h3>${t("monthAvgTitle")}</h3><div class="chart" id="c_mavg" style="height:300px"></div></div>`;
  const months = monthLabels();
  if (cells.length) {
    let amax = 1; cells.forEach((c) => { if (c.ret != null) amax = Math.max(amax, Math.abs(c.ret)); });
    const data = cells.map((c) => ({ value: [c.month - 1, years.indexOf(c.year), c.ret] }));
    mkChart(document.getElementById("c_seas")).setOption({
      tooltip: { ...baseTooltip, formatter: (p) => `${years[p.value[1]]} ${months[p.value[0]]}<br/>${p.value[2]}%` },
      grid: { left: 52, right: 60, top: 10, bottom: 28 },
      xAxis: { type: "category", data: months, axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
      yAxis: { type: "category", data: years.map(String), axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
      visualMap: { min: -amax, max: amax, calculable: true, orient: "vertical", right: 2, bottom: 20, dimension: 2,
        inRange: { color: ["#ef4444", "#1e293b", "#22c55e"] }, textStyle: { color: C.muted } },
      series: [{ type: "heatmap", data, label: { show: years.length <= 12, color: "#fff", fontSize: 10, formatter: (p) => p.value[2] },
        itemStyle: { borderColor: C.grid, borderWidth: 1 } }],
    });
  }
  const mavg = s.month_avg || [];
  mkChart(document.getElementById("c_mavg")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis" },
    grid: { left: 48, right: 20, top: 16, bottom: 28 },
    xAxis: { type: "category", data: months, axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "value", name: "%", axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .4 } } },
    series: [{ type: "bar", data: mavg.map((v) => ({ value: v, itemStyle: { color: (v ?? 0) >= 0 ? C.green : C.red } })),
      label: { show: true, position: "top", color: C.muted, fontSize: 10, formatter: (p) => (p.value == null ? "" : p.value + "%") } }],
  });
}

function renderCorrTab(view, d) {
  const mk = state.market;
  if (!state.corrSet[mk]) state.corrSet[mk] = ((d && d.symbols) || []).slice(0, 25);
  const set = state.corrSet[mk];
  const chips = set.length
    ? set.map((s) => `<span class="chip">${s}<b data-rm="${s}">✕</b></span>`).join("")
    : `<span style="color:var(--muted);font-size:13px">${t("corrEmpty")}</span>`;
  view.innerHTML = `
    <div class="panel">
      <h3>${t("corrTitle")}</h3>
      <div class="corrbar">
        <div class="chips" id="corrChips">${chips}</div>
        <div class="searchbox"><input id="corrAdd" type="text" autocomplete="off" placeholder="${t("corrAdd")}"><div class="dropdown" id="corrAddDrop"></div></div>
      </div>
      <div class="chart" id="c_corr" style="height:${Math.max(340, set.length * 24 + 110)}px"></div>
      <div style="text-align:center;color:var(--muted);font-size:12px;margin-top:4px">${t("corrNote")}</div>
    </div>`;
  view.querySelectorAll("#corrChips b[data-rm]").forEach((b) => (b.onclick = () => removeCorr(b.dataset.rm)));
  bindCorrAdd();

  const box = document.getElementById("c_corr");
  if (set.length < 2) { box.innerHTML = `<div class="loading">${t("corrNeedMore")}</div>`; return; }
  const cdata = corrCache[corrKey()];
  if (!cdata) { box.innerHTML = `<div class="loading">${t("loading")}</div>`; if (!corrLoading) loadCorr(); return; }
  if (cdata.error || (cdata.symbols || []).length < 2) { box.innerHTML = `<div class="loading">${t("noData")}</div>`; return; }
  drawCorrMatrix("c_corr", cdata);
}

function drawCorrMatrix(elId, c) {
  const syms = c.symbols || [], mat = c.matrix || [], data = [];
  for (let i = 0; i < syms.length; i++) for (let j = 0; j < syms.length; j++) {
    if (mat[i] && mat[i][j] != null) data.push([j, i, mat[i][j]]);
  }
  mkChart(document.getElementById(elId)).setOption({
    tooltip: { ...baseTooltip, formatter: (p) => `${syms[p.value[1]]} ↔ ${syms[p.value[0]]}<br/>${t("corrLabel")}: ${p.value[2]}` },
    grid: { left: 70, right: 30, top: 10, bottom: 66 },
    xAxis: { type: "category", data: syms, axisLabel: { color: C.muted, rotate: 60, fontSize: 10 }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "category", data: syms, axisLabel: { color: C.muted, fontSize: 10 }, axisLine: { lineStyle: { color: C.grid } } },
    visualMap: { min: -1, max: 1, calculable: true, orient: "vertical", right: 2, bottom: 30, dimension: 2,
      inRange: { color: ["#3b82f6", "#0f1626", "#ef4444"] }, textStyle: { color: C.muted } },
    series: [{ type: "heatmap", data, label: { show: syms.length <= 14, color: "#fff", fontSize: 9, formatter: (p) => p.value[2] },
      itemStyle: { borderColor: C.grid, borderWidth: 1 } }],
  });
}

function addCorr(sym) {
  const set = state.corrSet[state.market];
  if (sym && !set.includes(sym)) { set.push(sym); renderNow(); }
}
function removeCorr(sym) {
  state.corrSet[state.market] = (state.corrSet[state.market] || []).filter((s) => s !== sym);
  renderNow();
}
function bindCorrAdd() {
  const inp = document.getElementById("corrAdd"), dd = document.getElementById("corrAddDrop");
  if (!inp) return;
  inp.addEventListener("input", () => {
    clearTimeout(corrAddTimer);
    const q = inp.value.trim();
    if (!q) { dd.classList.remove("show"); return; }
    corrAddTimer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&market=${state.market}`, { headers: { "ngrok-skip-browser-warning": "1" } });
        corrAddResults = ((await r.json()).results || []).filter((x) => x.market === state.market);
      } catch (e) { corrAddResults = []; }
      dd.innerHTML = corrAddResults.length
        ? corrAddResults.map((x, i) => `<div class="it" data-i="${i}"><div><span class="nm">${state.lang === "en" ? x.name_en : x.name_zh}</span><span class="sub">${x.symbol}</span></div></div>`).join("")
        : `<div class="empty">${t("noMatch")}</div>`;
      dd.classList.add("show");
      dd.querySelectorAll(".it").forEach((el) => (el.onmousedown = (e) => { e.preventDefault(); inp.value = ""; dd.classList.remove("show"); addCorr(corrAddResults[+el.dataset.i].symbol); }));
    }, 250);
  });
  inp.addEventListener("blur", () => setTimeout(() => dd.classList.remove("show"), 150));
}

/* ---------------- OVERVIEW ---------------- */
function renderOverview(view, d) {
  const ov = d.overview;
  const best = ov.best_combo;
  view.innerHTML = `
    <div class="cards">
      <div class="card"><div class="lbl">${trVol("放量")}${evWord()}</div><div class="val">${ov.volume_events}</div><div class="sub">${t("unit")}</div></div>
      <div class="card"><div class="lbl">${trVol("缩量")}${evWord()}</div><div class="val">${ov.shrink_events}</div><div class="sub">${t("unit")}</div></div>
      <div class="card"><div class="lbl">${t("best")}</div><div class="val small">${best ? trScen(best.name) : "-"}</div><div class="sub">${best ? best.ret30 + "% · n=" + best.n : ""}</div></div>
      <div class="card"><div class="lbl">${unitLabel()}</div><div class="val">${ov.stock_count}</div><div class="sub">${t("unit")}</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>${trVol("放量")} · ${t("distMarket")}</h3><div class="chart" id="c_vmd"></div></div>
      <div class="panel"><h3>${trVol("缩量")} · ${t("distMarket")}</h3><div class="chart" id="c_smd"></div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>${trVol("放量")} · ${t("distPos")}</h3><div class="chart" id="c_vpd"></div></div>
      <div class="panel"><h3>${trVol("缩量")} · ${t("distPos")}</h3><div class="chart" id="c_spd"></div></div>
    </div>`;

  const donut = (el, obj, colormap, labeler) => {
    const data = Object.entries(obj).map(([k, v]) => ({ name: labeler(k), value: v, itemStyle: { color: colormap[k] } }));
    mkChart(document.getElementById(el)).setOption({
      tooltip: { ...baseTooltip, trigger: "item", formatter: "{b}: {c}%" },
      legend: { bottom: 0, textStyle: { color: C.muted } },
      series: [{ type: "pie", radius: ["42%", "68%"], center: ["50%", "46%"], label: { color: C.txt, formatter: "{b}\n{c}%" }, data }],
    });
  };
  const mktColors = { "牛": C.red, "熊": C.green, "震荡": C.orange };
  const posColors = { "高位": C.red, "低位": C.blue };
  donut("c_vmd", ov.market_dist["放量"], mktColors, trMkt);
  donut("c_smd", ov.market_dist["缩量"], mktColors, trMkt);
  donut("c_vpd", ov.position_dist["放量"], posColors, trPos);
  donut("c_spd", ov.position_dist["缩量"], posColors, trPos);
}

/* ---------------- RETURNS ---------------- */
let returnsVol = "放量";
function renderReturns(view, d) {
  view.innerHTML = `
    <div class="panel">
      <div class="subtoggle" id="rv">
        <button data-v="放量">${trVol("放量")}</button>
        <button data-v="缩量">${trVol("缩量")}</button>
      </div>
      <h3 id="rtitle"></h3>
      <div class="chart" id="c_ret" style="height:420px"></div>
    </div>`;
  const chart = mkChart(document.getElementById("c_ret"));

  const draw = () => {
    document.querySelectorAll("#rv button").forEach((b) => b.classList.toggle("active", b.dataset.v === returnsVol));
    document.getElementById("rtitle").textContent = t("returnsTitle").replace("{v}", trVol(returnsVol));
    const curves = d.return_curves[returnsVol] || {};
    const xs = Array.from({ length: d.params.max_h }, (_, i) => i + 1);
    const series = Object.keys(SCEN_STYLE).filter((s) => (curves[s] || []).length).map((s) => ({
      name: trScen(s), type: "line", smooth: true, showSymbol: false,
      lineStyle: { color: SCEN_STYLE[s].color, width: 2, type: SCEN_STYLE[s].dashed ? "dashed" : "solid" },
      itemStyle: { color: SCEN_STYLE[s].color }, data: curves[s],
    }));
    chart.setOption({
      tooltip: { ...baseTooltip, trigger: "axis" },
      legend: { top: 0, textStyle: { color: C.muted }, type: "scroll" },
      grid: { left: MB() ? 44 : 54, right: 18, top: 44, bottom: 48 },
      xAxis: { type: "category", data: xs, name: t("futDay"), nameLocation: "middle", nameGap: 30, nameTextStyle: { color: C.muted }, ...axisCommon },
      yAxis: { type: "value", name: t("avgRet"), nameTextStyle: { color: C.muted }, ...axisCommon },
      series,
    }, true);
  };
  document.querySelectorAll("#rv button").forEach((b) => (b.onclick = () => { returnsVol = b.dataset.v; draw(); }));
  draw();
}

/* ---------------- COMPARE ---------------- */
function insightCardsHTML(d) {
  const ins = d.insights || {};
  const tips = state.lang === "en" ? tipsEn : state.lang === "tw" ? tipsTw : (ins.tips || []);
  return `
    <div class="ins"><div class="h"><span class="d" style="background:${C.red}"></span>${t("trap")}</div>
      <div>${ins.worst ? `<div class="big" style="color:${C.red}">${trScen(ins.worst.name)}</div>${t("ret30")}: ${ins.worst.ret30}% · n=${ins.worst.n}` : "-"}</div></div>
    <div class="ins"><div class="h"><span class="d" style="background:${C.green}"></span>${t("opp")}</div>
      <div>${ins.best ? `<div class="big" style="color:${C.green}">${trScen(ins.best.name)}</div>${t("ret30")}: ${ins.best.ret30}% · n=${ins.best.n}` : "-"}</div></div>
    <div class="ins"><div class="h"><span class="d" style="background:${C.cyan}"></span>${t("playbook")}</div>
      <ul>${tips.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}

function renderCompare(view, d) {
  view.innerHTML = `
    <div class="panel">
      <h3>${trVol("放量")} vs ${trVol("缩量")} · ${t("compareSuffix")}</h3>
      <div class="chart" id="c_cmp" style="height:400px"></div>
    </div>
    <div class="insights">${insightCardsHTML(d)}</div>`;

  const rows = d.compare_30d;
  const cats = rows.map((r) => trScen(r.combo));
  mkChart(document.getElementById("c_cmp")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0, textStyle: { color: C.muted }, data: [trVol("放量"), trVol("缩量")] },
    grid: { left: MB() ? 42 : 56, right: 16, top: 40, bottom: MB() ? 96 : 70 },
    xAxis: { type: "category", data: cats, axisLabel: { color: C.muted, interval: 0, rotate: MB() ? 45 : 22, fontSize: MB() ? 10 : 12 }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "value", name: t("ret30Axis"), nameTextStyle: { color: C.muted }, ...axisCommon },
    series: [
      { name: trVol("放量"), type: "bar", data: rows.map((r) => r["放量"]), itemStyle: { color: C.cyan }, label: { show: true, position: "top", color: C.muted, formatter: (p) => (p.value == null ? "" : p.value + "%") } },
      { name: trVol("缩量"), type: "bar", data: rows.map((r) => r["缩量"]), itemStyle: { color: C.purple }, label: { show: true, position: "top", color: C.muted, formatter: (p) => (p.value == null ? "" : p.value + "%") } },
    ],
  });
}
const tipsEn = [
  "High-position surges are often the smart money's smoke screen — stay alert.",
  "Low-position surges tend to signal fresh capital inflow.",
  "Shrinking volume = coiling energy; wait patiently for direction.",
];
const tipsTw = [
  "高位放量常是主力派發的煙霧彈，需警惕。",
  "低位放量往往是資金入場信號。",
  "縮量整理是蓄力，耐心等待方向選擇。",
];

/* ---------------- 3D SURFACE ---------------- */
function renderSurface3d(view, d) {
  view.innerHTML = `
    <div class="grid2">
      <div class="panel"><h3>${trVol("放量")} ${t("surf3d")}</h3><div class="chart" id="c_s1" style="height:440px"></div></div>
      <div class="panel"><h3>${trVol("缩量")} ${t("surf3d")}</h3><div class="chart" id="c_s2" style="height:440px"></div></div>
    </div>
    <div style="text-align:center;color:var(--muted);font-size:12px;margin-top:2px">${t("surf3dHint")}</div>`;
  buildSurface("c_s1", "放量", d);
  buildSurface("c_s2", "缩量", d);
}
function buildSurface(el, vol, d) {
  const curves = d.return_curves[vol] || {};
  const scen = Object.keys(SCEN_STYLE).filter((s) => (curves[s] || []).length);
  const xs = d.params.max_h;
  const pts = []; let zmax = 1;
  scen.forEach((s, yi) => {
    for (let x = 1; x <= xs; x++) { const z = curves[s][x - 1]; const zz = z == null ? 0 : z; pts.push([x, yi, zz]); zmax = Math.max(zmax, Math.abs(zz)); }
  });
  mkChart(document.getElementById(el)).setOption({
    tooltip: {},
    visualMap: { show: true, dimension: 2, min: -zmax, max: zmax, calculable: true, right: 2, bottom: 10,
      inRange: { color: ["#ef4444", "#7f1d1d", "#0f1626", "#14532d", "#22c55e"] }, textStyle: { color: C.muted } },
    xAxis3D: { type: "value", name: t("dayU"), axisLabel: { color: C.muted }, nameTextStyle: { color: C.muted } },
    yAxis3D: { type: "category", data: scen.map(trScen), axisLabel: { color: C.muted, interval: 0 } },
    zAxis3D: { type: "value", name: "%", axisLabel: { color: C.muted }, nameTextStyle: { color: C.muted } },
    grid3D: { boxWidth: MB() ? 68 : 90, boxDepth: MB() ? 55 : 75, boxHeight: 55, axisLine: { lineStyle: { color: C.grid } },
      splitLine: { lineStyle: { color: C.grid } }, viewControl: { distance: MB() ? 240 : 210, alpha: 18, beta: 35 },
      light: { main: { intensity: 1.2 }, ambient: { intensity: 0.4 } } },
    series: [{ type: "surface", wireframe: { show: false }, shading: "color", data: pts }],
  });
}

/* ---------------- RADAR ---------------- */
function renderRadar(view, d) {
  view.innerHTML = `<div class="panel"><h3>${t("radarTitle")}</h3><div class="chart" id="c_radar" style="height:520px"></div></div>`;
  const entries = Object.entries(d.radar || {});
  if (!entries.length) return;
  let maxRet = 10, minRet = 0;
  entries.forEach(([, v]) => { maxRet = Math.max(maxRet, v.ret30 || 0); minRet = Math.min(minRet, v.ret30 || 0); });
  maxRet = Math.ceil(maxRet); minRet = Math.floor(minRet);
  const indicator = [
    { name: t("radar1"), max: 100 }, { name: t("radar5"), max: 100 },
    { name: t("radar10"), max: 100 }, { name: t("radar30"), max: 100 },
    { name: t("radarRet"), max: maxRet, min: minRet },
  ];
  const palette = [C.cyan, C.purple, C.green, C.red, C.orange, C.pink, C.blue, "#eab308", "#14b8a6", "#f472b6", "#60a5fa", "#a3e635"];
  mkChart(document.getElementById("c_radar")).setOption({
    tooltip: { ...baseTooltip },
    legend: { type: "scroll", bottom: 0, textStyle: { color: C.muted } },
    radar: { indicator, axisName: { color: C.muted }, splitLine: { lineStyle: { color: C.grid } },
      splitArea: { areaStyle: { color: ["transparent"] } }, axisLine: { lineStyle: { color: C.grid } } },
    series: [{ type: "radar", data: entries.map(([k, v], i) => ({
      name: trCombo(k), value: [v.win1, v.win5, v.win10, v.win30, v.ret30],
      lineStyle: { color: palette[i % palette.length], width: 2 }, itemStyle: { color: palette[i % palette.length] },
      areaStyle: { opacity: 0.04 },
    })) }],
  });
}

/* ---------------- HEATMAP ---------------- */
function renderHeatmap(view, d) {
  view.innerHTML = `
    <div class="grid2">
      <div class="panel"><h3>${trVol("放量")} ${t("heat30")}</h3><div class="chart" id="c_h1" style="height:340px"></div></div>
      <div class="panel"><h3>${trVol("缩量")} ${t("heat30")}</h3><div class="chart" id="c_h2" style="height:340px"></div></div>
    </div>`;
  buildHeat("c_h1", "放量", d);
  buildHeat("c_h2", "缩量", d);
}
function buildHeat(el, vol, d) {
  const cells = d.heatmap[vol] || [];
  const mkts = ["牛", "熊", "震荡"], poss = ["低位", "高位"];
  let amax = 1;
  const data = cells.map((c) => {
    const xi = mkts.indexOf(c.mkt), yi = poss.indexOf(c.pos);
    if (c.ret30 != null) amax = Math.max(amax, Math.abs(c.ret30));
    return { value: [xi, yi, c.ret30 == null ? 0 : c.ret30], count: c.count, ret: c.ret30 };
  });
  mkChart(document.getElementById(el)).setOption({
    tooltip: { ...baseTooltip, formatter: (p) => `${trPos(poss[p.value[1]])} · ${trMkt(mkts[p.value[0]])}<br/>${t("events")}: ${p.data.count}<br/>${t("ret30")}: ${p.data.ret == null ? "-" : p.data.ret + "%"}` },
    grid: { left: 56, right: 24, top: 16, bottom: 36 },
    xAxis: { type: "category", data: mkts.map(trMkt), axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    yAxis: { type: "category", data: poss.map(trPos), axisLabel: { color: C.muted }, axisLine: { lineStyle: { color: C.grid } } },
    visualMap: { min: -amax, max: amax, calculable: true, orient: "vertical", right: 2, bottom: 20, dimension: 2,
      inRange: { color: ["#ef4444", "#1e293b", "#22c55e"] }, textStyle: { color: C.muted } },
    series: [{ type: "heatmap", data, label: { show: true, color: "#fff", fontSize: MB() ? 10 : 12,
      formatter: (p) => `${p.data.count} | ${p.data.ret == null ? "-" : p.data.ret + "%"}` },
      itemStyle: { borderColor: C.grid, borderWidth: 2 } }],
  });
}

/* ---------------- INSIGHTS (发现) ---------------- */
function renderInsights(view, d) {
  const rows = [];
  (d.compare_30d || []).forEach((r) => {
    if (r["放量_n"]) rows.push({ label: `${trVol("放量")} ${trScen(r.combo)}`, v: r["放量"] });
    if (r["缩量_n"]) rows.push({ label: `${trVol("缩量")} ${trScen(r.combo)}`, v: r["缩量"] });
  });
  rows.sort((a, b) => (b.v ?? -999) - (a.v ?? -999));
  view.innerHTML = `
    <div class="insights">${insightCardsHTML(d)}</div>
    <div class="panel" style="margin-top:16px"><h3>${t("rankTitle")}</h3>
      <div class="chart" id="c_rank" style="height:${Math.max(340, rows.length * 32)}px"></div></div>`;
  const cats = rows.map((r) => r.label).reverse();
  const vals = rows.map((r) => r.v).reverse();
  mkChart(document.getElementById("c_rank")).setOption({
    tooltip: { ...baseTooltip, trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: MB() ? 104 : 150, right: MB() ? 40 : 50, top: 10, bottom: 30 },
    xAxis: { type: "value", name: "%", axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: C.grid, opacity: .4 } } },
    yAxis: { type: "category", data: cats, axisLabel: { color: C.muted, fontSize: MB() ? 10 : 12 } },
    series: [{ type: "bar", data: vals.map((v) => ({ value: v, itemStyle: { color: (v ?? 0) >= 0 ? C.green : C.red } })),
      label: { show: true, position: "right", color: C.muted, formatter: (p) => (p.value == null ? "" : p.value + "%") } }],
  });
}

/* ---------------- controls ---------------- */
document.querySelectorAll("#market button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("#market button").forEach((x) => x.classList.remove("active"));
  b.classList.add("active"); state.market = b.dataset.mk; loadData(false);
}));
document.querySelectorAll("#lang button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("#lang button").forEach((x) => x.classList.remove("active"));
  b.classList.add("active"); state.lang = b.dataset.lang; render();
}));

const inputEl = document.getElementById("symInput");
const dropEl = document.getElementById("symDrop");
let searchResults = [], searchTimer = null, activeIdx = -1, dropItems = [];

/* local search history (per browser) */
const HIST_KEY = "stork_history_v1";
const getHistory = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch (e) { return []; } };
function addHistory(it) {
  if (!it || !it.symbol) return;
  let h = getHistory().filter((x) => !(x.symbol === it.symbol && x.market === it.market));
  h.unshift({ symbol: it.symbol, market: it.market, name_zh: it.name_zh, name_en: it.name_en });
  localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 20)));
}

/* per-market system recommendations (shown when query is empty) */
const RECO = {
  us: [["AAPL", "苹果", "Apple"], ["NVDA", "英伟达", "Nvidia"], ["TSLA", "特斯拉", "Tesla"], ["MSFT", "微软", "Microsoft"], ["SPY", "标普500 ETF", "S&P 500 ETF"]],
  cn: [["600519", "贵州茅台", "Kweichow Moutai"], ["300750", "宁德时代", "CATL"], ["002594", "比亚迪", "BYD"], ["510300", "沪深300ETF", "CSI 300 ETF"], ["000001", "平安银行", "Ping An Bank"]],
  tw: [["2330", "台積電", "TSMC"], ["2317", "鴻海", "Hon Hai"], ["2454", "聯發科", "MediaTek"], ["0050", "元大台灣50 ETF", "Taiwan 50 ETF"]],
  crypto: [["BTC-USD", "比特币", "Bitcoin"], ["ETH-USD", "以太坊", "Ethereum"], ["DOGE-USD", "狗狗币", "Dogecoin"], ["SOL-USD", "索拉纳", "Solana"]],
  forex: [["EURUSD=X", "欧元/美元", "EUR/USD"], ["USDCNY=X", "美元/人民币", "USD/CNY"], ["JPYCNY=X", "日元/人民币", "JPY/CNY"], ["USDJPY=X", "美元/日元", "USD/JPY"]],
};
const recoItems = (mk) => (RECO[mk] || []).map(([symbol, zh, en]) => ({ symbol, market: mk, name_zh: zh, name_en: en }));

function hideDrop() { dropEl.classList.remove("show"); activeIdx = -1; }

function itemHTML(it, idx) {
  const primary = state.lang === "en" ? it.name_en : it.name_zh;
  const secondary = state.lang === "en" ? it.name_zh : it.name_en;
  const sub = secondary && secondary !== primary ? `<span class="sub">${secondary}</span>` : "";
  return `<div class="it" data-i="${idx}">
    <div><span class="nm">${primary}</span><span class="sub">${it.symbol}</span>${sub}</div>
    <span class="mk">${MK_NAME[state.lang][it.market] || it.market}</span></div>`;
}
const matchHist = (h, ql) => [h.symbol, h.name_zh, h.name_en].some((s) => (s || "").toLowerCase().includes(ql));

function buildDrop(query) {
  const ql = (query || "").trim().toLowerCase();
  dropItems = [];
  let html = "";
  // 1) history (top 5; filtered by query when typing)
  const histShown = (ql ? getHistory().filter((h) => matchHist(h, ql)) : getHistory()).slice(0, 5);
  html += `<div class="dh">${t("histTitle")}</div>`;
  if (histShown.length) {
    histShown.forEach((h) => { html += itemHTML(h, dropItems.length); dropItems.push(h); });
  } else {
    html += `<div class="empty">${t("noHist")}</div>`;
  }
  // 2) live results (typing) or system recommendations (empty)
  const list = ql ? searchResults : recoItems(state.market);
  html += `<div class="dh">${ql ? t("resultsTitle") : t("recoTitle")}</div>`;
  if (list.length) {
    list.forEach((r) => { html += itemHTML(r, dropItems.length); dropItems.push(r); });
  } else {
    html += `<div class="empty">${t("noMatch")}</div>`;
  }
  dropEl.innerHTML = html;
  activeIdx = dropItems.length ? 0 : -1;
  markActive();
  dropEl.querySelectorAll(".it").forEach((el) => {
    el.onmousedown = (e) => { e.preventDefault(); pick(dropItems[+el.dataset.i]); };
  });
  dropEl.classList.add("show");
}
function markActive() { dropEl.querySelectorAll(".it").forEach((el) => el.classList.toggle("active", +el.dataset.i === activeIdx)); }
function moveActive(d) { if (dropItems.length) { activeIdx = (activeIdx + d + dropItems.length) % dropItems.length; markActive(); } }

async function runSearch(q) {
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&market=${state.market}`, { headers: { "ngrok-skip-browser-warning": "1" } });
    searchResults = (await r.json()).results || [];
  } catch (e) { searchResults = []; }
  buildDrop(q);
}

function pick(r) {
  if (!r) return;
  addHistory(r);
  hideDrop();
  if (r.market !== state.market) {
    state.market = r.market;
    document.querySelectorAll("#market button").forEach((x) => x.classList.toggle("active", x.dataset.mk === r.market));
  }
  state.symbols[state.market] = r.symbol;
  inputEl.value = r.symbol;
  loadData(false);
}

function submitSymbols() {
  const raw = inputEl.value.trim().replace(/，/g, ",");
  if (!raw) return;
  if (raw.includes(",")) {            // explicit basket
    state.symbols[state.market] = raw.split(",").map((s) => s.trim()).filter(Boolean).join(",");
    hideDrop(); loadData(false); return;
  }
  if (dropItems.length && activeIdx >= 0) { pick(dropItems[activeIdx]); return; }
  state.symbols[state.market] = raw; hideDrop(); loadData(false);   // fall back: use raw as symbol
}

inputEl.addEventListener("focus", () => buildDrop(inputEl.value));
inputEl.addEventListener("input", () => {
  const q = inputEl.value.trim();
  clearTimeout(searchTimer);
  if (q.includes(",")) { hideDrop(); return; }
  if (!q) { searchResults = []; buildDrop(""); return; }
  searchTimer = setTimeout(() => runSearch(q), 250);
});
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); submitSymbols(); }
  else if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
  else if (e.key === "Escape") hideDrop();
});
inputEl.addEventListener("blur", () => setTimeout(hideDrop, 150));
document.getElementById("analyzeBtn").onclick = submitSymbols;
document.getElementById("resetBtn").onclick = () => {
  state.symbols[state.market] = ""; inputEl.value = ""; searchResults = []; hideDrop(); loadData(false);
};

/* ---------------- modules (volume / sentiment) ---------------- */
Object.assign(I18N.zh, {
  modChoose: "选择功能模块", modVolume: "量价", modSentiment: "情绪",
  mcVolD: "放量/缩量事件后 1~30 日收益规律 · 美股/A股/台股/币圈/汇率 · 3D曲面 · 季节性 · 波动预测",
  mcSenD: "输入代码自动抓取新闻 · FinBERT 本地 AI 判断情绪 · 六维主题 · 生成交互式报告",
  sentTitle: "市场情绪分析",
  sentSoonT: "模块建设中", sentSoon: "接下来按计划接入：② 新闻抓取 → ③ FinBERT 情感引擎 → ④ 报告页 → ⑤ 批量 → ⑥ 情绪回测。可先用左上角切回「量价」。",
  noEventsWindow: "行情数据正常，但该标的在当前时间范围内没有检测到异常事件（最近走势平稳，或上市时间短、历史数据不足）",
  tryAllWindow: "查看全部历史", noSymbolData: "无法获取该代码的行情数据（可能已退市或代码无效），请换一个标的",
});
Object.assign(I18N.tw, {
  modChoose: "選擇功能模組", modVolume: "量價", modSentiment: "情緒",
  mcVolD: "放量/縮量事件後 1~30 日收益規律 · 美股/A股/台股/幣圈/匯率 · 3D曲面 · 季節性 · 波動預測",
  mcSenD: "輸入代碼自動抓取新聞 · FinBERT 本地 AI 判斷情緒 · 六維主題 · 生成互動式報告",
  sentTitle: "市場情緒分析",
  sentSoonT: "模組建設中", sentSoon: "接下來按計劃接入：② 新聞抓取 → ③ FinBERT 情感引擎 → ④ 報告頁 → ⑤ 批量 → ⑥ 情緒回測。可先用左上角切回「量價」。",
  noEventsWindow: "行情數據正常，但該標的在當前時間範圍內沒有檢測到異常事件（最近走勢平穩，或上市時間短、歷史數據不足）",
  tryAllWindow: "查看全部歷史", noSymbolData: "無法獲取該代碼的行情數據（可能已退市或代碼無效），請換一個標的",
});
Object.assign(I18N.en, {
  modChoose: "Choose a module", modVolume: "Volume", modSentiment: "Sentiment",
  mcVolD: "Forward 1–30d returns after volume anomalies · US/CN/TW/Crypto/FX · 3D surfaces · seasonality · vol forecast",
  mcSenD: "Enter a ticker → auto-fetch news → local FinBERT sentiment · 6 themes · interactive report",
  sentTitle: "Market Sentiment Analysis",
  sentSoonT: "Under construction", sentSoon: "Coming next per plan: ② news fetcher → ③ FinBERT engine → ④ report page → ⑤ batch → ⑥ sentiment backtest. Use the top-left toggle to return to Volume.",
  noEventsWindow: "Price data is fine — this name simply has no anomaly events in the selected window (calm lately, or too little listing history)",
  tryAllWindow: "View full history", noSymbolData: "No price data for this symbol (possibly delisted or invalid) — try another one",
});

/* renderSentiment() is provided by sent.js (loaded after this file). */

function setModule(m) {
  state.module = m;
  document.body.classList.remove("mod-volume", "mod-sentiment");
  document.body.classList.add("mod-" + m);
  document.getElementById("modSplash").classList.add("hidden");
  document.getElementById("view").classList.remove("fading");   // never inherit a stuck fade
  if (m === "volume") loadData(false);   // handles both cache-hit (render) and fetch
  else renderNow();
}
document.body.classList.add("mod-volume");
document.querySelectorAll("#modSplash .mod-card").forEach((c) => (c.onclick = () => setModule(c.dataset.mod)));
document.querySelectorAll("#module button").forEach((b) => (b.onclick = () => { if (state.module !== b.dataset.mod) setModule(b.dataset.mod); }));

/* ---------------- splash / language entry ---------------- */
function startApp(lang) {
  state.lang = lang;
  document.querySelectorAll("#lang button").forEach((x) => x.classList.toggle("active", x.dataset.lang === lang));
  document.getElementById("splash").classList.add("hidden");
  applyStaticText();
  document.getElementById("modSplash").classList.remove("hidden");
}
document.querySelectorAll("#splash .btns button").forEach((b) => (b.onclick = () => startApp(b.dataset.lang)));

/* ---------------- glossary popover (hover desktop / tap mobile) ---------------- */
const helpEl = document.getElementById("help");
const helpBtnEl = document.getElementById("helpBtn");
const openHelp = () => helpEl.classList.add("open");
const closeHelp = () => helpEl.classList.remove("open");   // CSS fades out over 1s
helpEl.addEventListener("mouseenter", openHelp);
helpEl.addEventListener("mouseleave", closeHelp);
helpBtnEl.addEventListener("click", (e) => { e.stopPropagation(); helpEl.classList.toggle("open"); });
document.addEventListener("click", (e) => { if (!helpEl.contains(e.target)) closeHelp(); });
document.addEventListener("touchstart", (e) => { if (!helpEl.contains(e.target)) closeHelp(); }, { passive: true });
