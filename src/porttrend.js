// porttrend.js — analyze port usage trends over history entries

const { loadHistory } = require('./history');

/**
 * Count how many times each port appeared across history entries
 * @param {Array} entries - array of history entries
 * @returns {Object} map of port => count
 */
function buildFrequencyMap(entries) {
  const freq = {};
  for (const entry of entries) {
    const ports = entry.ports || [];
    for (const p of ports) {
      const key = String(p.port);
      freq[key] = (freq[key] || 0) + 1;
    }
  }
  return freq;
}

/**
 * Return ports sorted by frequency descending
 * @param {Object} freqMap
 * @param {number} limit
 * @returns {Array<{port, count}>}
 */
function topPorts(freqMap, limit = 10) {
  return Object.entries(freqMap)
    .map(([port, count]) => ({ port: Number(port), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Detect ports that appeared only once (transient/flapping)
 * @param {Object} freqMap
 * @returns {number[]}
 */
function transientPorts(freqMap) {
  return Object.entries(freqMap)
    .filter(([, count]) => count === 1)
    .map(([port]) => Number(port));
}

/**
 * Build a full trend report from history
 * @param {number} limit - top N ports to include
 * @returns {Object}
 */
async function buildTrendReport(limit = 10) {
  const history = await loadHistory();
  if (!history || history.length === 0) {
    return { totalSnapshots: 0, topPorts: [], transientPorts: [], freqMap: {} };
  }
  const freqMap = buildFrequencyMap(history);
  return {
    totalSnapshots: history.length,
    topPorts: topPorts(freqMap, limit),
    transientPorts: transientPorts(freqMap),
    freqMap
  };
}

module.exports = { buildFrequencyMap, topPorts, transientPorts, buildTrendReport };
