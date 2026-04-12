// portmetrics.js — collect and aggregate port usage metrics over time

const { loadHistory } = require('./history');

/**
 * Count how many times each port appeared across history entries.
 */
function buildOccurrenceMap(history) {
  const map = {};
  for (const entry of history) {
    for (const port of entry.ports || []) {
      const key = `${port.port}/${port.protocol}`;
      map[key] = (map[key] || 0) + 1;
    }
  }
  return map;
};

/**
 * Calculate uptime ratio for each port (appearances / total snapshots).
 */
function calcUptimeRatios(history) {
  const total = history.length;
  if (total === 0) return {};
  const occurrences = buildOccurrenceMap(history);
  const ratios = {};
  for (const [key, count] of Object.entries(occurrences)) {
    ratios[key] = parseFloat((count / total).toFixed(4));
  }
  return ratios;
}

/**
 * Find ports that appeared only once (transient/noisy).
 */
function findTransientPorts(history) {
  const occurrences = buildOccurrenceMap(history);
  return Object.entries(occurrences)
    .filter(([, count]) => count === 1)
    .map(([key]) => key);
}

/**
 * Build a full metrics report from history.
 */
function buildMetricsReport(history) {
  const total = history.length;
  const occurrences = buildOccurrenceMap(history);
  const uptimeRatios = calcUptimeRatios(history);
  const transient = findTransientPorts(history);
  const uniquePorts = Object.keys(occurrences).length;

  return {
    totalSnapshots: total,
    uniquePorts,
    occurrences,
    uptimeRatios,
    transientPorts: transient,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildOccurrenceMap,
  calcUptimeRatios,
  findTransientPorts,
  buildMetricsReport,
};
