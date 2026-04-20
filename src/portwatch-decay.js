/**
 * portwatch-decay.js
 * Tracks how long ports have been absent and assigns a decay score.
 * Higher decay = port has been missing longer and is likely gone for good.
 */

const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Build a last-seen map from history entries.
 * @param {Array} history - Array of { timestamp, ports } snapshots
 * @returns {Object} Map of port -> last seen timestamp (ms)
 */
function buildLastSeenMap(history) {
  const map = {};
  for (const entry of history) {
    const ts = new Date(entry.timestamp).getTime();
    for (const port of entry.ports || []) {
      const key = `${port.port}/${port.protocol}`;
      if (!map[key] || ts > map[key]) {
        map[key] = ts;
      }
    }
  }
  return map;
}

/**
 * Calculate a decay score for a port based on how long it's been absent.
 * Score is 0.0 (just seen) to 1.0 (fully decayed after maxAgeHours).
 * @param {number} lastSeenMs - Timestamp when port was last seen
 * @param {number} nowMs - Current timestamp
 * @param {number} maxAgeHours - Hours after which decay reaches 1.0
 * @returns {number} Decay score between 0 and 1
 */
function calcDecayScore(lastSeenMs, nowMs, maxAgeHours = 24) {
  const ageHours = (nowMs - lastSeenMs) / MS_PER_HOUR;
  return Math.min(1, ageHours / maxAgeHours);
}

/**
 * Build a full decay report from history.
 * @param {Array} history
 * @param {Object} options
 * @returns {Array} Sorted decay entries
 */
function buildDecayReport(history, { maxAgeHours = 24, now = Date.now() } = {}) {
  const lastSeen = buildLastSeenMap(history);
  return Object.entries(lastSeen)
    .map(([key, ts]) => {
      const [port, protocol] = key.split('/');
      const score = calcDecayScore(ts, now, maxAgeHours);
      const ageHours = (now - ts) / MS_PER_HOUR;
      return { port: Number(port), protocol, lastSeen: new Date(ts).toISOString(), ageHours: Math.round(ageHours * 10) / 10, decayScore: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.decayScore - a.decayScore);
}

/**
 * Format decay report as a human-readable string.
 * @param {Array} report
 * @returns {string}
 */
function formatDecayReport(report) {
  if (!report.length) return 'No decay data available.';
  const lines = ['Port Decay Report', '================='];
  for (const entry of report) {
    const bar = '█'.repeat(Math.round(entry.decayScore * 10)).padEnd(10, '░');
    lines.push(`  ${String(entry.port).padStart(5)}/${entry.protocol.padEnd(3)}  [${bar}]  score=${entry.decayScore.toFixed(2)}  age=${entry.ageHours}h  last=${entry.lastSeen}`);
  }
  return lines.join('\n');
}

module.exports = { buildLastSeenMap, calcDecayScore, buildDecayReport, formatDecayReport };
