// ─── RSS XML Parsing & Normalization ─────────────────────

import { stripHtml, safeDate, hashCode } from "./utils.js";

const POSITIVE_WORDS = [
  "gain", "surge", "record", "rally", "growth", "upgrade", "beats",
  "profit", "strong", "bullish", "recover", "rise", "expands", "upside",
  "positive", "boost", "soars", "outperform", "dividend", "breakout",
];

const NEGATIVE_WORDS = [
  "fall", "drops", "crash", "decline", "downgrade", "loss", "weak",
  "bearish", "lawsuit", "risk", "concern", "cuts", "slowdown", "inflation",
  "negative", "slump", "plunge", "default", "scam", "fraud",
];

export function scoreSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach((word) => {
    if (lower.includes(word)) score += 1;
  });
  NEGATIVE_WORDS.forEach((word) => {
    if (lower.includes(word)) score -= 1;
  });
  if (score > 0) return { label: "positive", score };
  if (score < 0) return { label: "negative", score };
  return { label: "neutral", score: 0 };
}

/**
 * Parse raw RSS/Atom XML string into normalized items.
 */
export function parseRssXml(xmlText, feed) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const nodes = [...doc.querySelectorAll("item, entry")].slice(0, 35);
  return nodes.map((node) => {
    const title = getNodeText(node, "title");
    const link =
      getNodeText(node, "link") ||
      node.querySelector("link")?.getAttribute("href") ||
      feed.url;
    const summary =
      getNodeText(node, "description") ||
      getNodeText(node, "content") ||
      getNodeText(node, "summary") ||
      "";
    const published =
      getNodeText(node, "pubDate") ||
      getNodeText(node, "updated") ||
      getNodeText(node, "published");
    return normalizeItem({ title, link, description: summary, pubDate: published }, feed);
  });
}

function getNodeText(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() || "";
}

/**
 * Normalize a raw feed item from rss2json or parsed XML.
 */
export function normalizeItem(raw, feed) {
  const title = stripHtml(raw.title || "Untitled");
  const summary = stripHtml(raw.description || raw.content || "");
  const publishedAt = safeDate(raw.pubDate || raw.published || raw.isoDate);
  const sentiment = scoreSentiment(`${title} ${summary}`);
  return {
    id: `${feed.id}-${hashCode(`${title}-${raw.link}`)}`,
    source: feed.name,
    category: feed.category,
    title,
    summary,
    link: raw.link || feed.url,
    publishedAt,
    sentiment,
  };
}

/**
 * Deduplicate items by link URL.
 */
export function dedupeByLink(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.link || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
