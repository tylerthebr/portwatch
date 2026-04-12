const { loadHistory } = require('./history');
const { formatTimestamp } = require('./formatter');

/**
 * Build a timeline of port events from history entries.
 * @param {Array} history
 * @returns {Array}
 */
function buildTimeline(history) {
  if (!Array.isArray(history) || history.length === 0) return [];

  return history
    .filter(entry => entry && entry.timestamp && entry.diff)
    .map(entry => ({
      timestamp: entry.timestamp,
      added: (entry.diff.added || []).map(p => ({ port: p.port, process: p.process, proto: p.proto })),
      removed: (entry.diff.removed || []).map(p => ({ port: p.port, process: p.process, proto: p.proto })),
      total: (entry.diff.added || []).length + (entry.diff.removed || []).length
    }))
    .filter(e => e.total > 0)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Get timeline entries for a specific port number.
 * @param {Array} timeline
 * @param {number} port
 * @returns {Array}
 */
function timelineForPort(timeline, port) {
  return timeline
    .map(entry => {
      const added = entry.added.filter(p => p.port === port);
      const removed = entry.removed.filter(p => p.port === port);
      if (added.length === 0 && removed.length === 0) return null;
      return { timestamp: entry.timestamp, added, removed };
    })
    .filter(Boolean);
}

/**
 * Format a timeline for display.
 * @param {Array} timeline
 * @returns {string}
 */
function formatTimeline(timeline) {
  if (!timeline || timeline.length === 0) return 'No timeline events found.';

  const lines = [];
  for (const entry of timeline) {
    lines.push(`[${formatTimestamp(entry.timestamp)}]`);
    for (const p of entry.added) {
      lines.push(`  + ${p.port}/${p.proto}  ${p.process || 'unknown'}`);
    }
    for (const p of entry.removed) {
      lines.push(`  - ${p.port}/${p.proto}  ${p.process || 'unknown'}`);
    }
  }
  return lines.join('\n');
}

/**
 * Load history and build a timeline.
 * @param {string} configDir
 * @returns {Array}
 */
function loadTimeline(configDir) {
  const history = loadHistory(configDir);
  return buildTimeline(history);
}

module.exports = { buildTimeline, timelineForPort, formatTimeline, loadTimeline };
