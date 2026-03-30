import { state } from "./state.js";
import { escapeAttr, escapeHtml, formatTimeAgo } from "./utils.js";

export const INSIGHT_PANELS = [
  { id: "market-mood-meter", name: "Market Mood Meter", category: "Pulse Meters", region: "India", description: "Overall headline sentiment score." },
  { id: "risk-thermometer", name: "Risk Thermometer", category: "Pulse Meters", region: "India", description: "News risk pressure from risk keywords." },
  { id: "breadth-meter", name: "Breadth Meter", category: "Pulse Meters", region: "India", description: "Advancers versus decliners from live quotes." },
  { id: "news-velocity", name: "News Velocity", category: "Pulse Meters", region: "India", description: "Headline flow over the last 24 hours." },
  { id: "sentiment-mix", name: "Sentiment Mix", category: "Pulse Meters", region: "India", description: "Positive, neutral, and negative split." },
  { id: "keyword-cloud", name: "Keyword Cloud", category: "Alerts and Trending", region: "India", description: "Most repeated market words right now." },
  { id: "trending-topics", name: "Trending Topics", category: "Alerts and Trending", region: "India", description: "Keywords accelerating versus prior sessions." },
  { id: "breaking-alerts", name: "Breaking Alerts", category: "Alerts and Trending", region: "India", description: "High-priority headlines needing attention." },
  { id: "regulation-alerts", name: "Regulation Alerts", category: "Alerts and Trending", region: "India", description: "Policy and compliance signal tracker." },
  { id: "ipo-monitor", name: "IPO Monitor", category: "Alerts and Trending", region: "India", description: "IPO and listing chatter monitor." },
  { id: "earnings-radar", name: "Earnings Radar", category: "Alerts and Trending", region: "India", description: "Result season and guidance headlines." },
  { id: "sector-rotation", name: "Sector Rotation", category: "Maps and Flows", region: "India", description: "Sector-wise news momentum and tone." },
  { id: "source-diversity", name: "Source Diversity", category: "Maps and Flows", region: "Global", description: "Coverage split across feed sources." },
  { id: "category-flow", name: "Category Flow", category: "Maps and Flows", region: "Global", description: "Which feed categories are active." },
  { id: "timeline-24h", name: "24h Timeline", category: "Maps and Flows", region: "Global", description: "Three-hour activity blocks over 24h." },
  { id: "age-distribution", name: "News Age Distribution", category: "Maps and Flows", region: "Global", description: "Fresh versus aging headline mix." },
  { id: "top-stories", name: "Top Story Cards", category: "Articles and Briefs", region: "Global", description: "Latest important stories with snippets." },
  { id: "action-watchlist", name: "Action Watchlist", category: "Articles and Briefs", region: "India", description: "Checklist for what to verify now." },
  { id: "india-regions-map", name: "India Regions Map", category: "Maps and Flows", region: "India", description: "Regional news pressure map for India." },
  { id: "global-cues-map", name: "Global Cues Map", category: "Maps and Flows", region: "Global", description: "Global region signal heat map." },
  { id: "india-leaders", name: "India Leaders Board", category: "Market Boards", region: "India", description: "Major India symbols live snapshot." },
  { id: "global-leaders", name: "Global Leaders Board", category: "Market Boards", region: "Global", description: "US/global symbols live snapshot." },
  { id: "commodity-board", name: "Commodity Board", category: "Market Boards", region: "Global", description: "Gold, oil, gas, and silver moves." },
  { id: "forex-board", name: "Forex Board", category: "Market Boards", region: "Global", description: "Rupee and major FX cross changes." },
  { id: "crypto-board", name: "Crypto Board", category: "Market Boards", region: "Global", description: "Crypto pulse with top assets." },
  { id: "safe-haven-meter", name: "Safe Haven Meter", category: "Pulse Meters", region: "Global", description: "Risk-off gauge from gold, dollar, and VIX." },
  { id: "volatility-radar", name: "Volatility Radar", category: "Pulse Meters", region: "Global", description: "Combined volatility risk score." },
  { id: "fii-dii-proxy", name: "FII-DII Proxy", category: "Pulse Meters", region: "India", description: "Flow bias proxy using banks, IT, and rupee." },
  { id: "beginner-brief", name: "Beginner Brief", category: "Articles and Briefs", region: "India", description: "Simple explanation of current conditions." },
  { id: "next-watch-signals", name: "Next Watch Signals", category: "Articles and Briefs", region: "India", description: "What to monitor in the next session." },
  { id: "fear-greed-index", name: "Fear & Greed Index", category: "Pulse Meters", region: "Global", description: "Composite market fear and greed gauge." },
  { id: "sector-heatmap", name: "Sector Heatmap", category: "Maps and Flows", region: "India", description: "Visual grid of sector sentiment with color coding." },
  { id: "news-frequency", name: "News Frequency Tracker", category: "Maps and Flows", region: "Global", description: "Per-source news publishing frequency." },
  { id: "currency-strength", name: "Currency Strength Meter", category: "Market Boards", region: "Global", description: "Relative strength of INR versus major currencies." },
  { id: "top-movers", name: "Top Movers Board", category: "Market Boards", region: "Global", description: "Biggest gainers and losers from tracked quotes." },
  { id: "session-clock", name: "Session Clock", category: "Maps and Flows", region: "Global", description: "Global market session status indicator." },
];

const STOP_WORDS = new Set([
  "india", "market", "markets", "stock", "stocks", "today", "latest", "after", "amid", "from", "with", "this",
  "that", "news", "live", "update", "updates", "sensex", "nifty", "share", "shares", "trading", "trader",
  "economy", "economic", "times", "says", "saying", "will", "into", "over", "under", "watch",
]);

const RISK_WORDS = [
  "selloff", "volatility", "panic", "correction", "risk", "downgrade", "lawsuit", "probe", "default", "fraud", "war",
  "tariff", "inflation", "slowdown", "ban", "shutdown",
];

const ALERT_HIGH = ["crash", "plunge", "fraud", "default", "ban", "probe", "war", "selloff"];
const ALERT_MEDIUM = ["inflation", "volatility", "downgrade", "lawsuit", "slowdown", "concern", "cut"];

const SECTOR_RULES = [
  { label: "Banking", keys: ["bank", "lender", "npa", "credit", "rbi", "hdfc", "icici", "sbi"] },
  { label: "IT", keys: ["it", "software", "ai", "tech", "infosys", "tcs", "wipro"] },
  { label: "Energy", keys: ["oil", "gas", "energy", "crude", "petrol", "diesel"] },
  { label: "Auto", keys: ["auto", "ev", "vehicle", "car", "two-wheeler"] },
  { label: "Pharma", keys: ["pharma", "drug", "healthcare", "fda", "medicine"] },
  { label: "Metals", keys: ["metal", "steel", "aluminium", "copper", "zinc"] },
];

const INDIA_REGION_RULES = [
  { label: "North", keys: ["delhi", "noida", "gurugram", "haryana", "punjab", "uttar pradesh", "chandigarh", "jaipur"] },
  { label: "West", keys: ["mumbai", "maharashtra", "pune", "gujarat", "ahmedabad", "surat", "goa"] },
  { label: "South", keys: ["bengaluru", "karnataka", "chennai", "tamil nadu", "hyderabad", "telangana", "kerala", "kochi"] },
  { label: "East", keys: ["kolkata", "west bengal", "odisha", "bhubaneswar", "jharkhand", "bihar"] },
  { label: "Central", keys: ["madhya pradesh", "chhattisgarh", "bhopal", "indore", "nagpur"] },
  { label: "North East", keys: ["assam", "guwahati", "manipur", "tripura", "meghalaya", "mizoram", "nagaland", "sikkim"] },
];

const GLOBAL_REGION_RULES = [
  { label: "US", keys: ["united states", "wall street", "federal reserve", "fed", "us ", "nasdaq", "s&p", "dow"] },
  { label: "Europe", keys: ["europe", "ecb", "uk", "germany", "france", "euro", "london"] },
  { label: "China", keys: ["china", "beijing", "yuan", "shanghai", "hong kong"] },
  { label: "Japan", keys: ["japan", "nikkei", "yen", "tokyo", "boj"] },
  { label: "Middle East", keys: ["middle east", "saudi", "uae", "iran", "israel", "gulf"] },
  { label: "Commodities", keys: ["oil", "gold", "crude", "brent", "metal"] },
];

const WATCHLIST_SYMBOLS = {
  india: ["^NSEI", "^BSESN", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "SBIN.NS", "ICICIBANK.NS"],
  global: ["^GSPC", "^IXIC", "^DJI", "^VIX", "GC=F", "CL=F"],
  commodities: ["GC=F", "SI=F", "CL=F", "NG=F"],
  forex: ["USDINR=X", "EURUSD=X", "GBPUSD=X", "JPY=X", "DX-Y.NYB"],
  crypto: ["BTC-USD", "ETH-USD", "SOL-USD"],
};

const NUM_FMT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const TREND_DOT = `<span class="insight-dot"></span>`;
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toTs(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getTime();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function asDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatSigned(value, digits = 2) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function safeSnippet(text, max = 140) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}...`;
}

function toneLabel(score) {
  if (score >= 25) return "Positive";
  if (score <= -25) return "Negative";
  return "Neutral";
}

function toneClass(score) {
  if (score >= 20) return "tone-positive";
  if (score <= -20) return "tone-negative";
  return "tone-neutral";
}

function getItemsSorted() {
  return [...(state.feedItems || [])].sort((a, b) => toTs(b.publishedAt) - toTs(a.publishedAt));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function keywordStats(items, limit = 30) {
  const map = new Map();
  items.forEach((item) => {
    const tokens = tokenize(`${item.title || ""} ${item.summary || ""}`);
    tokens.forEach((token) => {
      map.set(token, (map.get(token) || 0) + 1);
    });
  });
  return Array.from(map.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function sentimentCounts(items) {
  const counts = { positive: 0, neutral: 0, negative: 0, score: 0 };
  items.forEach((item) => {
    const label = item?.sentiment?.label || "neutral";
    const score = Number(item?.sentiment?.score) || 0;
    if (label === "positive") counts.positive += 1;
    else if (label === "negative") counts.negative += 1;
    else counts.neutral += 1;
    counts.score += score;
  });
  return counts;
}

function buildTimelineBuckets(items, bucketHours = 3, totalHours = 24) {
  const now = Date.now();
  const buckets = Array.from({ length: totalHours / bucketHours }, (_, idx) => {
    const end = now - idx * bucketHours * 60 * 60 * 1000;
    const start = end - bucketHours * 60 * 60 * 1000;
    return {
      label: `${totalHours - idx * bucketHours}h`,
      start,
      end,
      count: 0,
    };
  }).reverse();

  items.forEach((item) => {
    const ts = toTs(item.publishedAt);
    const hit = buckets.find((bucket) => ts >= bucket.start && ts < bucket.end);
    if (hit) hit.count += 1;
  });

  return buckets;
}

function buildAgeDistribution(items) {
  const now = Date.now();
  const bands = [
    { label: "<1h", min: 0, max: 1 },
    { label: "1-3h", min: 1, max: 3 },
    { label: "3-6h", min: 3, max: 6 },
    { label: "6-12h", min: 6, max: 12 },
    { label: "12-24h", min: 12, max: 24 },
    { label: ">24h", min: 24, max: 10000 },
  ].map((band) => ({ ...band, count: 0 }));

  items.forEach((item) => {
    const ageHrs = (now - toTs(item.publishedAt)) / (60 * 60 * 1000);
    const hit = bands.find((band) => ageHrs >= band.min && ageHrs < band.max);
    if (hit) hit.count += 1;
  });

  return bands;
}

function textIncludes(text, words) {
  return words.some((word) => text.includes(word));
}

function buildAlerts(items) {
  return items
    .map((item) => {
      const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
      let level = "low";
      if (textIncludes(text, ALERT_HIGH)) level = "high";
      else if (textIncludes(text, ALERT_MEDIUM)) level = "medium";
      if (level === "low" && !textIncludes(text, ["alert", "watch", "risk", "surge", "drop", "fall"])) return null;
      return { item, level };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      const diff = priority[b.level] - priority[a.level];
      if (diff !== 0) return diff;
      return toTs(b.item.publishedAt) - toTs(a.item.publishedAt);
    });
}

function countKeywordHits(items, keywords) {
  return items.reduce((total, item) => {
    const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
    return total + keywords.reduce((inner, key) => inner + (text.includes(key) ? 1 : 0), 0);
  }, 0);
}

function classifyByRules(items, rules) {
  return rules.map((rule) => {
    let count = 0;
    let toneScore = 0;
    items.forEach((item) => {
      const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
      if (rule.keys.some((key) => text.includes(key))) {
        count += 1;
        toneScore += Number(item?.sentiment?.score) || 0;
      }
    });
    const tone = count ? Math.round((toneScore / count) * 20) : 0;
    return {
      label: rule.label,
      count,
      tone,
    };
  });
}

function categoryCounts(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.category || "Uncategorized";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function sourceCounts(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.source || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function trendKeywords(items) {
  const now = Date.now();
  const recentCutoff = now - 6 * 60 * 60 * 1000;
  const priorCutoff = now - 24 * 60 * 60 * 1000;

  const recentMap = new Map();
  const priorMap = new Map();

  items.forEach((item) => {
    const ts = toTs(item.publishedAt);
    if (ts < priorCutoff) return;
    const target = ts >= recentCutoff ? recentMap : priorMap;
    tokenize(`${item.title || ""} ${item.summary || ""}`).forEach((token) => {
      target.set(token, (target.get(token) || 0) + 1);
    });
  });

  const keys = new Set([...recentMap.keys(), ...priorMap.keys()]);
  return Array.from(keys)
    .map((word) => {
      const recent = recentMap.get(word) || 0;
      const prior = priorMap.get(word) || 0;
      return { word, recent, prior, delta: recent - prior };
    })
    .filter((row) => row.recent > 0)
    .sort((a, b) => {
      if (b.delta !== a.delta) return b.delta - a.delta;
      return b.recent - a.recent;
    })
    .slice(0, 12);
}

function collectQuotes() {
  const map = new Map();
  Object.values(state.marketSnapshots || {}).forEach((rows) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row) => {
      const symbol = row?.symbol;
      if (!symbol) return;
      if (!map.has(symbol)) map.set(symbol, row);
    });
  });
  return map;
}

function quotePct(row) {
  const value = Number(row?.regularMarketChangePercent);
  return Number.isFinite(value) ? value : null;
}

function quotePrice(row) {
  const value = Number(row?.regularMarketPrice);
  return Number.isFinite(value) ? value : null;
}

function findQuote(quoteMap, symbol) {
  if (quoteMap.has(symbol)) return quoteMap.get(symbol);
  const cleaned = symbol.replace(/[^A-Za-z0-9]/g, "");
  for (const [key, row] of quoteMap.entries()) {
    if (key.replace(/[^A-Za-z0-9]/g, "") === cleaned) return row;
  }
  return null;
}
function quoteSentimentStats(quoteMap) {
  let positive = 0;
  let negative = 0;
  let flat = 0;
  quoteMap.forEach((row) => {
    const pct = quotePct(row);
    if (pct === null) return;
    if (pct > 0.05) positive += 1;
    else if (pct < -0.05) negative += 1;
    else flat += 1;
  });
  return { positive, negative, flat, total: positive + negative + flat };
}

function extractListByRegex(items, regex, limit = 8) {
  return items.filter((item) => regex.test(`${item.title || ""} ${item.summary || ""}`)).slice(0, limit);
}

function displayName(row, fallback) {
  return row?.shortName || row?.longName || fallback;
}

function renderEmpty(message) {
  return `<div class="insight-empty">${escapeHtml(message)}</div>`;
}

function renderMeter({ label, value, min, max, unit = "", tone = "neutral", hint = "" }) {
  const safeValue = Number.isFinite(value) ? value : min;
  const pct = clamp(((safeValue - min) / Math.max(1, max - min)) * 100, 0, 100);
  const readable = Number.isFinite(value) ? `${value.toFixed(1)}${unit}` : "--";
  return `<div class="insight-meter ${escapeAttr(tone)}">
    <div class="insight-meter-head">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(readable)}</span>
    </div>
    <div class="insight-meter-track"><div class="insight-meter-fill" style="width:${pct}%"></div></div>
    ${hint ? `<p class="insight-hint">${escapeHtml(hint)}</p>` : ""}
  </div>`;
}

function renderStatsGrid(stats) {
  return `<div class="insight-stat-grid">${stats
    .map(
      (stat) => `<article class="insight-stat-card">
      <span>${escapeHtml(stat.label)}</span>
      <strong>${escapeHtml(stat.value)}</strong>
    </article>`
    )
    .join("")}</div>`;
}

function renderProgressRows(rows, valueKey = "value") {
  if (!rows.length) return renderEmpty("Waiting for enough data to draw this view.");
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return `<div class="insight-progress-list">${rows
    .map((row) => {
      const value = Number(row[valueKey]) || 0;
      const pct = Math.round((value / max) * 100);
      return `<div class="insight-progress-row">
        <div class="insight-progress-meta">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(String(row.display || value))}</strong>
        </div>
        <div class="insight-progress-track"><div class="insight-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    })
    .join("")}</div>`;
}

function renderTimelineBars(buckets) {
  if (!buckets.length) return renderEmpty("No timeline data available.");
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return `<div class="insight-bars">${buckets
    .map((bucket) => {
      const h = Math.max(8, Math.round((bucket.count / max) * 100));
      return `<div class="insight-bar-wrap">
        <div class="insight-bar" style="height:${h}%"></div>
        <span>${escapeHtml(bucket.label)}</span>
      </div>`;
    })
    .join("")}</div>`;
}

function renderKeywordCloud(words) {
  if (!words.length) return renderEmpty("Keyword cloud will appear once feed data is loaded.");
  const max = Math.max(1, ...words.map((word) => word.count));
  return `<div class="insight-cloud">${words
    .map((word) => {
      const scale = 0.75 + (word.count / max) * 0.65;
      return `<span class="insight-tag" style="font-size:${scale.toFixed(2)}rem">${escapeHtml(word.word)} <em>${word.count}</em></span>`;
    })
    .join("")}</div>`;
}

function renderStoryList(items, limit = 6) {
  if (!items.length) return renderEmpty("No stories available yet. Add RSS panels and refresh.");
  return `<div class="insight-story-list">${items
    .slice(0, limit)
    .map((item) => {
      return `<article class="insight-story-card">
        <a href="${escapeAttr(item.link || "#")}" target="_blank" rel="noopener">${escapeHtml(item.title || "Untitled")}</a>
        <p>${escapeHtml(safeSnippet(item.summary || "", 120) || "Open the article for details.")}</p>
        <div class="insight-story-meta">
          <span>${escapeHtml(item.source || "Unknown")}</span>
          <span>${escapeHtml(formatTimeAgo(asDate(item.publishedAt)))}</span>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function renderAlerts(alerts, limit = 8) {
  if (!alerts.length) return renderEmpty("No high-priority alerts detected from current headlines.");
  return `<div class="insight-alert-list">${alerts
    .slice(0, limit)
    .map(({ item, level }) => {
      return `<article class="insight-alert ${escapeAttr(level)}">
        <div class="insight-alert-top">
          <span class="alert-chip ${escapeAttr(level)}">${escapeHtml(level.toUpperCase())}</span>
          <span>${escapeHtml(formatTimeAgo(asDate(item.publishedAt)))}</span>
        </div>
        <a href="${escapeAttr(item.link || "#")}" target="_blank" rel="noopener">${escapeHtml(item.title || "Untitled")}</a>
      </article>`;
    })
    .join("")}</div>`;
}

function renderSignalChecklist(items) {
  if (!items.length) return renderEmpty("No watch signals computed yet.");
  return `<div class="insight-checklist">${items
    .map((item) => {
      const cls = item.pass ? "pass" : "warn";
      const marker = item.pass ? "OK" : "WATCH";
      return `<div class="insight-check-item ${escapeAttr(cls)}">
        <span class="check-marker">${escapeHtml(marker)}</span>
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </div>`;
    })
    .join("")}</div>`;
}

function renderRegionMap(rows, className = "") {
  if (!rows.length) return renderEmpty("Map signals are not available yet.");
  return `<div class="insight-region-map ${escapeAttr(className)}">${rows
    .map((row) => {
      return `<article class="insight-region-card ${escapeAttr(toneClass(row.tone || 0))}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(String(row.count))}</strong>
        <small>${escapeHtml(toneLabel(row.tone || 0))}</small>
      </article>`;
    })
    .join("")}</div>`;
}

function renderQuoteGrid(quoteMap, symbols) {
  const rows = symbols
    .map((symbol) => {
      const row = findQuote(quoteMap, symbol);
      if (!row) return null;
      const pct = quotePct(row);
      const price = quotePrice(row);
      return {
        symbol,
        name: displayName(row, symbol),
        pct,
        price,
      };
    })
    .filter(Boolean);

  if (!rows.length) return renderEmpty("Live quote data is not available for this board right now.");

  return `<div class="insight-quote-grid">${rows
    .map((row) => {
      const cls = (row.pct || 0) >= 0 ? "up" : "down";
      return `<article class="insight-quote-card ${escapeAttr(cls)}">
        <h4>${escapeHtml(row.name)}</h4>
        <p>${escapeHtml(row.symbol)}</p>
        <strong>${row.price === null ? "--" : escapeHtml(NUM_FMT.format(row.price))}</strong>
        <span>${row.pct === null ? "--" : `${formatSigned(row.pct)}%`}</span>
      </article>`;
    })
    .join("")}</div>`;
}

function renderTrendingTable(rows) {
  if (!rows.length) return renderEmpty("Trending topics require more recent feed updates.");
  return `<div class="insight-table">${rows
    .map((row) => {
      const cls = row.delta >= 0 ? "up" : "down";
      const trend = row.delta >= 0 ? "Rising" : "Cooling";
      return `<div class="insight-table-row ${escapeAttr(cls)}">
        <span>${TREND_DOT}${escapeHtml(row.word)}</span>
        <strong>${escapeHtml(String(row.recent))}</strong>
        <small>${escapeHtml(`${trend} ${formatSigned(row.delta, 0)}`)}</small>
      </div>`;
    })
    .join("")}</div>`;
}

function buildContext() {
  const items = getItemsSorted();
  const counts = sentimentCounts(items);
  const sentimentIndex = items.length ? clamp((counts.score / items.length) * 25, -100, 100) : 0;
  const keywords = keywordStats(items, 36);
  const alerts = buildAlerts(items);
  const quotes = collectQuotes();
  const quoteStats = quoteSentimentStats(quotes);

  const riskMentions = countKeywordHits(items.slice(0, 160), RISK_WORDS);
  const riskScore = clamp(riskMentions * 2.8, 0, 100);

  const timeline = buildTimelineBuckets(items, 3, 24);
  const ageBands = buildAgeDistribution(items);

  const categoryFlow = categoryCounts(items);
  const sourceFlow = sourceCounts(items);
  const sectors = classifyByRules(items.slice(0, 180), SECTOR_RULES).sort((a, b) => b.count - a.count);
  const indiaRegions = classifyByRules(items.slice(0, 180), INDIA_REGION_RULES);
  const globalRegions = classifyByRules(items.slice(0, 180), GLOBAL_REGION_RULES);

  const trending = trendKeywords(items);

  const regulation = extractListByRegex(items, /(sebi|rbi|policy|compliance|tax|ban|guideline)/i, 8);
  const ipo = extractListByRegex(items, /(ipo|fpo|listing|anchor|subscription|gmp)/i, 8);
  const earnings = extractListByRegex(items, /(result|earnings|guidance|quarter|ebitda|q[1-4])/i, 8);

  return {
    items,
    counts,
    sentimentIndex,
    keywords,
    alerts,
    quotes,
    quoteStats,
    riskScore,
    timeline,
    ageBands,
    categoryFlow,
    sourceFlow,
    sectors,
    indiaRegions,
    globalRegions,
    trending,
    regulation,
    ipo,
    earnings,
  };
}
function renderMarketMoodMeter(ctx) {
  return [
    renderMeter({
      label: "Headline Sentiment Index",
      value: ctx.sentimentIndex,
      min: -100,
      max: 100,
      tone: toneClass(ctx.sentimentIndex),
      hint: `${toneLabel(ctx.sentimentIndex)} tone from ${ctx.items.length} headlines`,
    }),
    renderStatsGrid([
      { label: "Positive", value: String(ctx.counts.positive) },
      { label: "Neutral", value: String(ctx.counts.neutral) },
      { label: "Negative", value: String(ctx.counts.negative) },
      { label: "Coverage", value: String(ctx.items.length) },
    ]),
  ].join("");
}

function renderRiskThermometer(ctx) {
  const riskWords = keywordStats(
    ctx.items.filter((item) => RISK_WORDS.some((word) => `${item.title || ""} ${item.summary || ""}`.toLowerCase().includes(word))),
    6
  );

  return [
    renderMeter({
      label: "Risk Pressure",
      value: ctx.riskScore,
      min: 0,
      max: 100,
      tone: ctx.riskScore >= 65 ? "tone-negative" : ctx.riskScore >= 40 ? "tone-neutral" : "tone-positive",
      hint: "Based on risk terms in recent headlines",
    }),
    renderProgressRows(riskWords.map((item) => ({ label: item.word, value: item.count }))),
  ].join("");
}

function renderBreadthMeter(ctx) {
  const total = ctx.quoteStats.total || 0;
  const breadth = total ? ((ctx.quoteStats.positive - ctx.quoteStats.negative) / total) * 100 : 0;
  return [
    renderMeter({
      label: "Market Breadth",
      value: breadth,
      min: -100,
      max: 100,
      tone: toneClass(breadth),
      hint: "Live quote breadth from tracked symbols",
    }),
    renderStatsGrid([
      { label: "Advancing", value: String(ctx.quoteStats.positive) },
      { label: "Declining", value: String(ctx.quoteStats.negative) },
      { label: "Flat", value: String(ctx.quoteStats.flat) },
      { label: "Tracked", value: String(total) },
    ]),
  ].join("");
}

function renderNewsVelocity(ctx) {
  return renderTimelineBars(ctx.timeline);
}

function renderSentimentMix(ctx) {
  const total = Math.max(1, ctx.items.length);
  const pos = Math.round((ctx.counts.positive / total) * 100);
  const neu = Math.round((ctx.counts.neutral / total) * 100);
  const neg = Math.max(0, 100 - pos - neu);

  return `<div class="insight-donut-wrap">
    <div class="insight-donut" style="background:conic-gradient(#16a34a 0 ${pos}%, #94a3b8 ${pos}% ${pos + neu}%, #dc2626 ${pos + neu}% 100%)">
      <span>${escapeHtml(String(total))}<small>items</small></span>
    </div>
    <div class="insight-legend">
      <div><span class="legend-dot pos"></span>Positive ${escapeHtml(String(pos))}%</div>
      <div><span class="legend-dot neu"></span>Neutral ${escapeHtml(String(neu))}%</div>
      <div><span class="legend-dot neg"></span>Negative ${escapeHtml(String(neg))}%</div>
    </div>
  </div>`;
}

function renderKeywordCloudPanel(ctx) {
  return renderKeywordCloud(ctx.keywords.slice(0, 30));
}

function renderTrendingTopics(ctx) {
  return renderTrendingTable(ctx.trending.slice(0, 10));
}

function renderBreakingAlerts(ctx) {
  return renderAlerts(ctx.alerts, 8);
}

function renderRegulationAlerts(ctx) {
  return renderStoryList(ctx.regulation, 7);
}

function renderIpoMonitor(ctx) {
  return renderStoryList(ctx.ipo, 7);
}

function renderEarningsRadar(ctx) {
  return renderStoryList(ctx.earnings, 7);
}

function renderSectorRotation(ctx) {
  return renderProgressRows(
    ctx.sectors.slice(0, 6).map((sector) => ({
      label: `${sector.label} (${toneLabel(sector.tone)})`,
      value: sector.count,
      display: `${sector.count}`,
    }))
  );
}

function renderSourceDiversity(ctx) {
  return renderProgressRows(ctx.sourceFlow.slice(0, 8));
}

function renderCategoryFlow(ctx) {
  return renderProgressRows(ctx.categoryFlow.slice(0, 8));
}

function renderTimeline24h(ctx) {
  return renderTimelineBars(ctx.timeline);
}

function renderAgeDistribution(ctx) {
  return renderProgressRows(ctx.ageBands.map((band) => ({ label: band.label, value: band.count })));
}

function renderTopStories(ctx) {
  return renderStoryList(ctx.items, 7);
}

function renderActionWatchlist(ctx) {
  const totalQuotes = ctx.quoteStats.total || 0;
  const breadth = totalQuotes ? ((ctx.quoteStats.positive - ctx.quoteStats.negative) / totalQuotes) * 100 : 0;
  const highAlerts = ctx.alerts.filter((alert) => alert.level === "high").length;
  const freshNews = ctx.ageBands.find((band) => band.label === "<1h")?.count || 0;
  const checks = [
    {
      label: "Breadth is supportive",
      pass: breadth >= 0,
      detail: `Current breadth index: ${formatSigned(breadth, 1)}`,
    },
    {
      label: "Risk spike is controlled",
      pass: ctx.riskScore < 65,
      detail: `Risk pressure score: ${ctx.riskScore.toFixed(1)} / 100`,
    },
    {
      label: "High-priority alerts are limited",
      pass: highAlerts <= 3,
      detail: `${highAlerts} high alerts detected`,
    },
    {
      label: "News feed is active",
      pass: freshNews >= 4,
      detail: `${freshNews} fresh headlines in the last hour`,
    },
  ];
  return renderSignalChecklist(checks);
}

function renderIndiaRegionsMap(ctx) {
  return renderRegionMap(ctx.indiaRegions, "india-map");
}

function renderGlobalCuesMap(ctx) {
  return renderRegionMap(ctx.globalRegions, "global-map");
}

function renderIndiaLeaders(ctx) {
  return renderQuoteGrid(ctx.quotes, WATCHLIST_SYMBOLS.india);
}

function renderGlobalLeaders(ctx) {
  return renderQuoteGrid(ctx.quotes, WATCHLIST_SYMBOLS.global);
}

function renderCommodityBoard(ctx) {
  return renderQuoteGrid(ctx.quotes, WATCHLIST_SYMBOLS.commodities);
}

function renderForexBoard(ctx) {
  return renderQuoteGrid(ctx.quotes, WATCHLIST_SYMBOLS.forex);
}

function renderCryptoBoard(ctx) {
  return renderQuoteGrid(ctx.quotes, WATCHLIST_SYMBOLS.crypto);
}

function renderSafeHavenMeter(ctx) {
  const gold = quotePct(findQuote(ctx.quotes, "GC=F")) || 0;
  const dxy = quotePct(findQuote(ctx.quotes, "DX-Y.NYB")) || 0;
  const vix = quotePct(findQuote(ctx.quotes, "^VIX")) || 0;
  const btc = quotePct(findQuote(ctx.quotes, "BTC-USD")) || 0;
  const score = clamp(50 + gold * 10 + dxy * 8 + vix * 6 - btc * 4, 0, 100);

  return [
    renderMeter({
      label: "Risk-Off Bias",
      value: score,
      min: 0,
      max: 100,
      tone: score >= 65 ? "tone-negative" : score >= 45 ? "tone-neutral" : "tone-positive",
      hint: "Higher value means stronger safe-haven demand",
    }),
    renderStatsGrid([
      { label: "Gold", value: `${formatSigned(gold)}%` },
      { label: "Dollar", value: `${formatSigned(dxy)}%` },
      { label: "VIX", value: `${formatSigned(vix)}%` },
      { label: "BTC", value: `${formatSigned(btc)}%` },
    ]),
  ].join("");
}

function renderVolatilityRadar(ctx) {
  const vix = quotePct(findQuote(ctx.quotes, "^VIX")) || 0;
  const negRatio = ctx.items.length ? ctx.counts.negative / ctx.items.length : 0;
  const score = clamp(ctx.riskScore * 0.5 + negRatio * 55 + Math.max(0, vix) * 6, 0, 100);

  return [
    renderMeter({
      label: "Volatility Score",
      value: score,
      min: 0,
      max: 100,
      tone: score >= 65 ? "tone-negative" : score >= 40 ? "tone-neutral" : "tone-positive",
      hint: "Blend of VIX move, negative tone, and risk keyword density",
    }),
    renderStatsGrid([
      { label: "VIX Change", value: `${formatSigned(vix)}%` },
      { label: "Negative Tone", value: `${Math.round(negRatio * 100)}%` },
      { label: "Risk Score", value: `${ctx.riskScore.toFixed(0)}` },
      { label: "Headlines", value: `${ctx.items.length}` },
    ]),
  ].join("");
}
function renderFiiDiiProxy(ctx) {
  const bank = ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS"]
    .map((symbol) => quotePct(findQuote(ctx.quotes, symbol)) || 0)
    .reduce((a, b) => a + b, 0);
  const it = ["TCS.NS", "INFY.NS"]
    .map((symbol) => quotePct(findQuote(ctx.quotes, symbol)) || 0)
    .reduce((a, b) => a + b, 0);
  const usdInr = quotePct(findQuote(ctx.quotes, "USDINR=X")) || 0;
  const proxy = clamp((bank - it - usdInr) * 8, -100, 100);

  return [
    renderMeter({
      label: "Flow Bias Proxy",
      value: proxy,
      min: -100,
      max: 100,
      tone: toneClass(proxy),
      hint: "Positive implies domestic risk appetite bias",
    }),
    renderStatsGrid([
      { label: "Banks Basket", value: `${formatSigned(bank)}%` },
      { label: "IT Basket", value: `${formatSigned(it)}%` },
      { label: "USDINR", value: `${formatSigned(usdInr)}%` },
      { label: "Proxy", value: `${formatSigned(proxy, 1)}` },
    ]),
  ].join("");
}

function renderBeginnerBrief(ctx) {
  if (!ctx.items.length) return renderEmpty("Add and refresh RSS panels to generate a beginner brief.");

  const mood = toneLabel(ctx.sentimentIndex).toLowerCase();
  const topKeywords = ctx.keywords.slice(0, 5).map((word) => word.word).join(", ") || "market cues";
  const highAlerts = ctx.alerts.filter((alert) => alert.level === "high").length;

  const lines = [
    `Overall tone looks ${mood} from ${ctx.items.length} recent headlines.`,
    `Top active themes are ${topKeywords}.`,
    `${highAlerts} high-priority alerts are active, so position sizing discipline is important.`,
    "Use this dashboard for awareness, then confirm with charts and official filings before decisions.",
  ];

  return `<ul class="insight-bullets">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
}

function renderNextWatchSignals(ctx) {
  const signals = [
    {
      label: "Policy Pulse",
      detail: ctx.regulation.length
        ? `${ctx.regulation.length} regulation headlines are active now.`
        : "No major policy spike right now.",
      pass: ctx.regulation.length <= 4,
    },
    {
      label: "IPO Heat",
      detail: ctx.ipo.length ? `${ctx.ipo.length} IPO/listing stories are trending.` : "IPO chatter is currently calm.",
      pass: ctx.ipo.length <= 5,
    },
    {
      label: "Earnings Intensity",
      detail: ctx.earnings.length ? `${ctx.earnings.length} earnings stories are in focus.` : "Earnings noise is currently low.",
      pass: ctx.earnings.length <= 6,
    },
    {
      label: "Volatility Zone",
      detail: `Volatility score is ${ctx.riskScore.toFixed(0)} / 100.`,
      pass: ctx.riskScore < 65,
    },
    {
      label: "Breadth Check",
      detail: `Advancers: ${ctx.quoteStats.positive}, Decliners: ${ctx.quoteStats.negative}`,
      pass: ctx.quoteStats.positive >= ctx.quoteStats.negative,
    },
  ];

  return renderSignalChecklist(signals);
}

function renderFearGreedIndex(ctx) {
  const sentimentBias = clamp((ctx.sentimentIndex + 100) / 2, 0, 100);
  const riskInverse = 100 - ctx.riskScore;
  const breadthScore = ctx.quoteStats.total
    ? clamp(((ctx.quoteStats.positive - ctx.quoteStats.negative) / Math.max(1, ctx.quoteStats.total) + 1) * 50, 0, 100)
    : 50;
  const vix = Math.abs(quotePct(findQuote(ctx.quotes, "^VIX")) || 0);
  const vixScore = clamp(100 - vix * 8, 0, 100);
  const composite = Math.round(sentimentBias * 0.3 + riskInverse * 0.25 + breadthScore * 0.25 + vixScore * 0.2);

  let zone = "Neutral";
  let zoneClass = "fg-neutral";
  if (composite >= 75) { zone = "Extreme Greed"; zoneClass = "fg-extreme-greed"; }
  else if (composite >= 60) { zone = "Greed"; zoneClass = "fg-greed"; }
  else if (composite <= 25) { zone = "Extreme Fear"; zoneClass = "fg-extreme-fear"; }
  else if (composite <= 40) { zone = "Fear"; zoneClass = "fg-fear"; }

  const needleDeg = Math.round((composite / 100) * 180 - 90);

  return `<div class="fg-gauge-wrap">
    <div class="fg-gauge">
      <div class="fg-arc"></div>
      <div class="fg-needle" style="transform:rotate(${needleDeg}deg)"></div>
      <div class="fg-center">
        <strong>${composite}</strong>
        <span>${escapeHtml(zone)}</span>
      </div>
    </div>
    <div class="fg-labels">
      <span class="fg-extreme-fear">Extreme Fear</span>
      <span class="fg-fear">Fear</span>
      <span class="fg-neutral">Neutral</span>
      <span class="fg-greed">Greed</span>
      <span class="fg-extreme-greed">Extreme Greed</span>
    </div>
  </div>
  ${renderStatsGrid([
    { label: "Sentiment", value: `${sentimentBias.toFixed(0)}` },
    { label: "Risk Inv.", value: `${riskInverse.toFixed(0)}` },
    { label: "Breadth", value: `${breadthScore.toFixed(0)}` },
    { label: "VIX Score", value: `${vixScore.toFixed(0)}` },
  ])}`;
}

function renderSectorHeatmap(ctx) {
  const sectors = classifyByRules(ctx.items.slice(0, 200), SECTOR_RULES).sort((a, b) => b.count - a.count);
  if (!sectors.length || !sectors.some(s => s.count > 0)) return renderEmpty("Sector heatmap needs feed data. Add RSS panels and refresh.");

  return `<div class="sector-heatmap-grid">${sectors.map(sector => {
    let bgClass = "shm-neutral";
    if (sector.tone >= 20) bgClass = "shm-positive";
    else if (sector.tone <= -20) bgClass = "shm-negative";
    const intensity = Math.min(1, sector.count / 20);
    return `<div class="shm-cell ${escapeAttr(bgClass)}" style="opacity:${(0.5 + intensity * 0.5).toFixed(2)}">
      <strong>${escapeHtml(sector.label)}</strong>
      <span>${sector.count} mentions</span>
      <small>${escapeHtml(toneLabel(sector.tone))}</small>
    </div>`;
  }).join("")}</div>`;
}

function renderNewsFrequency(ctx) {
  const sources = sourceCounts(ctx.items);
  if (!sources.length) return renderEmpty("Add RSS panels and refresh to see news frequency.");

  const max = Math.max(1, ...sources.map(s => s.value));
  return `<div class="nf-tracker">${sources.slice(0, 10).map(source => {
    const pct = Math.round((source.value / max) * 100);
    const barSegments = Array.from({ length: 10 }, (_, i) => {
      const filled = (i + 1) * 10 <= pct;
      return `<div class="nf-seg ${filled ? 'nf-filled' : ''}"></div>`;
    }).join("");
    return `<div class="nf-row">
      <span class="nf-label">${escapeHtml(source.label)}</span>
      <div class="nf-bar">${barSegments}</div>
      <strong>${source.value}</strong>
    </div>`;
  }).join("")}</div>`;
}

function renderCurrencyStrength(ctx) {
  const pairs = [
    { label: "USD/INR", symbol: "USDINR=X", inverse: true },
    { label: "EUR/USD", symbol: "EURUSD=X", inverse: false },
    { label: "GBP/USD", symbol: "GBPUSD=X", inverse: false },
    { label: "JPY (USD/JPY)", symbol: "JPY=X", inverse: true },
  ];

  const rows = pairs.map(pair => {
    const pct = quotePct(findQuote(ctx.quotes, pair.symbol));
    const display = pct !== null ? pct : 0;
    const strength = pair.inverse ? -display : display;
    return { ...pair, pct: display, strength };
  });

  if (rows.every(r => r.pct === 0)) {
    return renderEmpty("Currency data will appear when market quotes are available.");
  }

  return `<div class="cs-meter-list">${rows.map(r => {
    const barW = Math.min(Math.abs(r.strength) * 12, 100);
    const dir = r.strength >= 0 ? "positive" : "negative";
    return `<div class="cs-row">
      <span class="cs-label">${escapeHtml(r.label)}</span>
      <div class="cs-bar-track">
        <div class="cs-bar-fill cs-${dir}" style="width:${barW}%"></div>
      </div>
      <strong class="cs-val cs-${dir}">${formatSigned(r.pct)}%</strong>
    </div>`;
  }).join("")}</div>`;
}

function renderTopMovers(ctx) {
  const allQuotes = [];
  ctx.quotes.forEach((row, symbol) => {
    const pct = quotePct(row);
    if (pct === null) return;
    allQuotes.push({ symbol, name: displayName(row, symbol), pct, price: quotePrice(row) });
  });

  if (!allQuotes.length) return renderEmpty("Top movers board needs live quote data.");

  allQuotes.sort((a, b) => b.pct - a.pct);
  const gainers = allQuotes.filter(q => q.pct > 0).slice(0, 4);
  const losers = allQuotes.filter(q => q.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 4);

  function renderSide(title, items, cls) {
    if (!items.length) return `<div class="tm-side"><h4 class="tm-title ${cls}">${title}</h4><p class="insight-empty">No ${title.toLowerCase()} right now</p></div>`;
    return `<div class="tm-side">
      <h4 class="tm-title ${cls}">${escapeHtml(title)}</h4>
      ${items.map(q => `<div class="tm-item ${cls}">
        <div class="tm-info"><strong>${escapeHtml(q.name)}</strong><span>${escapeHtml(q.symbol)}</span></div>
        <div class="tm-val"><strong>${formatSigned(q.pct)}%</strong></div>
      </div>`).join("")}
    </div>`;
  }

  return `<div class="tm-board">
    ${renderSide("Top Gainers", gainers, "tm-up")}
    ${renderSide("Top Losers", losers, "tm-down")}
  </div>`;
}

function renderSessionClock(ctx) {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcDecimal = utcH + utcM / 60;

  const sessions = [
    { label: "🇮🇳 India (NSE)", open: 3.75, close: 10, tz: "IST (UTC+5:30)", flag: "in" },
    { label: "🇯🇵 Japan (TSE)", open: 0, close: 6, tz: "JST (UTC+9)", flag: "jp" },
    { label: "🇬🇧 London (LSE)", open: 8, close: 16.5, tz: "GMT/BST", flag: "gb" },
    { label: "🇺🇸 US (NYSE)", open: 13.5, close: 20, tz: "EST (UTC-5)", flag: "us" },
    { label: "🇭🇰 Hong Kong", open: 1.5, close: 8, tz: "HKT (UTC+8)", flag: "hk" },
    { label: "🇩🇪 Germany (FSE)", open: 7, close: 15.5, tz: "CET (UTC+1)", flag: "de" },
  ];

  return `<div class="sc-grid">${sessions.map(s => {
    let isOpen = false;
    if (s.open < s.close) {
      isOpen = utcDecimal >= s.open && utcDecimal < s.close;
    } else {
      isOpen = utcDecimal >= s.open || utcDecimal < s.close;
    }

    const elapsed = isOpen
      ? ((utcDecimal - s.open + 24) % 24)
      : 0;
    const duration = ((s.close - s.open) + 24) % 24;
    const progress = isOpen ? Math.round((elapsed / duration) * 100) : 0;
    const statusClass = isOpen ? "sc-open" : "sc-closed";
    const statusText = isOpen ? "OPEN" : "CLOSED";

    return `<div class="sc-card ${statusClass}">
      <div class="sc-header">
        <span class="sc-name">${escapeHtml(s.label)}</span>
        <span class="sc-badge ${statusClass}">${statusText}</span>
      </div>
      <span class="sc-tz">${escapeHtml(s.tz)}</span>
      ${isOpen ? `<div class="sc-progress-track"><div class="sc-progress-fill" style="width:${progress}%"></div></div>` : `<div class="sc-progress-track"><div class="sc-progress-fill sc-empty"></div></div>`}
    </div>`;
  }).join("")}</div>`;
}

const RENDERERS = {
  "market-mood-meter": renderMarketMoodMeter,
  "risk-thermometer": renderRiskThermometer,
  "breadth-meter": renderBreadthMeter,
  "news-velocity": renderNewsVelocity,
  "sentiment-mix": renderSentimentMix,
  "keyword-cloud": renderKeywordCloudPanel,
  "trending-topics": renderTrendingTopics,
  "breaking-alerts": renderBreakingAlerts,
  "regulation-alerts": renderRegulationAlerts,
  "ipo-monitor": renderIpoMonitor,
  "earnings-radar": renderEarningsRadar,
  "sector-rotation": renderSectorRotation,
  "source-diversity": renderSourceDiversity,
  "category-flow": renderCategoryFlow,
  "timeline-24h": renderTimeline24h,
  "age-distribution": renderAgeDistribution,
  "top-stories": renderTopStories,
  "action-watchlist": renderActionWatchlist,
  "india-regions-map": renderIndiaRegionsMap,
  "global-cues-map": renderGlobalCuesMap,
  "india-leaders": renderIndiaLeaders,
  "global-leaders": renderGlobalLeaders,
  "commodity-board": renderCommodityBoard,
  "forex-board": renderForexBoard,
  "crypto-board": renderCryptoBoard,
  "safe-haven-meter": renderSafeHavenMeter,
  "volatility-radar": renderVolatilityRadar,
  "fii-dii-proxy": renderFiiDiiProxy,
  "beginner-brief": renderBeginnerBrief,
  "next-watch-signals": renderNextWatchSignals,
  "fear-greed-index": renderFearGreedIndex,
  "sector-heatmap": renderSectorHeatmap,
  "news-frequency": renderNewsFrequency,
  "currency-strength": renderCurrencyStrength,
  "top-movers": renderTopMovers,
  "session-clock": renderSessionClock,
};

export function getInsightPanel(id) {
  return INSIGHT_PANELS.find((panel) => panel.id === id) || null;
}

export function buildInsightContext() {
  return buildContext();
}

export function renderInsightPanel(id, context = null) {
  const render = RENDERERS[id];
  if (!render) return renderEmpty("Insight renderer not found.");
  const safeContext = context || buildContext();
  try {
    return render(safeContext);
  } catch (error) {
    return renderEmpty(`Unable to render this panel: ${error.message || "unknown error"}`);
  }
}
