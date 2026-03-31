import { refs, state, cacheRefs, hydrateStateFromStorage, persistSettings } from "./state.js";
import { RSS_FEEDS } from "./feeds.js";
import { mountTradingViewWidget } from "./widgets.js";
import { fetchFeedWithFallback } from "./fetcher.js";
import { dedupeByLink, normalizeItem, parseRssXml } from "./parser.js";
import { askAi, closeAiDrawer, onSaveSettings, openAiDrawer, renderChatHistory, renderLanguageSelects, renderSettingsForm, runVoiceFlow, setAiOutput } from "./ai.js";
import { openAddPanelModal, refreshInsightPanelInstances, renderDynamicPanels, sanitizePanels, setupPanelSearch, toggleModal } from "./panels.js";
import { tickClock } from "./clock.js";
import { escapeAttr, escapeHtml, formatDateTime, formatTimeAgo } from "./utils.js";

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheRefs();
  hydrateStateFromStorage();
  sanitizePanels();
  bindEvents();
  renderLanguageSelects();
  renderSettingsForm();
  renderChatHistory();
  setupPanelSearch();
  setupTickerTape();
  setupCryptoTape();
  renderDynamicPanels();
  refreshInsightPanelInstances();
  tickClock();
  setInterval(tickClock, 1000);
  applyAutoRefresh();
  refreshAllData(true);
}

function bindEvents() {
  refs.refreshBtn?.addEventListener("click", () => refreshAllData(true));
  refs.autoRefreshSelect?.addEventListener("change", onAutoRefreshChange);

  refs.settingsBtn?.addEventListener("click", () => toggleModal("settingsModal", true));
  refs.closeSettingsBtn?.addEventListener("click", () => toggleModal("settingsModal", false));
  refs.saveSettingsBtn?.addEventListener("click", onSaveSettings);

  refs.addPanelBtn?.addEventListener("click", () => openAddPanelModal("all"));
  refs.closeAddPanelBtn?.addEventListener("click", () => toggleModal("addPanelModal", false));
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      event.currentTarget.classList.add("active");
      openAddPanelModal(event.currentTarget.dataset.filter || "all");
    });
  });

  refs.openAiDrawerBtn?.addEventListener("click", openAiDrawer);
  refs.closeAiDrawerBtn?.addEventListener("click", closeAiDrawer);
  refs.aiOverlay?.addEventListener("click", closeAiDrawer);

  refs.askAiBtn?.addEventListener("click", askAi);

  refs.voiceBtn?.addEventListener("click", runVoiceFlow);
  refs.chatQuestionInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askAi();
    }
  });

  refs.defaultLanguageSelect?.addEventListener("change", (event) => {
    if (refs.voiceLanguageSelect) refs.voiceLanguageSelect.value = event.target.value;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    toggleModal("settingsModal", false);
    toggleModal("addPanelModal", false);
    closeAiDrawer();
  });

  window.addEventListener("panel-added", () => refreshAllData(false));
  window.addEventListener("market-panel-added", async () => {
    refreshInsightPanelInstances();
  });
  window.addEventListener("panel-removed", () => {
    refreshInsightPanelInstances();
  });
}

function onAutoRefreshChange() {
  const minutes = Number(refs.autoRefreshSelect?.value) || 5;
  state.settings.autoRefreshMinutes = minutes;
  persistSettings();
  applyAutoRefresh();
}

function applyAutoRefresh() {
  if (state.refreshHandle) clearInterval(state.refreshHandle);
  const minutes = Number(state.settings.autoRefreshMinutes) || 5;
  state.refreshHandle = setInterval(() => refreshAllData(false), minutes * 60 * 1000);
}

async function refreshAllData(showStatus = true) {
  if (state.isRefreshing) return;
  state.isRefreshing = true;
  if (showStatus) setAiOutput("Refreshing feeds and market panels...");

  const rssPanels = state.panels.filter((panel) => panel.type === "rss");
  const merged = [];
  const results = await Promise.all(
    rssPanels.map(async (panel) => {
      const feed = RSS_FEEDS.find((item) => item.id === panel.id);
      if (!feed) return null;
      try {
        const result = await fetchFeedWithFallback(feed.url);
        const items =
          result.method === "rss2json"
            ? result.items.map((raw) => normalizeItem(raw, feed))
            : parseRssXml(result.items, feed);
        return { panel, feed, items, status: "ok" };
      } catch (error) {
        return { panel, feed, items: [], status: "error", error: error.message };
      }
    })
  );

  results.forEach((result) => {
    if (!result) return;
    const instanceId = result.panel.instanceId || result.panel.id;
    const container = document.getElementById(`rss-container-${instanceId}`);
    const health = (state.feedHealth[result.feed.id] ||= { success: 0, failed: 0 });

    if (result.status === "ok" && result.items.length) {
      health.success += 1;
      container && (container.innerHTML = renderFeedItems(result.items));
      merged.push(...result.items);
      return;
    }

    health.failed += 1;
    if (!container) return;
    container.innerHTML = `<div class="feed-error">
      <span>Failed to load feed.</span>
      <button class="btn btn-sm btn-ghost" data-retry-instance="${escapeAttr(instanceId)}">Retry</button>
    </div>`;
  });

  refs.dynamicPanelsContainer?.querySelectorAll("button[data-retry-instance]").forEach((button) => {
    button.addEventListener("click", () => refreshAllData(false));
  });

  state.feedItems = dedupeByLink(merged).sort((a, b) => b.publishedAt - a.publishedAt);
  refreshInsightPanelInstances();

  if (refs.lastUpdated) refs.lastUpdated.textContent = formatDateTime(new Date());
  if (refs.feedHealthBadge) {
    const okCount = results.filter((result) => result?.status === "ok" && result.items.length).length;
    const failedCount = results.filter((result) => result?.status === "error").length;
    refs.feedHealthBadge.textContent = `${okCount} ok / ${failedCount} failed`;
  }

  if (showStatus) {
    setAiOutput("Refresh complete. Ask AI for a contextual market explanation.");
  }
  state.isRefreshing = false;
}

function renderFeedItems(items) {
  return items
    .slice(0, 14)
    .map((item) => {
      const sentimentClass = `sentiment-${item.sentiment.label}`;
      return `<article class="timeline-item">
        <a href="${escapeAttr(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>
        <div class="timeline-meta">
          <span>${formatTimeAgo(item.publishedAt)}</span>
          <span class="sentiment-chip ${sentimentClass}">${escapeHtml(item.sentiment.label)}</span>
        </div>
      </article>`;
    })
    .join("");
}

function setupTickerTape() {
  mountTradingViewWidget("tvTickerTape", "embed-widget-ticker-tape.js", {
    symbols: [
      { proName: "NSE:NIFTY", title: "Nifty 50" },
      { proName: "BSE:SENSEX", title: "Sensex" },
      { proName: "NSE:BANKNIFTY", title: "Bank Nifty" },
      { proName: "NSE:RELIANCE", title: "Reliance" },
      { proName: "NSE:INFY", title: "Infosys" },
      { proName: "NSE:TCS", title: "TCS" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
      { proName: "MCX:GOLD1!", title: "MCX Gold" },
      { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
      { proName: "OANDA:NAS100USD", title: "Nasdaq 100" },
      { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
    ],
    showSymbolLogo: true,
    colorTheme: "light",
    isTransparent: true,
    displayMode: "adaptive",
    locale: "en",
  });
}

function setupCryptoTape() {
  mountTradingViewWidget("tvCryptoTape", "embed-widget-ticker-tape.js", {
    symbols: [
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "OANDA:XAGUSD", title: "Silver" },
      { proName: "TVC:UKOIL", title: "Brent Oil" },
      { proName: "COINBASE:BTCUSD", title: "Bitcoin" },
      { proName: "COINBASE:ETHUSD", title: "Ethereum" },
      { proName: "BINANCE:SOLUSDT", title: "Solana" },
      { proName: "BINANCE:XRPUSDT", title: "XRP" },
      { proName: "TVC:DXY", title: "US Dollar Index" },
      { proName: "FX:EURUSD", title: "EUR/USD" },
      { proName: "FX:GBPUSD", title: "GBP/USD" },
    ],
    showSymbolLogo: true,
    colorTheme: "light",
    isTransparent: true,
    displayMode: "adaptive",
    locale: "en",
  });
}
