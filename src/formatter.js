/**
 * formatter.js
 * Utilities for formatting port data for display and export
 */

const PROTOCOL_COLORS = {
  tcp: '\x1b[36m',
  udp: '\x1b[33m',
  tcp6: '\x1b[34m',
  udp6: '\x1b[35m',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';

/**
 * Format a single port entry as a human-readable string
 * @param {Object} entry - port entry { port, protocol, process, pid }
 * @param {boolean} color - whether to include ANSI color codes
 * @returns {string}
 */
function formatPortEntry(entry, color = true) {
  const { port, protocol = 'tcp', process: proc = 'unknown', pid = '-' } = entry;
  if (!color) {
    return `${protocol.padEnd(5)} ${String(port).padEnd(6)} ${String(pid).padEnd(8)} ${proc}`;
  }
  const protoColor = PROTOCOL_COLORS[protocol] || '';
  return `${protoColor}${protocol.padEnd(5)}${RESET} ${BOLD}${String(port).padEnd(6)}${RESET} ${String(pid).padEnd(8)} ${proc}`;
}

/**
 * Format a diff entry (added or removed port)
 * @param {Object} entry - port entry
 * @param {'added'|'removed'} type
 * @param {boolean} color
 * @returns {string}
 */
function formatDiffEntry(entry, type, color = true) {
  const prefix = type === 'added' ? '+' : '-';
  const lineColor = color ? (type === 'added' ? GREEN : RED) : '';
  const reset = color ? RESET : '';
  return `${lineColor}${prefix} ${formatPortEntry(entry, color)}${reset}`;
}

/**
 * Format a timestamp into a readable local string
 * @param {string|number} ts - ISO string or epoch ms
 * @returns {string}
 */
function formatTimestamp(ts) {
  return new Date(ts).toLocaleString();
}

/**
 * Format a full diff summary
 * @param {{ added: Object[], removed: Object[] }} diff
 * @param {boolean} color
 * @returns {string}
 */
function formatDiffSummary(diff, color = true) {
  const lines = [];
  if (diff.added.length === 0 && diff.removed.length === 0) {
    return color ? `${GREEN}No changes detected.${RESET}` : 'No changes detected.';
  }
  diff.added.forEach(e => lines.push(formatDiffEntry(e, 'added', color)));
  diff.removed.forEach(e => lines.push(formatDiffEntry(e, 'removed', color)));
  return lines.join('\n');
}

module.exports = { formatPortEntry, formatDiffEntry, formatTimestamp, formatDiffSummary };
