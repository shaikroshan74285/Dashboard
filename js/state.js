import { safeJsonParse } from "./utils.js";

export const STORAGE_KEYS = {
  settings: "marketpulse_settings_v6",
  panels: "marketpulse_panels_v6",
  panelSizes: "marketpulse_panel_sizes_v6",
  chat: "marketpulse_ai_chat_v6",
};

export const DEFAULT_SETTINGS = {
  sarvamApiKey: "",
  chatUrl: "https://api.sarvam.ai/v1/chat/completions",
  translateUrl: "https://api.sarvam.ai/translate",
  ttsUrl: "https://api.sarvam.ai/text-to-speech",
  chatModel: "sarvam-m",
  ttsModel: "bulbul:v2",
  speaker: "anushka",
  autoRefreshMinutes: 5,
  rssProxyUrl: "",
  brokerApiUrl: "",
};

export const DEFAULT_PANELS = [
  { type: "widget", id: "tv-india-quotes" },
  { type: "widget", id: "tv-global-quotes" },
  { type: "widget", id: "tv-crypto" },
  { type: "widget", id: "tv-forex" },
  { type: "widget", id: "tv-technical" },
  { type: "widget", id: "tv-hotlists" },
  { type: "widget", id: "tv-gdp" },
  { type: "widget", id: "tv-calendar" },
  { type: "widget", id: "tv-heatmap" },
  { type: "stream", id: "bloomberg" },
  { type: "stream", id: "al-jazeera" },
  { type: "stream", id: "dw-news" },
  { type: "rss", id: "et-markets" },
  { type: "rss", id: "livemint-markets" },
  { type: "rss", id: "reuters-markets" },
  { type: "rss", id: "cointelegraph" },
  { type: "rss", id: "openai-news" },
  { type: "insight", id: "market-mood-meter" },
  { type: "insight", id: "risk-thermometer" },
  { type: "insight", id: "beginner-brief" }
];

export const SUPPORTED_LANGUAGES = [
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

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  panels: [...DEFAULT_PANELS],
  panelSizes: {},
  feedItems: [],
  feedHealth: {},
  marketSnapshots: {},
  refreshHandle: null,
  isRefreshing: false,
  lastAiResponse: "",
  lastTranslatedResponse: "",
  lastResponseLanguage: "en-IN",
  aiChatHistory: [],
  activeFilter: "all",
  activeCategoryFilter: "all",
};

export const refs = {};

export function cacheRefs() {
  const ids = [
    "refreshBtn",
    "autoRefreshSelect",
    "settingsBtn",
    "closeSettingsBtn",
    "saveSettingsBtn",
    "settingsModal",
    "addPanelBtn",
    "addPanelModal",
    "closeAddPanelBtn",
    "panelSelectionGrid",
    "panelCategorySelect",
    "panelSearchInput",
    "dynamicPanelsContainer",
    "sentimentScore",
    "positiveCount",
    "neutralCount",
    "negativeCount",
    "keywordCloud",
    "riskRadar",
    "trendTimeline",
    "beginnerBrief",
    "istClock",
    "marketStatus",
    "feedHealthBadge",
    "lastUpdated",
    "openAiDrawerBtn",
    "closeAiDrawerBtn",
    "aiDrawer",
    "aiOverlay",
    "aiChatThread",
    "chatQuestionInput",
    "askAiBtn",
    "translateBtn",
    "voiceBtn",
    "aiStatusText",
    "defaultLanguageSelect",
    "voiceLanguageSelect",
    "sarvamApiKeyInput",
    "chatUrlInput",
    "chatModelInput",
    "translateUrlInput",
    "ttsUrlInput",
    "ttsModelInput",
    "speakerInput",
    "rssProxyUrlInput",
    "brokerApiUrlInput",
  ];
  ids.forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

function normalizePanels(rawPanels) {
  if (!Array.isArray(rawPanels) || !rawPanels.length) return [...DEFAULT_PANELS];
  return rawPanels.map((panel, idx) => ({
    type: panel.type,
    id: panel.id,
    instanceId: panel.instanceId || `${panel.id}-${idx}`,
  }));
}

export function hydrateStateFromStorage() {
  const savedSettings = safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), {});
  state.settings = { ...DEFAULT_SETTINGS, ...savedSettings };

  const savedPanels = safeJsonParse(localStorage.getItem(STORAGE_KEYS.panels), null);
  state.panels = normalizePanels(savedPanels || DEFAULT_PANELS);

  const savedSizes = safeJsonParse(localStorage.getItem(STORAGE_KEYS.panelSizes), {});
  state.panelSizes = savedSizes || {};

  const savedChat = safeJsonParse(localStorage.getItem(STORAGE_KEYS.chat), []);
  state.aiChatHistory = Array.isArray(savedChat) ? savedChat.slice(-30) : [];

  if (refs.autoRefreshSelect) {
    refs.autoRefreshSelect.value = String(state.settings.autoRefreshMinutes || 5);
  }
}

export function persistSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

export function persistPanels() {
  localStorage.setItem(STORAGE_KEYS.panels, JSON.stringify(state.panels));
}

export function persistPanelSizes() {
  localStorage.setItem(STORAGE_KEYS.panelSizes, JSON.stringify(state.panelSizes));
}

export function persistChatHistory() {
  localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(state.aiChatHistory.slice(-30)));
}
