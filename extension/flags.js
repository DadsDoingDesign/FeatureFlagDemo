var KNOWN_FLAGS = [
  "dark-mode",
  "beta-banner",
  "advanced-analytics",
  "ai-assistant",
  "data-export",
  "notifications-v2",
  "premium-features",
  "collaboration-tools",
  "custom-reports",
  "bulk-actions",
  "audit-log",
  "api-v2",
  "new-navigation",
  "rich-text-editor",
  "multi-tenant",
];

if (typeof window !== "undefined") {
  window.__KNOWN_FLAGS = KNOWN_FLAGS;
}
