// portclean.js — identify and suggest cleanup of stale or redundant port entries

const { loadHistory } = require('./history');
const { loadIgnoreList } = require('./ignore');

/**
 * Find ports that haven't been seen in recent snapshots
 * @param {Array} current - current port entries
 * @param {number} threshold - min snapshots a port must appear in to be considered active
 * @returns {Array} entries considered stale
 */
function findStaleEntries(current, threshold = 2) {
  const history = loadHistory();
  if (!history || history.length < threshold) return [];

  const recent = history.slice(-threshold);
  const seenInAll = (port, pid) =>
    recent.every(snapshot =>
      (snapshot.entries || []).some(e => e.port === port && e.pid === pid)
    );

  return current.filter(e => !seenInAll(e.port, e.pid));
}

/**
 * Find duplicate port entries (same port, multiple pids)
 * @param {Array} entries
 * @returns {Array} groups of duplicate entries
 */
function findDuplicates(entries) {
  const byPort = {};
  for (const entry of entries) {
    if (!byPort[entry.port]) byPort[entry.port] = [];
    byPort[entry.port].push(entry);
  }
  return Object.values(byPort).filter(group => group.length > 1);
}

/**
 * Filter out entries that are already in the ignore list
 * @param {Array} entries
 * @returns {Array}
 */
function excludeIgnored(entries) {
  const ignored = loadIgnoreList();
  const ignoredPorts = new Set(ignored.map(i => String(i.port)));
  return entries.filter(e => !ignoredPorts.has(String(e.port)));
}

/**
 * Build a full cleanup report
 * @param {Array} current - current port entries
 * @returns {Object} report with stale, duplicates, and suggestions
 */
function buildCleanupReport(current) {
  const active = excludeIgnored(current);
  const stale = findStaleEntries(active);
  const duplicates = findDuplicates(active);

  const suggestions = [
    ...stale.map(e => ({ type: 'stale', port: e.port, pid: e.pid, process: e.process })),
    ...duplicates.flat().map(e => ({ type: 'duplicate', port: e.port, pid: e.pid, process: e.process }))
  ];

  return { stale, duplicates, suggestions, total: suggestions.length };
}

module.exports = { findStaleEntries, findDuplicates, excludeIgnored, buildCleanupReport };
