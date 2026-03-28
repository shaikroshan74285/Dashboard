import { RSS_FEEDS, VIDEO_STREAMS } from "./rss_urls.js";

const STORAGE_KEYS = {
  settings: "marketpulse_settings_v2",
  panels: "marketpulse_panels_v2",
};

const DEFAULT_SETTINGS = {
  sarvamApiKey: "",
  chatUrl: "https://api.sarvam.ai/v1/chat/completions",
  translateUrl: "https://api.sarvam.ai/translate",
  ttsUrl: "https://api.sarvam.ai/text-to-speech",
  chatModel: "sarvam-m",
  ttsModel: "bulbul:v2",
  speaker: "anushka",
  autoRefreshMinutes: 5,
};

const DEFAULT_PANELS = [
  { type: "rss", id: "et-markets" },
  { type: "rss", id: "gnews-india-market" },
  { type: "stream", id: "cnbc18" },
  { type: "rss", id: "wsj-markets" }
];

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "te-IN", label: "Telugu" },
  { code: "ta-IN", label: "Tamil" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "mr-IN", label: "Marathi" },
  { code: "bn-IN", label: "Bengali" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "or-IN", label: "Odia" },
];

const POSITIVE_WORDS = ["gain", "surge", "record", "rally", "growth", "upgrade", "beats", "profit", "strong", "bullish", "recover", "rise", "expands", "upside", "positive"];
const NEGATIVE_WORDS = ["fall", "drops", "crash", "decline", "downgrade", "loss", "weak", "bearish", "lawsuit", "risk", "concern", "cuts", "slowdown", "inflation", "negative"];
const RISK_BUCKETS = [
  { label: "Regulation", keys: ["sebi", "regulation", "compliance", "policy", "rule"] },
  { label: "Macro & Rates", keys: ["rbi", "inflation", "repo", "yield", "fed", "rupee"] },
  { label: "Earnings", keys: ["results", "quarter", "q1", "q2", "q3", "q4", "profit"] },
  { label: "Global Cues", keys: ["us", "china", "oil", "middle east", "war", "tariff"] },
  { label: "Market Volatility", keys: ["volatility", "selloff", "panic", "correction", "crash"] },
];
const STOP_WORDS = new Set(["this", "that", "with", "from", "into", "have", "will", "been", "their", "about", "market", "markets", "today", "india", "stock", "stocks", "after", "more", "amid", "what", "when", "where", "which", "while", "over", "under", "against", "says", "said", "news", "economic", "times", "business", "mint", "live", "update"]);

const state = {
  settings: { ...DEFAULT_SETTINGS },
  panels: [...DEFAULT_PANELS],
  feedItems: [],
  refreshHandle: null,
  lastAiResponse: "",
  lastTranslatedResponse: "",
  isRefreshing: false,
};

const refs = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheRefs();
  hydrateStateFromStorage();
  bindEvents();
  renderLanguageSelects();
  renderSettingsForm();
  
  setupTradingViewWidgets();
  tickClock();
  setInterval(tickClock, 1000);
  applyAutoRefresh();
  
  renderDynamicPanels();
  refreshAllData();
}

function cacheRefs() {
  const ids = [
    "refreshBtn", "autoRefreshSelect", "settingsBtn", "closeSettingsBtn", "saveSettingsBtn",
    "closeVoiceBtn", "runVoiceBtn", "settingsModal", "voiceModal",
    "addPanelBtn", "addPanelModal", "closeAddPanelBtn", "panelSelectionGrid", "dynamicPanelsContainer",
    "sentimentScore", "positiveCount", "neutralCount", "negativeCount",
    "keywordCloud", "riskRadar", "istClock", "marketStatus", "lastUpdated",
    "questionInput", "askAiBtn", "translateBtn", "voiceBtn", "aiOutput",
    "defaultLanguageSelect", "voiceLanguageSelect",
    "sarvamApiKeyInput", "chatUrlInput", "chatModelInput",
    "translateUrlInput", "ttsUrlInput", "ttsModelInput", "speakerInput"
  ];
  ids.forEach(id => { refs[id] = document.getElementById(id); });
}

function hydrateStateFromStorage() {
  const savedSettings = safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), {});
  state.settings = { ...DEFAULT_SETTINGS, ...savedSettings };

  const savedPanels = safeJsonParse(localStorage.getItem(STORAGE_KEYS.panels), null);
  if (Array.isArray(savedPanels) && savedPanels.length) {
    state.panels = savedPanels;
  }
}

function bindEvents() {
  refs.refreshBtn.addEventListener("click", () => refreshAllData(true));
  refs.autoRefreshSelect.addEventListener("change", onAutoRefreshChange);
  
  // Settings Modal
  refs.settingsBtn.addEventListener("click", () => toggleModal("settingsModal", true));
  refs.closeSettingsBtn.addEventListener("click", () => toggleModal("settingsModal", false));
  refs.saveSettingsBtn.addEventListener("click", onSaveSettings);
  
  // Add Panel Modal
  refs.addPanelBtn.addEventListener("click", () => openAddPanelModal("all"));
  refs.closeAddPanelBtn.addEventListener("click", () => toggleModal("addPanelModal", false));
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      openAddPanelModal(e.target.dataset.filter);
    });
  });

  // AI & Voice
  refs.askAiBtn.addEventListener("click", askAi);
  refs.translateBtn.addEventListener("click", translateAiOutput);
  refs.voiceBtn.addEventListener("click", () => toggleModal("voiceModal", true));
  refs.closeVoiceBtn.addEventListener("click", () => toggleModal("voiceModal", false));
  refs.runVoiceBtn.addEventListener("click", runVoiceFlow);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal("settingsModal", false);
      toggleModal("voiceModal", false);
      toggleModal("addPanelModal", false);
    }
  });
}

function renderLanguageSelects() {
  const optionHtml = SUPPORTED_LANGUAGES.map(
    (lang) => `<option value="${lang.code}">${escapeHtml(lang.label)} (${lang.code})</option>`
  ).join("");
  refs.defaultLanguageSelect.innerHTML = optionHtml;
  refs.voiceLanguageSelect.innerHTML = optionHtml;
  refs.defaultLanguageSelect.value = "en-IN";
  refs.voiceLanguageSelect.value = "te-IN";
}

function renderSettingsForm() {
  refs.sarvamApiKeyInput.value = state.settings.sarvamApiKey;
  refs.chatUrlInput.value = state.settings.chatUrl;
  refs.chatModelInput.value = state.settings.chatModel;
  refs.translateUrlInput.value = state.settings.translateUrl;
  refs.ttsUrlInput.value = state.settings.ttsUrl;
  refs.ttsModelInput.value = state.settings.ttsModel;
  refs.speakerInput.value = state.settings.speaker;
  refs.autoRefreshSelect.value = String(state.settings.autoRefreshMinutes);
}

// ================= Add Panel Flow =================
function openAddPanelModal(filterCategory) {
  toggleModal("addPanelModal", true);
  let html = "";
  
  const feeds = RSS_FEEDS.filter(f => {
    if (filterCategory === "india") return f.region === "India";
    if (filterCategory === "global") return f.region === "Global";
    if (filterCategory === "stream") return false;
    return true;
  });

  const streams = VIDEO_STREAMS.filter(s => {
    if (filterCategory === "india") return s.region === "India";
    if (filterCategory === "global") return s.region === "Global";
    if (filterCategory === "stream") return true;
    return true;
  });

  feeds.forEach(f => {
    html += `
      <div class="feed-source-item" style="flex-direction: column;">
        <strong>${escapeHtml(f.name)}</strong>
        <span class="meta">${f.region} • ${f.category}</span>
        <button class="btn btn-primary" onclick="window.addPanel('rss', '${f.id}')" style="margin-top: 5px; width: 100%; padding: 0.4rem;">Add RSS Panel</button>
      </div>
    `;
  });

  streams.forEach(s => {
    html += `
      <div class="feed-source-item" style="flex-direction: column;">
        <strong>${escapeHtml(s.name)}</strong>
        <span class="meta">${s.region} • Video Stream</span>
        <button class="btn btn-primary" onclick="window.addPanel('stream', '${s.id}')" style="margin-top: 5px; width: 100%; padding: 0.4rem; background: #dc2626;">Add Video Panel</button>
      </div>
    `;
  });

  refs.panelSelectionGrid.innerHTML = html;
}

window.addPanel = (type, id) => {
  state.panels.push({ type, id, instanceId: Date.now().toString() });
  persistPanels();
  toggleModal("addPanelModal", false);
  renderDynamicPanels();
  refreshAllData(false);
};

window.removePanel = (instanceId) => {
  state.panels = state.panels.filter(p => (p.instanceId || p.id) !== instanceId);
  persistPanels();
  renderDynamicPanels();
  refreshAllData(false); // To remove data from sentiment/AI Context if an RSS feed was removed
};

function renderDynamicPanels() {
  refs.dynamicPanelsContainer.innerHTML = state.panels.map(p => {
    const instanceId = p.instanceId || p.id;
    if (p.type === "stream") {
      const stream = VIDEO_STREAMS.find(s => s.id === p.id);
      if(!stream) return "";
      const url = buildStreamEmbedUrl(stream);
      return `
        <section class="panel" style="grid-column: span 6;">
          <div class="panel-head" style="display:flex; justify-content:space-between;">
            <h2>${escapeHtml(stream.name)}</h2>
            <button class="btn btn-ghost" onclick="window.removePanel('${instanceId}')" style="padding: 0.2rem 0.5rem;">X</button>
          </div>
          <iframe class="stream-frame" src="${escapeAttr(url)}" title="${escapeAttr(stream.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </section>
      `;
    } else if (p.type === "rss") {
      const feed = RSS_FEEDS.find(f => f.id === p.id);
      if(!feed) return "";
      return `
        <section class="panel" style="grid-column: span 4; display: flex; flex-direction: column; max-height: 480px;">
          <div class="panel-head" style="display:flex; justify-content:space-between;">
            <div>
              <h3 style="font-size: 1.1rem; margin:0;">${escapeHtml(feed.name)}</h3>
              <p class="muted" style="margin: 0; font-size: 0.75rem;">${feed.region} 📈</p>
            </div>
            <button class="btn btn-ghost" onclick="window.removePanel('${instanceId}')" style="padding: 0.2rem 0.5rem;">X</button>
          </div>
          <div id="rss-container-${instanceId}" class="timeline-list" style="margin-top: 0.5rem; flex-grow: 1; overflow-y: auto;">
             <!-- Loading State -->
             <p class="muted">Loading Feed...</p>
          </div>
        </section>
      `;
    }
  }).join("");
}
// =================================================

function onAutoRefreshChange() {
  const minutes = Number(refs.autoRefreshSelect.value) || 5;
  state.settings.autoRefreshMinutes = minutes;
  persistSettings();
  applyAutoRefresh();
}

function applyAutoRefresh() {
  if (state.refreshHandle) {
    clearInterval(state.refreshHandle);
  }
  const minutes = Number(state.settings.autoRefreshMinutes) || 5;
  state.refreshHandle = setInterval(() => {
    refreshAllData(false);
  }, minutes * 60 * 1000);
}

async function refreshAllData(showStatus = true) {
  if (state.isRefreshing) return;
  state.isRefreshing = true;
  if (showStatus) setAiOutput("Refreshing feeds and market dashboard...");

  const rssPanels = state.panels.filter(p => p.type === "rss");
  const merged = [];

  const results = await Promise.all(
    rssPanels.map(async (panel) => {
      const feed = RSS_FEEDS.find(f => f.id === panel.id);
      if(!feed) return null;
      try {
        const items = await fetchFeed(feed);
        return { panel, feed, items, status: "ok" };
      } catch (error) {
        return { panel, feed, items: [], status: "error" };
      }
    })
  );

  results.forEach(res => {
    if(!res) return;
    const instanceId = res.panel.instanceId || res.panel.id;
    const container = document.getElementById(`rss-container-${instanceId}`);
    
    if (res.status === "ok") {
      // Render small timeline in the panel
      if(container) {
        container.innerHTML = res.items.slice(0, 15).map(item => {
          const sentimentClass = `sentiment-${item.sentiment.label}`;
          return `
          <div class="timeline-item">
            <a href="${escapeAttr(item.link)}" target="_blank" style="font-size: 0.85rem;">${escapeHtml(item.title)}</a>
            <div class="timeline-meta" style="font-size: 0.65rem;">
              <span>${formatTimeAgo(item.publishedAt)}</span>
              <span class="sentiment-chip ${sentimentClass}" style="font-size: 0.6rem;">${item.sentiment.label}</span>
            </div>
          </div>`;
        }).join("");
      }
      merged.push(...res.items);
    } else {
      if(container) container.innerHTML = `<p class="muted">Failed to load feed.</p>`;
    }
  });

  state.feedItems = dedupeByLink(merged).sort((a, b) => b.publishedAt - a.publishedAt);

  renderSentiment();
  renderKeywords();
  renderRiskRadar();
  refs.lastUpdated.textContent = formatDateTime(new Date());

  if (showStatus) {
    setAiOutput("Feed refresh complete. You can now ask the AI with the latest context.");
  }
  state.isRefreshing = false;
}

async function fetchFeed(feed) {
  // Exclusively use rss2json.com to bypass local CORS restrictions completely.
  const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
  const json = await fetchJson(rss2jsonUrl);
  if (!json || !Array.isArray(json.items)) {
    throw new Error(`Unable to parse feed: ${feed.name}`);
  }
  return json.items.slice(0, 35).map((item) => normalizeItem(item, feed));
}

function parseRssXml(xmlText, feed) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  const nodes = [...doc.querySelectorAll("item, entry")].slice(0, 35);
  return nodes.map((node) => {
    const title = getNodeText(node, "title");
    const link = getNodeText(node, "link") || node.querySelector("link")?.getAttribute("href") || feed.url;
    const summary = getNodeText(node, "description") || getNodeText(node, "content") || getNodeText(node, "summary") || "";
    const published = getNodeText(node, "pubDate") || getNodeText(node, "updated") || getNodeText(node, "published");
    return normalizeItem({ title, link, description: summary, pubDate: published }, feed);
  });
}

function getNodeText(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() || "";
}

function normalizeItem(raw, feed) {
  const title = stripHtml(raw.title || "Untitled");
  const summary = stripHtml(raw.description || raw.content || "");
  const publishedAt = safeDate(raw.pubDate || raw.published || raw.isoDate);
  const sentiment = scoreSentiment(`${title} ${summary}`);
  return {
    id: `${feed.id}-${hashCode(`${title}-${raw.link}`)}`,
    source: feed.name,
    title,
    summary,
    link: raw.link || feed.url,
    publishedAt,
    sentiment,
  };
}

function renderSentiment() {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  let scoreTotal = 0;
  state.feedItems.forEach((item) => {
    counts[item.sentiment.label] += 1;
    scoreTotal += item.sentiment.score;
  });

  const index = state.feedItems.length ? Math.round((scoreTotal / state.feedItems.length) * 100) : 0;
  refs.sentimentScore.textContent = String(index);
  refs.positiveCount.textContent = String(counts.positive);
  refs.neutralCount.textContent = String(counts.neutral);
  refs.negativeCount.textContent = String(counts.negative);
}

function renderKeywords() {
  const freq = new Map();
  const text = state.feedItems.slice(0, 100).map((item) => item.title.toLowerCase());
  for (const title of text) {
    const tokens = title.split(/[^a-z0-9]+/g).filter(Boolean);
    tokens.forEach((token) => {
      if (token.length < 4 || STOP_WORDS.has(token)) return;
      freq.set(token, (freq.get(token) || 0) + 1);
    });
  }
  const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 32);
  refs.keywordCloud.innerHTML = top.map(([word, count]) => `<span class="keyword-pill">${escapeHtml(word)} (${count})</span>`).join("");
}

function renderRiskRadar() {
  const text = state.feedItems.slice(0, 140).map((item) => `${item.title} ${item.summary}`.toLowerCase()).join(" || ");
  refs.riskRadar.innerHTML = RISK_BUCKETS.map((bucket) => {
    const count = bucket.keys.reduce((acc, keyword) => acc + countMatches(text, keyword), 0);
    return `<div class="risk-row"><span>${escapeHtml(bucket.label)}</span><span class="count">${count}</span></div>`;
  }).join("");
}

// ================= AI Logic =================

async function askAi() {
  const question = refs.questionInput.value.trim();
  if (!question) return setAiOutput("Enter a question first.");
  if (!state.feedItems.length) return setAiOutput("Feed context is empty. Add RSS panels and refresh.");
  setAiOutput("Thinking with latest feed context...");
  const context = buildAiContext();
  try {
    const answer = await requestChat(question, context);
    const checked = enforceLegalCompliance(answer);
    state.lastAiResponse = checked;
    state.lastTranslatedResponse = "";
    setAiOutput(checked);
  } catch (error) {
    setAiOutput(`AI request failed: ${error.message}`);
  }
}

async function requestChat(question, context) {
  const systemPrompt = [
    "You are a financial market explainer for Indian and Global retail users.",
    "Rules:",
    "1) Never provide direct buy/sell/hold, entry, exit, target, stop-loss, or trade execution instructions.",
    "2) Provide only analysis, explanation, context, sentiment, and scenario possibilities based strictly on actual RSS provided context.",
    "3) Use cautious language and include uncertainty.",
    "4) Mention this is not investment advice.",
  ].join("\n");

  const headers = buildSarvamHeaders();
  const payload = {
    model: state.settings.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Latest market feed context:\n${context}\n\nUser question:\n${question}` },
    ],
    temperature: 0.2,
    max_tokens: 700,
  };
  const json = await fetchJson(state.settings.chatUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  const text = json?.choices?.[0]?.message?.content || json?.answer || json?.response || "";
  if (!text) throw new Error("No answer text in API response");
  return text;
}

async function translateAiOutput() {
  const text = state.lastAiResponse || refs.aiOutput.textContent.trim();
  if (!text) return setAiOutput("Ask AI first before translation.");
  const lang = refs.defaultLanguageSelect.value || "en-IN";
  if (lang === "en-IN") {
    state.lastTranslatedResponse = text;
    return setAiOutput(text);
  }
  setAiOutput(`Translating to ${lang}...`);
  try {
    const headers = buildSarvamHeaders();
    const payload = { input: text, source_language_code: "en-IN", target_language_code: lang, mode: "formal" };
    const json = await fetchJson(state.settings.translateUrl, { method: "POST", headers, body: JSON.stringify(payload) });
    const translated = json?.translated_text || json?.translation || "";
    if (!translated) throw new Error("No translated text returned");
    state.lastTranslatedResponse = translated;
    setAiOutput(translated);
  } catch (error) {
    setAiOutput(`Translation failed: ${error.message}`);
  }
}

async function runVoiceFlow() {
  toggleModal("voiceModal", false);
  const targetLanguage = refs.voiceLanguageSelect.value || "en-IN";
  const baseText = state.lastAiResponse || refs.aiOutput.textContent.trim();
  if (!baseText) return setAiOutput("Ask AI first before voice output.");

  setAiOutput(`Preparing ${targetLanguage} voice output...`);
  let finalText = baseText;
  if (targetLanguage !== "en-IN") {
    try {
      const hdrs = buildSarvamHeaders();
      const p = { input: baseText, source_language_code: "en-IN", target_language_code: targetLanguage, mode: "formal" };
      const j = await fetchJson(state.settings.translateUrl, { method: "POST", headers: hdrs, body: JSON.stringify(p) });
      finalText = j?.translated_text || baseText;
    } catch (err) {}
  }

  try {
    const payload = { text: finalText, target_language_code: targetLanguage, model: state.settings.ttsModel, speaker: state.settings.speaker };
    const json = await fetchJson(state.settings.ttsUrl, { method: "POST", headers: buildSarvamHeaders(), body: JSON.stringify(payload) });
    const audioBase64 = json?.audios?.[0] || json?.audio || json?.data?.audio || "";
    if (!audioBase64) throw new Error("No audio stream received");
    const audio = base64ToAudio(audioBase64);
    await audio.play();
    setAiOutput(finalText);
  } catch (error) {
    setAiOutput(`TTS API failed (${error.message}). Falling back to browser voice.`);
    browserSpeak(finalText, targetLanguage);
  }
}

function browserSpeak(text, lang) {
  if (!("speechSynthesis" in window)) throw new Error("Browser speech synthesis unavailable");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function buildSarvamHeaders() {
  const key = state.settings.sarvamApiKey;
  if (!key) throw new Error("Sarvam API key missing. Open API Settings and add key.");
  return { "Content-Type": "application/json", "api-subscription-key": key };
}

function buildAiContext() {
  return state.feedItems.slice(0, 70).map((item, idx) => `${idx + 1}. [${item.source}] ${item.title} | ${formatDateTime(item.publishedAt)} | sentiment:${item.sentiment.label}`).join("\n");
}

function enforceLegalCompliance(answer) {
  const text = (answer || "").trim();
  if (!text) return "No response generated.";
  const blockedPatterns = [/\b(?:buy now|sell now|strong buy|strong sell|go long|go short)\b/i, /\b(?:target price|stop ?loss|entry price|exit price)\b/i, /\b(?:i recommend|you should buy|you should sell)\b/i];
  if (blockedPatterns.some((pattern) => pattern.test(text))) {
    return "Compliance filter blocked direct trading instructions in generated output. Not investment advice.";
  }
  return !/not investment advice/i.test(text) ? `${text}\n\nNot investment advice.` : text;
}

// ================= Widgets & Utils =================

function setupTradingViewWidgets() {
  mountTradingViewWidget("tvTickerTape", "embed-widget-ticker-tape.js", {
    symbols: [{ proName: "NSE:NIFTY", title: "NIFTY 50" }, { proName: "BSE:SENSEX", title: "SENSEX" }, { proName: "FX_IDC:USDINR", title: "USD/INR" }, { proName: "MCX:GOLD1!", title: "MCX GOLD" }, { proName: "FOREXCOM:SPXUSD", title: "S&P 500" }],
    showSymbolLogo: true, colorTheme: "dark", isTransparent: true, displayMode: "adaptive", locale: "en",
  });
  mountTradingViewWidget("tvOverview", "embed-widget-market-overview.js", {
    colorTheme: "dark", locale: "en", showChart: true, width: "100%", height: 320,
    tabs: [
      { title: "India", symbols: [{ s: "NSE:NIFTY", d: "NIFTY 50" }, { s: "BSE:SENSEX", d: "SENSEX" }, { s: "NSE:RELIANCE", d: "Reliance" }] },
      { title: "Global", symbols: [{ s: "FOREXCOM:SPXUSD", d: "S&P 500" }, { s: "FOREXCOM:NSXUSD", d: "NASDAQ 100" }, { s: "TVC:GOLD", d: "Gold Spot" }] },
    ],
  });
  mountTradingViewWidget("tvHeatmap", "embed-widget-stock-heatmap.js", {
    dataSource: "NSE", blockSize: "market_cap_basic", blockColor: "change", grouping: "sector", locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: true, isDataSetEnabled: true, isZoomEnabled: true, hasSymbolTooltip: true, width: "100%", height: 360,
  });
}

function mountTradingViewWidget(hostId, scriptName, config) {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "tradingview-widget-container";
  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container__widget";
  container.appendChild(widget);
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `https://s3.tradingview.com/external-embedding/${scriptName}`;
  script.text = JSON.stringify(config);
  container.appendChild(script);
  host.appendChild(container);
}

function buildStreamEmbedUrl(stream) {
  const origin = encodeURIComponent(window.location.origin);
  if (stream.type === "video") return `https://www.youtube.com/embed/${encodeURIComponent(stream.value)}?autoplay=0&mute=1&rel=0&origin=${origin}`;
  return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(stream.value)}&autoplay=0&mute=1&rel=0&origin=${origin}`;
}

function onSaveSettings() {
  state.settings = {
    ...state.settings,
    sarvamApiKey: refs.sarvamApiKeyInput.value.trim(),
    chatUrl: refs.chatUrlInput.value.trim() || DEFAULT_SETTINGS.chatUrl,
    chatModel: refs.chatModelInput.value.trim() || DEFAULT_SETTINGS.chatModel,
    translateUrl: refs.translateUrlInput.value.trim() || DEFAULT_SETTINGS.translateUrl,
    ttsUrl: refs.ttsUrlInput.value.trim() || DEFAULT_SETTINGS.ttsUrl,
    ttsModel: refs.ttsModelInput.value.trim() || DEFAULT_SETTINGS.ttsModel,
    speaker: refs.speakerInput.value.trim() || DEFAULT_SETTINGS.speaker,
  };
  persistSettings();
  toggleModal("settingsModal", false);
  setAiOutput("Settings saved.");
}

function toggleModal(id, show) {
  const element = refs[id];
  if (element) element.classList.toggle("hidden", !show);
}

function tickClock() {
  const now = new Date();
  refs.istClock.textContent = formatISTTime(now);
  refs.marketStatus.textContent = getMarketStatus(now);
}

function getMarketStatus(date) {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = istDate.getDay();
  if (day === 0 || day === 6) return "Closed (Weekend)";
  const minutes = istDate.getHours() * 60 + istDate.getMinutes();
  if (minutes >= 540 && minutes < 555) return "Pre-Open";
  if (minutes >= 555 && minutes <= 930) return "Open";
  return "Closed";
}

function scoreSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach((word) => { if (lower.includes(word)) score += 1; });
  NEGATIVE_WORDS.forEach((word) => { if (lower.includes(word)) score -= 1; });
  if (score > 0) return { label: "positive", score };
  if (score < 0) return { label: "negative", score };
  return { label: "neutral", score: 0 };
}

function dedupeByLink(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.link || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function persistSettings() { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings)); }
function persistPanels() { localStorage.setItem(STORAGE_KEYS.panels, JSON.stringify(state.panels)); }

async function fetchText(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function base64ToAudio(base64) {
  const cleaned = base64.includes(",") ? base64.split(",").pop() : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Audio(URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })));
}

function stripHtml(text) { return (text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function safeDate(value) {
  if (!value) return new Date(0);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}
function countMatches(text, keyword) {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}
function safeJsonParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function setAiOutput(text) { refs.aiOutput.textContent = text; }
function formatISTTime(date) { return date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
function formatDateTime(date) { return (!(date instanceof Date) || Number.isNaN(date.getTime())) ? "Unknown" : date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function formatTimeAgo(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Unknown time";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
