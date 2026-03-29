import { refs, state } from "./state.js";
import { escapeHtml } from "./utils.js";

export const MARKET_PANELS = [
  {
    id: "india-live-snapshot",
    name: "India Live Snapshot",
    region: "India",
    symbols: [
      "^NSEI",
      "^BSESN",
      "RELIANCE.NS",
      "TCS.NS",
      "HDFCBANK.NS",
      "INFY.NS",
      "SBIN.NS",
      "ICICIBANK.NS",
      "LT.NS",
      "ITC.NS",
      "USDINR=X",
    ],
  },
  {
    id: "global-live-snapshot",
    name: "Global Live Snapshot",
    region: "Global",
    symbols: [
      "^GSPC",
      "^IXIC",
      "^DJI",
      "^VIX",
      "GC=F",
      "SI=F",
      "CL=F",
      "NG=F",
      "EURUSD=X",
      "GBPUSD=X",
      "JPY=X",
      "BTC-USD",
      "ETH-USD",
      "SOL-USD",
      "DX-Y.NYB",
    ],
  },
];

function quoteUrl(symbols) {
  return `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
}

export async function fetchQuotes(symbols) {
  const customProxy = state.settings.brokerApiUrl?.trim();
  const attempts = [];
  const direct = quoteUrl(symbols);

  if (customProxy) {
    attempts.push(customProxy.includes("{symbols}") ? customProxy.replace("{symbols}", encodeURIComponent(symbols.join(","))) : customProxy);
  }
  
  // Use more aggressive CORS proxies for Yahoo Finance since it blocks unauthenticated API hits.
  attempts.push(`https://corsproxy.io/?${encodeURIComponent(direct)}`);
  attempts.push(`https://api.allorigins.win/get?url=${encodeURIComponent(direct)}`);
  attempts.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`);
  attempts.push(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(direct)}`);
  attempts.push(direct); // try direct last, it usually fails

  let lastError;
  for (const url of attempts) {
    try {
      const resp = await fetch(url, { cache: "no-store", headers: { "Accept": "application/json" } });
      if (!resp.ok) continue;

      const rawText = await resp.text();
      let json;
      try {
        json = JSON.parse(rawText);
        // Unwrap allorigins JSON proxy wrapper
        if (json && typeof json.contents === "string") {
          json = JSON.parse(json.contents);
        }
      } catch (e) {
        continue; // Next proxy if parsing fails
      }

      const rows = json?.quoteResponse?.result || json?.data || json?.quotes || [];
      if (Array.isArray(rows) && rows.length) return rows;
    } catch (e) {
      lastError = e;
      // Continue fallback.
    }
  }

  console.warn("Proxy chains failed for quotes", lastError);
  return [];
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return value.toFixed(2);
}

function formatChange(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function quoteCard(row) {
  const symbol = row?.symbol || "Unknown";
  const name = row?.shortName || row?.longName || symbol;
  const price = Number(row?.regularMarketPrice);
  const pct = Number(row?.regularMarketChangePercent);
  const up = Number.isFinite(pct) ? pct >= 0 : true;
  const cls = up ? "quote-up" : "quote-down";
  return `<article class="quote-card ${cls}">
    <h4>${escapeHtml(name)}</h4>
    <p class="quote-symbol">${escapeHtml(symbol)}</p>
    <strong>${formatNumber(price)}</strong>
    <span>${formatChange(pct)}</span>
  </article>`;
}

export function renderQuoteGrid(rows) {
  if (!Array.isArray(rows) || !rows.length) return `<div class="feed-error">Unable to load live quotes right now.</div>`;
  return `<div class="quote-grid">${rows.slice(0, 10).map(quoteCard).join("")}</div>`;
}

export async function refreshMarketPanels() {
  const panels = state.panels.filter((panel) => panel.type === "market");
  await Promise.all(
    panels.map(async (panel) => {
      const board = MARKET_PANELS.find((item) => item.id === panel.id);
      if (!board) return;

      const instanceId = panel.instanceId || panel.id;
      const host = document.getElementById(`market-container-${instanceId}`);
      if (!host) return;
      host.innerHTML = `<div class="feed-loading"><div class="spinner"></div><span>Loading market quotes...</span></div>`;

      const rows = await fetchQuotes(board.symbols);
      if (rows.length) state.marketSnapshots[board.id] = rows;
      host.innerHTML = renderQuoteGrid(rows);
    })
  );
}

export function renderBeginnerBrief() {
  if (!refs.beginnerBrief) return;
  const total = state.feedItems.length;
  if (!total) {
    refs.beginnerBrief.textContent = "Add and refresh RSS panels to generate a beginner-friendly market brief.";
    return;
  }

  const recent = state.feedItems.slice(0, 60);
  const positive = recent.filter((item) => item.sentiment.label === "positive").length;
  const negative = recent.filter((item) => item.sentiment.label === "negative").length;
  const neutral = recent.length - positive - negative;

  const tone = positive > negative ? "slightly positive" : negative > positive ? "risk-tilted" : "balanced";
  const explanation = [
    `Current headline tone is ${tone}.`,
    `${positive} positive, ${neutral} neutral, and ${negative} negative signals were detected in the latest headlines.`,
    "Use this as context, not as direct trade advice. Check price action and risk before any decision.",
  ];
  refs.beginnerBrief.innerHTML = `<ul>${explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
}
