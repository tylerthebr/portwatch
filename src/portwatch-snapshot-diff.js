// portwatch-snapshot-diff.js
// Compares two named snapshots and produces a structured diff report

const { loadSnapshot } = require('./snapshot');
const { categorizeDiff } = require('./portdiff');
const { formatTimestamp } = require('./formatter');

/**
 * Resolve a snapshot by name or path.
 * Falls back to loadSnapshot which handles named snapshots.
 */
function resolveNamedSnapshot(nameOrPath) {
  try {
    return loadSnapshot(nameOrPath);
  } catch {
    return null;
  }
}

/**
 * Compare two snapshots by name/path and return a diff report.
 * @param {string} fromName
 * @param {string} toName
 * @returns {{ from: object, to: object, diff: object } | null}
 */
function compareNamedSnapshots(fromName, toName) {
  const from = resolveNamedSnapshot(fromName);
  const to = resolveNamedSnapshot(toName);

  if (!from || !to) {
    return null;
  }

  const diff = categorizeDiff(from.ports || [], to.ports || []);

  return {
    from: { name: fromName, timestamp: from.timestamp, count: (from.ports || []).length },
    to: { name: toName, timestamp: to.timestamp, count: (to.ports || []).length },
    diff
  };
}

/**
 * Format a named snapshot diff report as a human-readable string.
 * @param {{ from: object, to: object, diff: object }} report
 * @returns {string}
 */
function formatNamedDiffReport(report) {
  if (!report) return 'Could not load one or both snapshots.';

  const { from, to, diff } = report;
  const lines = [];

  lines.push(`Snapshot Diff Report`);
  lines.push(`  From : ${from.name} (${formatTimestamp(from.timestamp)}) — ${from.count} ports`);
  lines.push(`  To   : ${to.name} (${formatTimestamp(to.timestamp)}) — ${to.count} ports`);
  lines.push('');

  const added = diff.added || [];
  const removed = diff.removed || [];
  const changed = diff.changed || [];

  lines.push(`  Added   : ${added.length}`);
  lines.push(`  Removed : ${removed.length}`);
  lines.push(`  Changed : ${changed.length}`);

  if (added.length) {
    lines.push('');
    lines.push('  [+] Added:');
    added.forEach(e => lines.push(`      :${e.port} (${e.process || 'unknown'})`));
  }

  if (removed.length) {
    lines.push('');
    lines.push('  [-] Removed:');
    removed.forEach(e => lines.push(`      :${e.port} (${e.process || 'unknown'})`));
  }

  if (changed.length) {
    lines.push('');
    lines.push('  [~] Changed:');
    changed.forEach(e => lines.push(`      :${e.port}`));
  }

  return lines.join('\n');
}

module.exports = { resolveNamedSnapshot, compareNamedSnapshots, formatNamedDiffReport };
