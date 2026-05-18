chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "flags:toggle-panel" });
  } catch (e) {
    // Content script not injected on this page (e.g. chrome:// urls).
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "flags:badge" && sender.tab?.id) {
    const tabId = sender.tab.id;
    const text = msg.count > 0 ? String(msg.count) : "";
    chrome.action.setBadgeText({ text, tabId });
    if (msg.count > 0) {
      chrome.action.setBadgeBackgroundColor({ color: "#fb923c", tabId });
    }
  }
});
