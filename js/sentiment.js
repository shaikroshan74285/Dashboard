import { refs, state } from "./state.js";
import { countMatches, escapeHtml } from "./utils.js";

const RISK_BUCKETS = [
  { label: "Regulation", keys: ["sebi", "policy", "rule", "compliance", "ban"] },
  { label: "Macro and Rates", keys: ["inflation", "rbi", "fed", "yield", "repo"] },
  { label: "Earnings", keys: ["results", "earnings", "profit", "guidance", "quarter"] },
  { label: "Global Cues", keys: ["oil", "china", "us", "geopolitics", "tariff"] },
  { label: "Volatility", keys: ["selloff", "volatility", "panic", "correction", "risk"] },
];

const STOP_WORDS = new Set([
  "india",
  "market",
  "markets",
  "stock",
  "stocks",
  "today",
  "latest",
  "with",
  "from",
  "after",
  "amid",
  "that",
  "this",
  "news",
  "live",
  "update",
  "economic",
  "times",
]);

export function renderSentiment() {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  let scoreTotal = 0;
  state.feedItems.forEach((item) => {
    counts[item.sentiment.label] += 1;
    scoreTotal += item.sentiment.score;
  });

  const index = state.feedItems.length ? Math.round((scoreTotal / state.feedItems.length) * 100) : 0;
  if (refs.sentimentScore) refs.sentimentScore.textContent = String(index);
  if (refs.positiveCount) refs.positiveCount.textContent = String(counts.positive);
  if (refs.neutralCount) refs.neutralCount.textContent = String(counts.neutral);
  if (refs.negativeCount) refs.negativeCount.textContent = String(counts.negative);
}

export function renderKeywords() {
  if (!refs.keywordCloud) return;
  const freq = new Map();
  state.feedItems.slice(0, 140).forEach((item) => {
    item.title
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean)
      .forEach((token) => {
        if (token.length < 4 || STOP_WORDS.has(token)) return;
        freq.set(token, (freq.get(token) || 0) + 1);
      });
  });

  const words = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 32);

  refs.keywordCloud.innerHTML = words
    .map(([word, count]) => `<span class="keyword-pill">${escapeHtml(word)} <em>${count}</em></span>`)
    .join("");
}

export function renderRiskRadar() {
  if (!refs.riskRadar) return;
  const text = state.feedItems
    .slice(0, 150)
    .map((item) => `${item.title} ${item.summary}`.toLowerCase())
    .join(" | ");

  const stats = RISK_BUCKETS.map((bucket) => {
    const count = bucket.keys.reduce((total, key) => total + countMatches(text, key), 0);
    return { bucket, count };
  });
  const max = Math.max(1, ...stats.map((item) => item.count));

  refs.riskRadar.innerHTML = stats
    .map(({ bucket, count }) => {
      const pct = Math.round((count / max) * 100);
      return `<div class="risk-row">
        <span class="risk-label">${escapeHtml(bucket.label)}</span>
        <div class="risk-bar-wrap"><div class="risk-bar" style="width:${pct}%"></div></div>
        <span class="risk-count">${count}</span>
      </div>`;
    })
    .join("");
}

export function renderTrendTimeline() {
  if (!refs.trendTimeline) return;
  const now = Date.now();
  const buckets = Array.from({ length: 8 }, (_, idx) => {
    const end = now - idx * 3 * 60 * 60 * 1000;
    const start = end - 3 * 60 * 60 * 1000;
    return { start, end, label: `${24 - idx * 3}h`, count: 0 };
  }).reverse();

  state.feedItems.forEach((item) => {
    const ts = item.publishedAt?.getTime?.() || 0;
    const hit = buckets.find((bucket) => ts >= bucket.start && ts < bucket.end);
    if (hit) hit.count += 1;
  });

  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  refs.trendTimeline.innerHTML = buckets
    .map((bucket) => {
      const height = Math.round((bucket.count / max) * 100);
      return `<div class="trend-bar-wrap">
        <div class="trend-bar" style="height:${Math.max(8, height)}%"></div>
        <span>${escapeHtml(bucket.label)}</span>
      </div>`;
    })
    .join("");
}
