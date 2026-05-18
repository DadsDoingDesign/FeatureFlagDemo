(function () {
  const EVT_TOGGLE = "flags:toggle-panel";
  const OVERRIDES_KEY = "flags-overrides";
  const POS_KEY = "flags-panel-pos";

  const PRESETS = {
    "Free Tier": {
      "advanced-analytics": false,
      "ai-assistant": false,
      "premium-features": false,
      "data-export": false,
      "collaboration-tools": false,
      "custom-reports": false,
      "bulk-actions": false,
      "audit-log": false,
      "api-v2": false,
      "rich-text-editor": false,
      "multi-tenant": false,
      "notifications-v2": false,
      "new-navigation": false,
      "dark-mode": false,
      "beta-banner": false,
    },
    "Pro Tier": {
      "advanced-analytics": true,
      "ai-assistant": true,
      "premium-features": true,
      "data-export": true,
      "collaboration-tools": true,
      "custom-reports": true,
      "bulk-actions": true,
      "notifications-v2": true,
      "dark-mode": false,
      "beta-banner": false,
    },
    "Admin": {
      "advanced-analytics": true,
      "ai-assistant": true,
      "premium-features": true,
      "data-export": true,
      "collaboration-tools": true,
      "custom-reports": true,
      "bulk-actions": true,
      "audit-log": true,
      "api-v2": true,
      "rich-text-editor": true,
      "multi-tenant": true,
      "notifications-v2": true,
      "new-navigation": true,
      "dark-mode": true,
      "beta-banner": true,
    },
  };

  // -------- Overrides storage --------
  function getOverrides() {
    try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}"); }
    catch { return {}; }
  }
  const hadOverridesOnLoad = Object.keys(getOverrides()).length > 0;

  function saveOverrides(overrides) {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    sendBadgeUpdate();
    window.dispatchEvent(new CustomEvent("flags:updated", { detail: { ...overrides } }));
  }

  function sendBadgeUpdate() {
    const n = Object.keys(getOverrides()).length;
    window.dispatchEvent(new CustomEvent("flags:badge-update", { detail: { count: n } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { renderAlert(); sendBadgeUpdate(); });
  } else {
    renderAlert();
    sendBadgeUpdate();
  }

  // -------- Console API --------
  const api = {
    list() {
      const overrides = getOverrides();
      const known = window.__KNOWN_FLAGS || [];
      console.table(known.map((key) => ({ key, override: overrides[key] })));
      return getOverrides();
    },
    set(key, value) {
      const o = getOverrides();
      o[key] = value;
      saveOverrides(o);
      rerenderPanel();
      console.info(`[flagToggler] set ${key}=${value}`);
      return { ...o };
    },
    clear(key) {
      const o = getOverrides();
      delete o[key];
      saveOverrides(o);
      rerenderPanel();
      return { ...o };
    },
    clearAll() {
      saveOverrides({});
      rerenderPanel();
      return {};
    },
    overrides: () => getOverrides(),
    known: () => [...(window.__KNOWN_FLAGS || [])],
  };

  Object.defineProperty(window, "flagToggler", {
    value: Object.freeze(api),
    writable: false,
    configurable: false,
  });

  function applyPreset(name) {
    const flags = PRESETS[name];
    if (!flags) return;
    saveOverrides({ ...flags });
    rerenderPanel();
  }

  // -------- Panel CSS (dark brand theme) --------
  const PANEL_CSS = `
    :host { all: initial; }
    .wrap {
      position: fixed; z-index: 2147483647; width: 380px;
      background: #18181b; color: #fff7ed;
      font: 13px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 1px solid #3f3f46;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3);
      overflow: hidden; user-select: none;
    }
    header {
      display: flex; align-items: stretch;
      background: #18181b; color: #fff7ed; cursor: move; height: 40px;
      border-bottom: 1px solid #3f3f46;
    }
    .header-title {
      flex: 1; display: flex; align-items: center;
      padding: 0 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
    }
    header button {
      width: 40px; flex-shrink: 0; background: transparent;
      border: 0; border-left: 1px solid #3f3f46;
      color: #a1a1aa; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    header button:hover { background: #27272a; color: #fff7ed; }
    .body { user-select: text; display: flex; flex-direction: column; }
    .preset-bar {
      display: flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 12px;
      border-bottom: 1px solid #3f3f46; background: #27272a; flex-shrink: 0;
    }
    .preset-label {
      font-size: 10px; color: #a1a1aa; flex-shrink: 0;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .preset-bar button {
      border: 1px solid #3f3f46; background: #18181b;
      height: 26px; padding: 0 10px; margin-left: -1px;
      font: 11px Inter, -apple-system, sans-serif;
      color: #a1a1aa; cursor: pointer; font-weight: 500;
    }
    .preset-bar button:first-of-type { margin-left: 0; }
    .preset-bar button.active {
      background: #27272a; border-color: #fb923c; color: #fb923c;
      font-weight: 600; position: relative; z-index: 1;
    }
    .preset-bar button:hover:not(.active) { background: #3f3f46; color: #fff7ed; }
    .desc-row {
      padding: 10px 12px; border-bottom: 1px solid #3f3f46;
      background: #27272a; flex-shrink: 0;
    }
    .desc-text { font-size: 11px; color: #a1a1aa; font-weight: 400; line-height: 1.5; }
    .filter-row {
      display: flex; align-items: center; justify-content: space-between;
      height: 40px; padding: 0 12px; border-bottom: 1px solid #3f3f46; flex-shrink: 0;
    }
    .filter-label-group { display: flex; align-items: center; gap: 8px; }
    .filter-row label {
      font-size: 12px; color: #a1a1aa; cursor: pointer; user-select: none; font-weight: 500;
    }
    .override-badge {
      display: inline-flex; align-items: center; padding: 2px 7px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
      background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3);
    }
    .override-badge.none { background: #27272a; color: #a1a1aa; border-color: #3f3f46; }
    .toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-track {
      position: absolute; inset: 0; background: #3f3f46;
      border-radius: 9999px; transition: background 0.18s; cursor: pointer;
    }
    .toggle-track::after {
      content: ""; position: absolute; width: 16px; height: 16px;
      background: #fff7ed; border-radius: 9999px; top: 2px; left: 2px;
      transition: transform 0.18s; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .toggle input:checked + .toggle-track { background: #fb923c; }
    .toggle input:checked + .toggle-track::after { transform: translateX(16px); }
    .search-wrap { position: relative; border-bottom: 1px solid #3f3f46; flex-shrink: 0; }
    .search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }
    .search-wrap input {
      width: 100%; height: 40px; padding: 0 12px 0 36px;
      font: 12px Inter, -apple-system, sans-serif;
      border: 0; outline: none;
      box-sizing: border-box; color: #fff7ed; background: #18181b;
    }
    .search-wrap input::placeholder { color: #a1a1aa; }
    .search-wrap input:focus { box-shadow: inset 0 -2px 0 #fb923c; }
    .list { overflow-y: auto; max-height: 260px; }
    .row {
      display: flex; align-items: stretch;
      height: 40px; border-bottom: 1px solid #3f3f46;
    }
    .row:last-child { border-bottom: 0; }
    .flag-name {
      flex: 1; min-width: 0;
      display: flex; align-items: center;
      padding: 0 12px; overflow: hidden;
    }
    .flag-name code {
      font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11px;
      color: #e4e4e7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .seg { display: flex; align-items: stretch; flex-shrink: 0; }
    .seg-btn {
      width: 44px;
      display: flex; align-items: center; justify-content: center;
      background: #27272a; color: #a1a1aa;
      border: 0; border-left: 1px solid #3f3f46;
      font: 11px Inter, -apple-system, sans-serif; font-weight: 500;
      cursor: pointer;
    }
    .seg-btn:hover:not(.on) { background: #3f3f46; color: #fff7ed; }
    .seg-btn.on { background: rgba(251,146,60,0.15); color: #fb923c; font-weight: 700; }
    .empty { color: #a1a1aa; font-size: 12px; padding: 20px 12px; text-align: center; }
    footer { display: flex; flex-direction: column; border-top: 1px solid #3f3f46; flex-shrink: 0; }
    .discard-btn {
      height: 40px; width: 100%;
      font: 12px Inter, -apple-system, sans-serif; font-weight: 600;
      cursor: pointer; border: 0; border-bottom: 1px solid rgba(239,68,68,0.2);
      display: flex; align-items: center; justify-content: center;
      background: rgba(239,68,68,0.08); color: #f87171;
    }
    .discard-btn:hover { background: rgba(239,68,68,0.15); }
    .confirm-btn {
      height: 40px; width: 100%;
      font: 12px Inter, -apple-system, sans-serif; font-weight: 600;
      cursor: pointer; border: 0;
      display: flex; align-items: center; justify-content: center;
      background: #fb923c; color: #18181b;
    }
    .confirm-btn:hover { background: #f97316; }
  `;

  let panelHost = null;
  let shadow = null;
  let searchQuery = "";
  let showOverriddenOnly = false;

  // -------- Page-level override alert --------
  let alertHost = null;
  let alertDismissed = false;

  const ALERT_CSS = `
    :host { all: initial; }
    .alert {
      position: fixed; z-index: 2147483646;
      top: 20px; right: 20px;
      display: flex; align-items: stretch;
      background: #18181b; color: #fff7ed;
      font: 13px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3);
      border: 1px solid #3f3f46;
      border-left: 3px solid #fb923c;
      animation: slideIn 0.18s ease;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .msg {
      flex: 1; min-width: 0;
      display: flex; align-items: center; gap: 8px;
      padding: 0 12px; height: 40px; cursor: move;
    }
    .msg strong { font-size: 12px; font-weight: 600; color: #fff7ed; white-space: nowrap; }
    .override-badge {
      display: inline-flex; align-items: center; padding: 2px 7px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
      background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3);
      white-space: nowrap; flex-shrink: 0;
    }
    .edit-btn {
      display: flex; align-items: center; padding: 0 12px;
      font: 12px Inter, -apple-system, sans-serif; font-weight: 500;
      background: #27272a; color: #a1a1aa;
      border: 0; border-left: 1px solid #3f3f46; cursor: pointer; white-space: nowrap;
    }
    .edit-btn:hover { background: #3f3f46; color: #fff7ed; }
    .clear-btn {
      display: flex; align-items: center; padding: 0 12px;
      font: 12px Inter, -apple-system, sans-serif; font-weight: 600;
      background: #fb923c; color: #18181b;
      border: 0; border-left: 1px solid rgba(0,0,0,0.08); cursor: pointer; white-space: nowrap;
    }
    .clear-btn:hover { background: #f97316; }
    .close-btn {
      display: flex; align-items: center; justify-content: center; width: 40px; flex-shrink: 0;
      background: transparent; border: 0; border-left: 1px solid #3f3f46;
      color: #a1a1aa; cursor: pointer; font-size: 14px;
    }
    .close-btn:hover { background: #27272a; color: #fff7ed; }
  `;

  function wireAlertDrag(el) {
    let dragging = false, sx, sy, ox, oy;
    el.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect();
      ox = r.left; oy = r.top;
      el.style.right = "auto";
      el.style.left = ox + "px";
      el.style.top  = oy + "px";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      el.style.left = (ox + e.clientX - sx) + "px";
      el.style.top  = (oy + e.clientY - sy) + "px";
    });
    window.addEventListener("mouseup", () => { dragging = false; });
  }

  function renderAlert() {
    const n = Object.keys(getOverrides()).length;
    if (n === 0 || alertDismissed) {
      if (alertHost) { alertHost.remove(); alertHost = null; }
      return;
    }
    if (!alertHost) {
      alertHost = document.createElement("div");
      const alertShadow = alertHost.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = ALERT_CSS;
      alertShadow.appendChild(style);
      const el = document.createElement("div");
      el.className = "alert";
      el.innerHTML = `
        <div class="msg">
          <strong>Feature flags overridden</strong>
          <span class="override-badge"></span>
        </div>
        <button class="edit-btn">Edit flags</button>
        <button class="clear-btn">Clear &amp; reload</button>
        <button class="close-btn" title="Dismiss">✕</button>
      `;
      el.querySelector(".edit-btn").addEventListener("click", () => { openPanel(); });
      el.querySelector(".clear-btn").addEventListener("click", () => { api.clearAll(); location.reload(); });
      el.querySelector(".close-btn").addEventListener("click", () => { alertDismissed = true; renderAlert(); });
      alertShadow.appendChild(el);
      document.documentElement.appendChild(alertHost);
      wireAlertDrag(el);
    }
    alertHost.shadowRoot.querySelector(".override-badge").textContent =
      `${n} override${n !== 1 ? "s" : ""}`;
  }

  function readPos() {
    try { return JSON.parse(localStorage.getItem(POS_KEY)) || null; } catch { return null; }
  }
  function writePos(pos) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
  }

  function openPanel() {
    if (panelHost) return;
    panelHost = document.createElement("div");
    shadow = panelHost.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = PANEL_CSS;
    shadow.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const pos = readPos();
    if (pos) {
      wrap.style.top  = Math.max(pos.top, 60) + "px";
      wrap.style.left = Math.max(pos.left, 0) + "px";
    } else { wrap.style.top = "120px"; wrap.style.right = "20px"; }

    wrap.innerHTML = `
      <header>
        <div class="header-title">Feature Flag Toggler</div>
        <button data-act="close">✕</button>
      </header>
      <div class="body">
        <div class="desc-row">
          <span class="desc-text">Override any flag locally to preview its state. Changes are saved to localStorage and dispatched to the demo page in real time.</span>
        </div>
        <div class="preset-bar">
          <span class="preset-label">Preset:</span>
          <button data-preset="Free Tier">Free Tier</button>
          <button data-preset="Pro Tier">Pro Tier</button>
          <button data-preset="Admin">Admin</button>
        </div>
        <div class="filter-row">
          <div class="filter-label-group">
            <label for="ft-filter-toggle">Show overridden only</label>
            <span class="override-badge none">0 overrides</span>
          </div>
          <label class="toggle">
            <input id="ft-filter-toggle" type="checkbox" />
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="search-wrap">
          <span class="search-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>
          <input type="text" placeholder="Filter flags…" />
        </div>
        <div class="list"></div>
        <footer>
          <button data-act="clear" class="discard-btn">Discard all changes</button>
          <button data-act="reload" class="confirm-btn">Confirm &amp; reload tab</button>
        </footer>
      </div>
    `;
    shadow.appendChild(wrap);
    document.documentElement.appendChild(panelHost);
    wireDrag(wrap);
    wireEvents(wrap);
    rerenderPanel();
  }

  function closePanel() {
    if (!panelHost) return;
    panelHost.remove(); panelHost = null; shadow = null;
  }

  window.addEventListener(EVT_TOGGLE, () => { if (panelHost) closePanel(); else openPanel(); });

  function wireDrag(wrap) {
    const header = wrap.querySelector("header");
    let dragging = false, sx, sy, ox, oy;
    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      const r = wrap.getBoundingClientRect();
      ox = r.left; oy = r.top;
      wrap.style.right = "auto"; wrap.style.left = ox + "px"; wrap.style.top = oy + "px";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      wrap.style.left = (ox + e.clientX - sx) + "px";
      wrap.style.top  = (oy + e.clientY - sy) + "px";
    });
    window.addEventListener("mouseup", () => {
      if (!dragging) return; dragging = false;
      writePos({ left: parseInt(wrap.style.left), top: parseInt(wrap.style.top) });
    });
  }

  function wireEvents(wrap) {
    wrap.querySelector(".search-wrap input").addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderList();
    });
    wrap.querySelector("#ft-filter-toggle").addEventListener("change", (e) => {
      showOverriddenOnly = e.target.checked;
      renderList();
    });
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "close") closePanel();
      else if (act === "clear") { api.clearAll(); if (hadOverridesOnLoad) location.reload(); }
      else if (act === "reload") location.reload();
    });
    wrap.querySelector(".list").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-flag]");
      if (!btn) return;
      const f = btn.dataset.flag, v = btn.dataset.val;
      const o = getOverrides();
      if (v === "unset") delete o[f]; else o[f] = v === "true";
      saveOverrides(o);
      rerenderPanel();
    });
    wrap.querySelector(".preset-bar").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-preset]");
      if (!btn) return;
      applyPreset(btn.dataset.preset);
    });
  }

  function renderList() {
    if (!shadow) return;
    const overrides = getOverrides();
    const known = window.__KNOWN_FLAGS || [];
    let list = known.filter((f) => f.toLowerCase().includes(searchQuery));
    if (showOverriddenOnly) list = list.filter((f) => f in overrides);
    const toggleCb = shadow.querySelector("#ft-filter-toggle");
    if (toggleCb) toggleCb.checked = showOverriddenOnly;
    const el = shadow.querySelector(".list");
    el.innerHTML = !list.length
      ? '<div class="empty">No matching flags.</div>'
      : list.map((flag) => {
          const v = overrides[flag];
          const state = !(flag in overrides) ? "unset" : v === true ? "true" : "false";
          const btn = (val, label) =>
            `<button class="seg-btn${state === val ? " on" : ""}" data-flag="${flag}" data-val="${val}">${label}</button>`;
          return `<div class="row">
            <div class="flag-name"><code title="${flag}">${flag}</code></div>
            <div class="seg">${btn("unset", "—")}${btn("true", "ON")}${btn("false", "OFF")}</div>
          </div>`;
        }).join("");
  }

  function renderBanner() {
    if (!shadow) return;
    const n = Object.keys(getOverrides()).length;
    const badge = shadow.querySelector(".override-badge");
    if (badge) {
      if (n === 0) {
        badge.textContent = "0 overrides";
        badge.className = "override-badge none";
      } else {
        badge.textContent = `${n} override${n !== 1 ? "s" : ""}`;
        badge.className = "override-badge";
      }
    }
    const footer = shadow.querySelector("footer");
    if (footer) footer.style.display = n > 0 ? "" : "none";
  }

  function renderPresets() {
    if (!shadow) return;
    const overrides = getOverrides();
    const oKeys = Object.keys(overrides);
    let activePreset = null;
    for (const [name, flags] of Object.entries(PRESETS)) {
      const fKeys = Object.keys(flags);
      if (fKeys.length === oKeys.length && fKeys.every((k) => overrides[k] === flags[k])) {
        activePreset = name; break;
      }
    }
    shadow.querySelectorAll(".preset-bar button[data-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === activePreset);
    });
  }

  function hideAlertIfEmpty() {
    if (Object.keys(getOverrides()).length === 0 && alertHost) {
      alertHost.remove();
      alertHost = null;
    }
  }

  function rerenderPanel() { renderPresets(); renderList(); renderBanner(); hideAlertIfEmpty(); }

  console.info(
    "%c[flagToggler]%c ready — click the extension icon to open the panel",
    "font-weight:bold;color:#fb923c", "color:inherit"
  );
})();
