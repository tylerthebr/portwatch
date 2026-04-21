/**
 * portwatch-dedupe.js
 * Detect and remove duplicate port entries across snapshots.
 */

'use strict';

/**
 * Build a unique key for a port entry.
 * @param {object} entry
 * @returns {string}
 */
function entryKey(entry) {
  return `${entry.port}:${entry.protocol || 'tcp'}:${entry.process || ''}`;
}

/**
 * Find duplicate entries in a list (same port+protocol+process).
 * @param {object[]} entries
 * @returns {object[]} duplicates (all but first occurrence)
 */
function findDuplicates(entries) {
  const seen = new Map();
  const dupes = [];
  for (const entry of entries) {
    const key = entryKey(entry);
    if (seen.has(key)) {
      dupes.push(entry);
    } else {
      seen.set(key, entry);
    }
  }
  return dupes;
}

/**
 * Remove duplicate entries, keeping the first occurrence.
 * @param {object[]} entries
 * @returns {object[]}
 */
function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter(entry => {
    const key = entryKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Build a dedupe report summarizing what was removed.
 * @param {object[]} original
 * @param {object[]} deduped
 * @returns {object}
 */
function buildDedupeReport(original, deduped) {
  const removed = findDuplicates(original);
  return {
    originalCount: original.length,
    dedupedCount: deduped.length,
    removedCount: removed.length,
    removed
  };
}

/**
 * Format a dedupe report as a human-readable string.
 * @param {object} report
 * @returns {string}
 */
function formatDedupeReport(report) {
  const lines = [
    `Deduplication Report`,
    `  Original entries : ${report.originalCount}`,
    `  After dedupe     : ${report.dedupedCount}`,
    `  Removed          : ${report.removedCount}`
  ];
  if (report.removed.length > 0) {
    lines.push('  Duplicates:');
    for (const e of report.removed) {
      lines.push(`    port=${e.port} proto=${e.protocol || 'tcp'} process=${e.process || 'unknown'}`);
    }
  }
  return lines.join('\n');
}

module.exports = { entryKey, findDuplicates, dedupeEntries, buildDedupeReport, formatDedupeReport };
