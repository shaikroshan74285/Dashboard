import { DEFAULT_PANELS, state, refs, persistPanels, persistPanelSizes } from "./state.js";
import { FEED_CATEGORIES, RSS_FEEDS } from "./feeds.js";
import { VIDEO_STREAMS, buildStreamEmbedUrl, buildStreamWatchUrl } from "./streams.js";
import { WIDGETS, mountTradingViewWidget } from "./widgets.js";
import { INSIGHT_PANELS, buildInsightContext, renderInsightPanel } from "./insights.js";
import { debounce, escapeAttr, escapeHtml, formatTimeAgo } from "./utils.js";

let boundPanelActions = false;
let resizeObserver = null;
let draggedInstanceId = null;

const DEFAULT_SPANS = {
  rss: "span-3",
  stream: "span-3",
  widget: "span-3",
  market: "span-3",
  insight: "span-3",
};

const SPAN_ORDER = ["span-3", "span-4", "span-6", "span-8", "span-12"];

export function sanitizePanels() {
  const valid = new Set([
    ...RSS_FEEDS.map((feed) => `rss:${feed.id}`),
    ...VIDEO_STREAMS.map((stream) => `stream:${stream.id}`),
    ...WIDGETS.map((widget) => `widget:${widget.id}`),
    ...INSIGHT_PANELS.map((panel) => `insight:${panel.id}`),
  ]);

  const filtered = state.panels.filter((panel) => valid.has(`${panel.type}:${panel.id}`));
  if (!filtered.length) {
    state.panels = DEFAULT_PANELS.map((panel, idx) => ({ ...panel, instanceId: panel.instanceId || `${panel.id}-${idx}` }));
    persistPanels();
    return;
  }
  if (filtered.length !== state.panels.length) {
    state.panels = filtered;
    persistPanels();
  }
}

export function openAddPanelModal(filter = "all") {
  state.activeFilter = filter;
  state.activeCategoryFilter = refs.panelCategorySelect?.value || "all";
  toggleModal("addPanelModal", true);
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderCategoryOptions();
  renderPanelSelectionGrid(filter, refs.panelSearchInput?.value || "", state.activeCategoryFilter);
}

function renderCategoryOptions() {
  if (!refs.panelCategorySelect) return;
  const html = [`<option value="all">All Categories</option>`]
    .concat(FEED_CATEGORIES.map((category) => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`))
    .join("");
  refs.panelCategorySelect.innerHTML = html;
  refs.panelCategorySelect.value = state.activeCategoryFilter || "all";
}

function panelCard({ name, meta, type, id, color }) {
  const alreadyAdded = state.panels.some((panel) => panel.type === type && panel.id === id);
  return `<div class="feed-source-item">
    <div class="feed-source-info">
      <strong>${escapeHtml(name)}</strong>
      <span class="meta">${escapeHtml(meta)}</span>
    </div>
    <button
      class="btn btn-sm ${alreadyAdded ? "btn-ghost disabled" : ""}"
      style="${alreadyAdded ? "" : `background:${color};color:#fff;`}"
      data-add-panel="true"
      data-type="${escapeAttr(type)}"
      data-id="${escapeAttr(id)}"
      ${alreadyAdded ? "disabled" : ""}
    >
      ${alreadyAdded ? "Added" : "+ Add"}
    </button>
  </div>`;
}

export function renderPanelSelectionGrid(filterCategory, searchQuery, categoryFilter = "all") {
  const grid = refs.panelSelectionGrid;
  if (!grid) return;
  const q = (searchQuery || "").toLowerCase();
  const groups = [];

  if (["stream", "all", "india", "global"].includes(filterCategory)) {
    const streams = VIDEO_STREAMS.filter((stream) => {
      if (filterCategory === "india" && stream.region !== "India") return false;
      if (filterCategory === "global" && stream.region !== "Global") return false;
      if (!q) return true;
      return stream.name.toLowerCase().includes(q);
    });
    if (streams.length) {
      groups.push({
        title: "Live Streams",
        items: streams.map((stream) =>
          panelCard({
            name: stream.name,
            meta: `${stream.region} stream`,
            type: "stream",
            id: stream.id,
            color: "#b91c1c",
          })
        ),
      });
    }
  }

  if (["widget", "all", "india", "global"].includes(filterCategory)) {
    const widgets = WIDGETS.filter((widget) => {
      if (!q) return true;
      return `${widget.name} ${widget.category}`.toLowerCase().includes(q);
    });
    if (widgets.length) {
      groups.push({
        title: "TradingView Widgets",
        items: widgets.map((widget) =>
          panelCard({
            name: widget.name,
            meta: `${widget.category} widget`,
            type: "widget",
            id: widget.id,
            color: "#0f172a",
          })
        ),
      });
    }
  }



  if (["insight", "all", "india", "global"].includes(filterCategory)) {
    const insightPanels = INSIGHT_PANELS.filter((panel) => {
      if (filterCategory === "india" && panel.region !== "India") return false;
      if (filterCategory === "global" && panel.region !== "Global") return false;
      if (!q) return true;
      return `${panel.name} ${panel.category} ${panel.description} ${panel.region}`.toLowerCase().includes(q);
    });
    if (insightPanels.length) {
      groups.push({
        title: "Insight Data Panels",
        items: insightPanels.map((panel) =>
          panelCard({
            name: panel.name,
            meta: `${panel.region} - ${panel.category}`,
            type: "insight",
            id: panel.id,
            color: "#0f766e",
          })
        ),
      });
    }
  }

  if (!["stream", "widget", "market", "insight"].includes(filterCategory)) {
    FEED_CATEGORIES.forEach((category) => {
      if (categoryFilter !== "all" && categoryFilter !== category) return;
      const feeds = RSS_FEEDS.filter((feed) => {
        if (feed.category !== category) return false;
        if (filterCategory === "india" && feed.region !== "India") return false;
        if (filterCategory === "global" && feed.region !== "Global") return false;
        if (!q) return true;
        return `${feed.name} ${feed.category} ${feed.region}`.toLowerCase().includes(q);
      });
      if (!feeds.length) return;
      groups.push({
        title: `${category} (${feeds.length})`,
        items: feeds.map((feed) =>
          panelCard({
            name: feed.name,
            meta: `${feed.region} - ${feed.category}`,
            type: "rss",
            id: feed.id,
            color: "#2563eb",
          })
        ),
      });
    });
  }

  if (!groups.length) {
    grid.innerHTML = `<p class="muted" style="padding:1rem;">No panels match this filter.</p>`;
    return;
  }

  grid.innerHTML = groups
    .map(
      (group) => `<div class="category-group">
        <h4 class="category-title">${escapeHtml(group.title)}</h4>
        <div class="category-items">${group.items.join("")}</div>
      </div>`
    )
    .join("");
}

function spanClass(panel) {
  const saved = state.panelSizes[panel.instanceId || panel.id]?.span;
  if (saved) return saved;
  if (panel.id === "tv-heatmap" || panel.id === "tv-gdp") return "span-12";
  return DEFAULT_SPANS[panel.type] || "span-3";
}

function panelShell(instanceId, title, subtitle, type, spanClassName, content) {
  return `<section id="panel-${instanceId}" class="panel ${spanClassName} ${type === "widget" ? "widget-panel" : ""}" data-instance="${instanceId}" data-type="${type}">
    <div class="panel-head" draggable="true">
      <div class="panel-title-group">
        <h3>${escapeHtml(title)}</h3>
        <p class="muted">${escapeHtml(subtitle)}</p>
      </div>
      <div class="panel-controls">
        <button class="panel-btn" data-action="collapse" data-instance="${escapeAttr(instanceId)}" title="Collapse">_</button>
        <button class="panel-btn panel-btn-close" data-action="remove" data-instance="${escapeAttr(instanceId)}" title="Remove">x</button>
      </div>
    </div>
    <div class="panel-body">${content}</div>
  </section>`;
}

export function renderDynamicPanels() {
  if (!refs.dynamicPanelsContainer) return;
  const insightContext = buildInsightContext();
  refs.dynamicPanelsContainer.innerHTML = state.panels
    .map((panel) => {
      const instanceId = panel.instanceId || panel.id;
      const className = spanClass(panel);

      if (panel.type === "rss") {
        const feed = RSS_FEEDS.find((item) => item.id === panel.id);
        if (!feed) return "";
        const cached = state.feedItems.filter((item) => item.source === feed.name).slice(0, 14);
        const content = cached.length
          ? cached
              .map((item) => {
                const sentimentClass = `sentiment-${item.sentiment.label}`;
                return `<article class="timeline-item">
                  <a href="${escapeAttr(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>
                  <div class="timeline-meta">
                    <span>${escapeHtml(formatTimeAgo(item.publishedAt))}</span>
                    <span class="sentiment-chip ${sentimentClass}">${escapeHtml(item.sentiment.label)}</span>
                  </div>
                </article>`;
              })
              .join("")
          : `<div class="feed-loading"><div class="spinner"></div><span>Loading feed...</span></div>`;
        return panelShell(
          instanceId,
          feed.name,
          `${feed.category} - ${feed.region}`,
          panel.type,
          className,
          `<div id="rss-container-${instanceId}" class="timeline-list">${content}</div>`
        );
      }

      if (panel.type === "stream") {
        const stream = VIDEO_STREAMS.find((item) => item.id === panel.id);
        if (!stream) return "";
        
        let content = "";
        if (stream.type === "m3u8") {
          requestAnimationFrame(() => {
            const video = document.getElementById(`video-${instanceId}`);
            if (!video) return;
            if (window.Hls && Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(stream.value);
              hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = stream.value;
            }
          });
          content = `<video id="video-${instanceId}" class="stream-frame" autoplay muted playsinline controls></video>
          <a class="stream-fallback-link" href="${escapeAttr(stream.value)}" target="_blank" rel="noopener">Open raw stream link</a>`;
        } else {
          content = `<iframe class="stream-frame" src="${escapeAttr(buildStreamEmbedUrl(stream))}" title="${escapeAttr(stream.name)}" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="no-referrer" allowfullscreen loading="lazy"></iframe>
          <a class="stream-fallback-link" target="_blank" rel="noopener" href="${escapeAttr(buildStreamWatchUrl(stream))}">If stream is blocked, open on YouTube</a>`;
        }

        return panelShell(
          instanceId,
          stream.name,
          `${stream.region} live video`,
          panel.type,
          className,
          content
        );
      }

      if (panel.type === "widget") {
        const widget = WIDGETS.find((item) => item.id === panel.id);
        if (!widget) return "";
        return panelShell(
          instanceId,
          widget.name,
          `${widget.category} widget`,
          panel.type,
          className,
          `<div id="widget-container-${instanceId}" class="tv-widget-host compact"></div>`
        );
      }



      if (panel.type === "insight") {
        const insight = INSIGHT_PANELS.find((item) => item.id === panel.id);
        if (!insight) return "";
        return panelShell(
          instanceId,
          insight.name,
          `${insight.category} - ${insight.region}`,
          panel.type,
          className,
          `<div id="insight-container-${instanceId}" class="insight-panel-body">${renderInsightPanel(insight.id, insightContext)}</div>`
        );
      }

      return "";
    })
    .join("");

  state.panels.forEach((panel) => {
    if (panel.type !== "widget") return;
    const widget = WIDGETS.find((item) => item.id === panel.id);
    if (!widget) return;
    const hostId = `widget-container-${panel.instanceId || panel.id}`;
    setTimeout(() => mountTradingViewWidget(hostId, widget.script, widget.config), 30);
  });

  restorePanelSizes();
  observePanelResizes();
  bindPanelActions();
  bindPanelDragAndDrop();
}

export function refreshInsightPanelInstances() {
  const insightContext = buildInsightContext();
  state.panels
    .filter((panel) => panel.type === "insight")
    .forEach((panel) => {
      const instanceId = panel.instanceId || panel.id;
      const host = document.getElementById(`insight-container-${instanceId}`);
      if (!host) return;
      host.innerHTML = renderInsightPanel(panel.id, insightContext);
    });
}

function restorePanelSizes() {
  Object.entries(state.panelSizes).forEach(([instanceId, size]) => {
    const el = document.getElementById(`panel-${instanceId}`);
    if (!el) return;
    if (size?.w) el.style.width = size.w;
    if (size?.h) el.style.height = size.h;
  });
}

function updatePanelSpan(instanceId, direction) {
  const panel = state.panels.find((item) => (item.instanceId || item.id) === instanceId);
  if (!panel) return;
  const current = spanClass(panel);
  const idx = SPAN_ORDER.indexOf(current);
  if (idx < 0) return;
  const nextIdx = direction === "widen" ? Math.min(SPAN_ORDER.length - 1, idx + 1) : Math.max(0, idx - 1);
  const next = SPAN_ORDER[nextIdx];
  state.panelSizes[instanceId] = { ...(state.panelSizes[instanceId] || {}), span: next };
  persistPanelSizes();
  renderDynamicPanels();
}

function bindPanelActions() {
  if (!refs.dynamicPanelsContainer || boundPanelActions) return;
  refs.dynamicPanelsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const instanceId = button.dataset.instance;
    const action = button.dataset.action;
    if (!instanceId || !action) return;

    if (action === "remove") {
      state.panels = state.panels.filter((panel) => (panel.instanceId || panel.id) !== instanceId);
      delete state.panelSizes[instanceId];
      persistPanels();
      persistPanelSizes();
      renderDynamicPanels();
      window.dispatchEvent(new CustomEvent("panel-removed"));
      return;
    }

    if (action === "collapse") {
      const el = document.getElementById(`panel-${instanceId}`);
      if (el) el.classList.toggle("panel-collapsed");
      return;
    }


  });
  boundPanelActions = true;
}

function bindPanelDragAndDrop() {
  const heads = document.querySelectorAll(".panel-head[draggable='true']");
  const panels = document.querySelectorAll(".panel[data-instance]");

  heads.forEach((head) => {
    head.addEventListener("dragstart", (event) => {
      const panel = head.closest(".panel[data-instance]");
      const instanceId = panel?.dataset.instance;
      if (!instanceId) return;
      draggedInstanceId = instanceId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", instanceId);
      panel.classList.add("panel-dragging");
    });
    head.addEventListener("dragend", () => {
      document.querySelectorAll(".panel-drop-target").forEach((el) => el.classList.remove("panel-drop-target"));
      document.querySelectorAll(".panel-dragging").forEach((el) => el.classList.remove("panel-dragging"));
      draggedInstanceId = null;
    });
  });

  panels.forEach((panel) => {
    panel.addEventListener("dragover", (event) => {
      if (!draggedInstanceId) return;
      event.preventDefault();
      panel.classList.add("panel-drop-target");
    });
    panel.addEventListener("dragleave", () => {
      panel.classList.remove("panel-drop-target");
    });
    panel.addEventListener("drop", (event) => {
      event.preventDefault();
      panel.classList.remove("panel-drop-target");
      const targetId = panel.dataset.instance;
      if (!draggedInstanceId || !targetId || draggedInstanceId === targetId) return;
      reorderPanels(draggedInstanceId, targetId);
    });
  });
}

function reorderPanels(fromId, toId) {
  const from = state.panels.findIndex((panel) => (panel.instanceId || panel.id) === fromId);
  const to = state.panels.findIndex((panel) => (panel.instanceId || panel.id) === toId);
  if (from < 0 || to < 0) return;
  const [moved] = state.panels.splice(from, 1);
  state.panels.splice(to, 0, moved);
  persistPanels();
  renderDynamicPanels();
}

const saveSizes = debounce(() => persistPanelSizes(), 400);

function observePanelResizes() {
  if (typeof ResizeObserver === "undefined") return;
  if (resizeObserver) resizeObserver.disconnect();

  resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const instanceId = entry.target.dataset.instance;
      if (!instanceId) return;
      state.panelSizes[instanceId] = {
        ...(state.panelSizes[instanceId] || {}),
        w: entry.target.style.width || null,
        h: entry.target.style.height || null,
      };
    });
    saveSizes();
  });

  document.querySelectorAll(".panel[data-instance]").forEach((panel) => resizeObserver.observe(panel));
}

export function toggleModal(id, show) {
  const modal = refs[id];
  if (!modal) return;
  modal.classList.toggle("hidden", !show);
}

export function setupPanelSearch() {
  if (refs.panelSelectionGrid) {
    refs.panelSelectionGrid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-add-panel='true']");
      if (!button) return;
      const type = button.dataset.type;
      const id = button.dataset.id;
      if (!type || !id) return;
      if (state.panels.some((panel) => panel.type === type && panel.id === id)) return;
      state.panels.push({ type, id, instanceId: `${id}-${Date.now()}` });
      persistPanels();
      renderDynamicPanels();
      renderPanelSelectionGrid(state.activeFilter, refs.panelSearchInput?.value || "", state.activeCategoryFilter);
      if (type === "rss") window.dispatchEvent(new CustomEvent("panel-added"));
      if (type === "market") window.dispatchEvent(new CustomEvent("market-panel-added"));
    });
  }

  refs.panelSearchInput?.addEventListener(
    "input",
    debounce((event) => {
      renderPanelSelectionGrid(state.activeFilter, event.target.value, state.activeCategoryFilter);
    }, 200)
  );

  refs.panelCategorySelect?.addEventListener("change", (event) => {
    state.activeCategoryFilter = event.target.value || "all";
    renderPanelSelectionGrid(state.activeFilter, refs.panelSearchInput?.value || "", state.activeCategoryFilter);
  });
}
