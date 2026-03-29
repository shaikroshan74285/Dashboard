import { state } from "./state.js";

const FALLBACK_PROXY_CHAIN = [
  (url) => url,
  (url) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

async function tryFetch(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function fromResponse(resp) {
  const text = await resp.text();
  if (!text) throw new Error("Proxy returned empty content");

  const contentType = resp.headers.get("content-type") || "";
  let json = null;
  
  if (contentType.includes("application/json") || text.trim().startsWith("{")) {
    try {
      json = JSON.parse(text);
    } catch (_) {
      // Ignore JSON parse errors and fall through
    }
  }

  if (json) {
    if (json.status === "ok" && Array.isArray(json.items) && json.items.length) {
      return { method: "rss2json", items: json.items.slice(0, 35) };
    }
    if (Array.isArray(json.items) && json.items.length) {
      return { method: "rss2json", items: json.items.slice(0, 35) };
    }
    if (typeof json.contents === "string" && json.contents.includes("<")) {
      return { method: "xml", items: json.contents };
    }
  }

  if (/(<(rss|feed|rdf|item|entry)\b|<channel>)/i.test(text)) {
    return { method: "xml", items: text };
  }
  
  throw new Error("Proxy returned invalid content format");
}

function buildCustomProxyUrl(feedUrl) {
  const custom = state.settings.rssProxyUrl?.trim();
  if (!custom) return null;
  if (custom.includes("{url}")) return custom.replace("{url}", encodeURIComponent(feedUrl));
  return `${custom}${custom.includes("?") ? "&" : "?"}url=${encodeURIComponent(feedUrl)}`;
}

export async function fetchFeedWithFallback(feedUrl) {
  const attempts = [];
  const customProxy = buildCustomProxyUrl(feedUrl);
  if (customProxy) attempts.push(customProxy);
  FALLBACK_PROXY_CHAIN.forEach((factory) => attempts.push(factory(feedUrl)));

  for (const url of attempts) {
    try {
      const resp = await tryFetch(url);
      const parsed = await fromResponse(resp);
      if (parsed?.items) return parsed;
    } catch (_) {
      // Continue fallback chain.
    }
  }

  throw new Error("All RSS fetch strategies failed");
}

export async function fetchMultipleFeeds(feeds, processFn, concurrency = 6) {
  const queue = [...feeds];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const feed = queue.shift();
      try {
        const value = await processFn(feed);
        results.push({ feed, status: "ok", value });
      } catch (error) {
        results.push({ feed, status: "error", error: error.message });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, feeds.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
