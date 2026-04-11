// portdiff.js — compute and format rich diffs between two port snapshots

const { formatDiffEntry, formatTimestamp } = require('./formatter');

/**
 * Categorize a raw diff array into added, removed, and changed buckets.
 * @param {Array} diff  — output of diffSnapshots()
 * @returns {{ added: Array, removed: Array, changed: Array }}
 */
function categorizeDiff(diff) {
  const added = [];
  const removed = [];
  const changed = [];

  for (const entry of diff) {
    if (entry.type === 'added') added.push(entry);
    else if (entry.type === 'removed') removed.push(entry);
    else if (entry.type === 'changed') changed.push(entry);
  }

  return { added, removed, changed };
}

/**
 * Build a structured diff report object.
 * @param {Object} before  — previous snapshot
 * @param {Object} after   — current snapshot
 * @param {Array}  diff    — raw diff entries
 * @returns {Object}
 */
function buildDiffReport(before, after, diff) {
  const { added, removed, changed } = categorizeDiff(diff);
  return {
    generatedAt: new Date().toISOString(),
    beforeTimestamp: before.timestamp || null,
    afterTimestamp: after.timestamp || null,
    summary: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      total: diff.length,
    },
    added,
    removed,
    changed,
  };
}

/**
 * Render a diff report as a human-readable string.
 * @param {Object} report  — output of buildDiffReport()
 * @returns {string}
 */
function renderDiffReport(report) {
  const lines = [];
  lines.push(`Diff Report — ${formatTimestamp(report.generatedAt)}`);
  lines.push(
    `  +${report.summary.added} added  -${report.summary.removed} removed  ~${report.summary.changed} changed`
  );

  if (report.added.length) {
    lines.push('\nAdded:');
    report.added.forEach(e => lines.push('  ' + formatDiffEntry(e)));
  }
  if (report.removed.length) {
    lines.push('\nRemoved:');
    report.removed.forEach(e => lines.push('  ' + formatDiffEntry(e)));
  }
  if (report.changed.length) {
    lines.push('\nChanged:');
    report.changed.forEach(e => lines.push('  ' + formatDiffEntry(e)));
  }

  if (report.summary.total === 0) lines.push('  No changes detected.');

  return lines.join('\n');
}

module.exports = { categorizeDiff, buildDiffReport, renderDiffReport };
