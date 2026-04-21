// portwatch-uptime.js
// Tracks uptime windows for ports across history snapshots

const DAY_MS = 86400000;

/**
 * Build a map of port -> list of timestamps it was seen
 * @param {Array} history - array of { timestamp, ports: [] }
 */
function buildSeenMap(history) {
  const map = {};
  for (const entry of history) {
    const ts = new Date(entry.timestamp).getTime();
    for (const port of entry.ports || []) {
      const key = `${port.port}/${port.protocol}`;
      if (!map[key]) map[key] = [];
      map[key].push(ts);
    }
  }
  return map;
}

/**
 * Calculate uptime ratio for a port over a given window (ms)
 */
function calcUptimeRatio(timestamps, windowMs, now = Date.now()) {
  if (!timestamps || timestamps.length === 0) return 0;
  const cutoff = now - windowMs;
  const inWindow = timestamps.filter(t => t >= cutoff);
  if (inWindow.length === 0) return 0;
  const span = now - cutoff;
  const bucketSize = windowMs / 24; // hourly buckets
  const buckets = new Set(inWindow.map(t => Math.floor((t - cutoff) / bucketSize)));
  return Math.min(1, buckets.size / 24);
}

/**
 * Build full uptime report from history
 */
function buildUptimeReport(history, windowDays = 7, now = Date.now()) {
  const windowMs = windowDays * DAY_MS;
  const seenMap = buildSeenMap(history);
  const report = [];
  for (const [key, timestamps] of Object.entries(seenMap)) {
    const [port, protocol] = key.split('/');
    const ratio = calcUptimeRatio(timestamps, windowMs, now);
    const firstSeen = Math.min(...timestamps);
    const lastSeen = Math.max(...timestamps);
    report.push({
      port: Number(port),
      protocol,
      uptimeRatio: parseFloat(ratio.toFixed(3)),
      uptimePercent: Math.round(ratio * 100),
      firstSeen: new Date(firstSeen).toISOString(),
      lastSeen: new Date(lastSeen).toISOString(),
      occurrences: timestamps.length
    });
  }
  return report.sort((a, b) => b.uptimeRatio - a.uptimeRatio);
}

/**
 * Format uptime report for CLI output
 */
function formatUptimeReport(report) {
  if (!report.length) return 'No uptime data available.';
  const lines = ['Port Uptime Report', '=================='];
  for (const entry of report) {
    const bar = '█'.repeat(Math.round(entry.uptimePercent / 10)).padEnd(10, '░');
    lines.push(
      `  :${entry.port}/${entry.protocol} ${bar} ${entry.uptimePercent}% (${entry.occurrences} snapshots)`
    );
  }
  return lines.join('\n');
}

module.exports = {
  buildSeenMap,
  calcUptimeRatio,
  buildUptimeReport,
  formatUptimeReport
};
