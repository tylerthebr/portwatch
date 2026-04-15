// portwatch-correlation.js
// Detects correlated port activity — ports that tend to appear/disappear together

'use strict';

/**
 * Build a co-occurrence map from history entries.
 * Each history entry is expected to have a `ports` array of port numbers.
 * @param {Array} history - array of { timestamp, ports[] }
 * @returns {Object} map of "portA:portB" => count
 */
function buildCoOccurrenceMap(history) {
  const map = {};
  for (const entry of history) {
    const ports = (entry.ports || []).slice().sort((a, b) => a - b);
    for (let i = 0; i < ports.length; i++) {
      for (let j = i + 1; j < ports.length; j++) {
        const key = `${ports[i]}:${ports[j]}`;
        map[key] = (map[key] || 0) + 1;
      }
    }
  }
  return map;
}

/**
 * Find port pairs that co-occur at least `minCount` times.
 * @param {Object} coMap
 * @param {number} minCount
 * @returns {Array} [{ portA, portB, count }]
 */
function findCorrelatedPairs(coMap, minCount = 2) {
  return Object.entries(coMap)
    .filter(([, count]) => count >= minCount)
    .map(([key, count]) => {
      const [portA, portB] = key.split(':').map(Number);
      return { portA, portB, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Build a full correlation report.
 * @param {Array} history
 * @param {Object} opts - { minCount }
 * @returns {Object} { pairs, totalSnapshots }
 */
function buildCorrelationReport(history, opts = {}) {
  const minCount = opts.minCount || 2;
  const coMap = buildCoOccurrenceMap(history);
  const pairs = findCorrelatedPairs(coMap, minCount);
  return { pairs, totalSnapshots: history.length };
}

/**
 * Format a correlation report for CLI output.
 * @param {Object} report
 * @returns {string}
 */
function formatCorrelationReport(report) {
  const { pairs, totalSnapshots } = report;
  if (!pairs.length) {
    return `No correlated port pairs found (across ${totalSnapshots} snapshots).`;
  }
  const lines = [
    `Correlated port pairs (${totalSnapshots} snapshots scanned):`,
    ...pairs.map(p => `  ${p.portA} <-> ${p.portB}  (co-occurrences: ${p.count})`)
  ];
  return lines.join('\n');
}

module.exports = {
  buildCoOccurrenceMap,
  findCorrelatedPairs,
  buildCorrelationReport,
  formatCorrelationReport
};
