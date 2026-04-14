const { loadHistory } = require('./history');

const DEFAULT_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Build a map of port -> last seen timestamp from history entries.
 */
function buildLastSeenMap(history) {
  const map = {};
  for (const entry of history) {
    const ts = new Date(entry.timestamp).getTime();
    for (const port of (entry.ports || [])) {
      const key = `${port.port}/${port.proto || 'tcp'}`;
      if (!map[key] || ts > map[key].ts) {
        map[key] = { ts, port };
      }
    }
  }
  return map;
}

/**
 * Return entries not seen within the stale threshold.
 */
function getStaleEntries(history, thresholdMs = DEFAULT_STALE_THRESHOLD_MS) {
  const now = Date.now();
  const lastSeen = buildLastSeenMap(history);
  const stale = [];
  for (const [key, { ts, port }] of Object.entries(lastSeen)) {
    if (now - ts > thresholdMs) {
      stale.push({ key, lastSeenAt: new Date(ts).toISOString(), port });
    }
  }
  return stale.sort((a, b) => a.lastSeenAt.localeCompare(b.lastSeenAt));
}

/**
 * Format a single stale entry for display.
 */
function formatStaleEntry(entry) {
  const label = entry.port.process ? ` (${entry.port.process})` : '';
  return `  ${entry.key}${label} — last seen ${entry.lastSeenAt}`;
}

/**
 * Build a full stale report object.
 */
function buildStaleReport(history, thresholdMs = DEFAULT_STALE_THRESHOLD_MS) {
  const entries = getStaleEntries(history, thresholdMs);
  return {
    count: entries.length,
    thresholdMs,
    entries,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  buildLastSeenMap,
  getStaleEntries,
  formatStaleEntry,
  buildStaleReport
};
