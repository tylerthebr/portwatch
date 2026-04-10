// portgroup.js — group ports by process, range, or tag for summary views

const { getTag } = require('./tags');

/**
 * Group an array of port entries by their process name.
 * @param {Array} entries
 * @returns {Object} map of processName -> entries[]
 */
function groupByProcess(entries) {
  return entries.reduce((acc, entry) => {
    const key = entry.process || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
}

/**
 * Group entries into named buckets based on port ranges.
 * @param {Array} entries
 * @param {Array} ranges  e.g. [{name:'dev', from:3000, to:3999}, ...]
 * @returns {Object} map of rangeName -> entries[]
 */
function groupByRange(entries, ranges = []) {
  const result = { other: [] };
  ranges.forEach(r => { result[r.name] = []; });

  entries.forEach(entry => {
    const port = Number(entry.port);
    const matched = ranges.find(r => port >= r.from && port <= r.to);
    if (matched) {
      result[matched.name].push(entry);
    } else {
      result.other.push(entry);
    }
  });

  return result;
}

/**
 * Group entries by their user-assigned tag (from tags.js).
 * Entries without a tag land in 'untagged'.
 * @param {Array} entries
 * @returns {Object} map of tagName -> entries[]
 */
function groupByTag(entries) {
  return entries.reduce((acc, entry) => {
    const tag = getTag(entry.port) || 'untagged';
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(entry);
    return acc;
  }, {});
}

/**
 * Return a flat sorted list of group keys with their entry counts.
 * @param {Object} grouped
 * @returns {Array} [{group, count}]
 */
function summarizeGroups(grouped) {
  return Object.entries(grouped)
    .map(([group, entries]) => ({ group, count: entries.length }))
    .sort((a, b) => b.count - a.count);
}

module.exports = { groupByProcess, groupByRange, groupByTag, summarizeGroups };
