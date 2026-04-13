// portwatch-groupby.js — group port entries by various dimensions

/**
 * Group entries by a given field key.
 * @param {Array} entries
 * @param {string} field - e.g. 'process', 'protocol', 'state'
 * @returns {Object} map of field value -> entries[]
 */
function groupByField(entries, field) {
  const map = {};
  for (const entry of entries) {
    const key = entry[field] ?? 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(entry);
  }
  return map;
}

/**
 * Group entries by port range buckets.
 * @param {Array} entries
 * @param {number} bucketSize - default 1000
 * @returns {Object} map of range label -> entries[]
 */
function groupByPortRange(entries, bucketSize = 1000) {
  const map = {};
  for (const entry of entries) {
    const port = Number(entry.port);
    const start = Math.floor(port / bucketSize) * bucketSize;
    const label = `${start}-${start + bucketSize - 1}`;
    if (!map[label]) map[label] = [];
    map[label].push(entry);
  }
  return map;
}

/**
 * Group entries by environment annotation if present.
 * @param {Array} entries
 * @returns {Object}
 */
function groupByEnv(entries) {
  return groupByField(entries, 'env');
}

/**
 * Summarize a grouped map into counts.
 * @param {Object} grouped
 * @returns {Object} map of key -> count
 */
function summarizeGroupBy(grouped) {
  const summary = {};
  for (const [key, items] of Object.entries(grouped)) {
    summary[key] = items.length;
  }
  return summary;
}

/**
 * Format a grouped summary as a readable string.
 * @param {Object} summary
 * @param {string} label
 * @returns {string}
 */
function formatGroupBy(summary, label = 'group') {
  const lines = [`Port entries by ${label}:`];
  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    lines.push(`  ${key}: ${count}`);
  }
  return lines.join('\n');
}

module.exports = {
  groupByField,
  groupByPortRange,
  groupByEnv,
  summarizeGroupBy,
  formatGroupBy,
};
