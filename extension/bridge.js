// Runs in ISOLATED world. Forwards action-icon clicks to the page and badge
// count updates from the page to the background service worker.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "flags:toggle-panel") {
    window.dispatchEvent(new CustomEvent("flags:toggle-panel"));
  }
});

window.addEventListener("flags:badge-update", function onBadgeUpdate(e) {
  try {
    chrome.runtime.sendMessage(
      { type: "flags:badge", count: e.detail.count },
      () => { try { void chrome.runtime.lastError; } catch {} }
    );
  } catch {
    window.removeEventListener("flags:badge-update", onBadgeUpdate);
  }
});
