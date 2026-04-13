// portwatch-compare.js
// Compare two named snapshots or scopes and produce a structured diff report

const { loadSnapshot } = require('./snapshot');
const { diffSnapshots } = require('./snapshot');
const { formatDiffEntry, formatTimestamp } = require('./formatter');

/**
 * Load two snapshots by label and return raw entries.
 * Labels can be 'latest', 'baseline', or a timestamp string.
 */
function resolveSnapshot(history, label) {
  if (!history || !history.length) return null;
  if (label === 'latest') return history[history.length - 1];
  if (label === 'oldest') return history[0];
  return history.find(s => s.timestamp === label || s.label === label) || null;
}

/**
 * Compare two snapshot entries and return a comparison report.
 */
function compareSnapshots(snapshotA, snapshotB) {
  if (!snapshotA || !snapshotB) {
    throw new Error('Both snapshots must be provided for comparison');
  }

  const diff = diffSnapshots(snapshotA.ports, snapshotB.ports);

  return {
    from: {
      label: snapshotA.label || snapshotA.timestamp,
      timestamp: snapshotA.timestamp,
      portCount: snapshotA.ports.length
    },
    to: {
      label: snapshotB.label || snapshotB.timestamp,
      timestamp: snapshotB.timestamp,
      portCount: snapshotB.ports.length
    },
    added: diff.added || [],
    removed: diff.removed || [],
    unchanged: diff.unchanged || [],
    summary: {
      added: (diff.added || []).length,
      removed: (diff.removed || []).length,
      unchanged: (diff.unchanged || []).length
    }
  };
}

/**
 * Format a comparison report for CLI output.
 */
function formatCompareReport(report) {
  const lines = [];
  lines.push(`Compare: ${report.from.label} → ${report.to.label}`);
  lines.push(`  From: ${formatTimestamp(report.from.timestamp)} (${report.from.portCount} ports)`);
  lines.push(`  To:   ${formatTimestamp(report.to.timestamp)} (${report.to.portCount} ports)`);
  lines.push('');

  if (report.added.length) {
    lines.push(`Added (${report.added.length}):`);
    report.added.forEach(e => lines.push('  + ' + formatDiffEntry(e)));
  }

  if (report.removed.length) {
    lines.push(`Removed (${report.removed.length}):`);
    report.removed.forEach(e => lines.push('  - ' + formatDiffEntry(e)));
  }

  if (!report.added.length && !report.removed.length) {
    lines.push('No changes between snapshots.');
  }

  return lines.join('\n');
}

module.exports = { resolveSnapshot, compareSnapshots, formatCompareReport };
