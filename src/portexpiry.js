// portexpiry.js — track ports that haven't been seen recently and flag them as stale

const { loadHistory } = require('./history');

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Returns a map of port -> lastSeenAt (ms timestamp) from history entries.
 */
function buildLastSeenMap(history) {
  const map = {};
  for (const entry of history) {
    const ts = new Date(entry.timestamp).getTime();
    if (!entry.ports) continue;
    for (const port of entry.ports) {
      const key = `${port.port}/${port.protocol}`;
      if (!map[key] || ts > map[key]) {
        map[key] = ts;
      }
    }
  }
  return map;
}

/**
 * Given a lastSeenMap and a TTL in ms, return entries that are considered stale.
 */
function getStaleEntries(lastSeenMap, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
  const stale = [];
  for (const [key, lastSeen] of Object.entries(lastSeenMap)) {
    const age = now - lastSeen;
    if (age > ttlMs) {
      const [port, protocol] = key.split('/');
      stale.push({
        port: Number(port),
        protocol,
        lastSeenAt: new Date(lastSeen).toISOString(),
        ageMs: age,
      });
    }
  }
  return stale.sort((a, b) => b.ageMs - a.ageMs);
}

/**
 * High-level: load history and return stale ports based on TTL.
 */
async function findStalePorts(ttlMs = DEFAULT_TTL_MS) {
  const history = await loadHistory();
  const lastSeenMap = buildLastSeenMap(history);
  return getStaleEntries(lastSeenMap, ttlMs);
}

/**
 * Format a stale entry for display.
 */
function formatStaleEntry(entry) {
  const hours = Math.floor(entry.ageMs / 1000 / 60 / 60);
  const mins = Math.floor((entry.ageMs / 1000 / 60) % 60);
  return `${entry.port}/${entry.protocol} — last seen ${entry.lastSeenAt} (${hours}h ${mins}m ago)`;
}

module.exports = {
  buildLastSeenMap,
  getStaleEntries,
  findStalePorts,
  formatStaleEntry,
  DEFAULT_TTL_MS,
};
