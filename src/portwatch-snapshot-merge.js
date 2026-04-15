/**
 * portwatch-snapshot-merge.js
 * Merge multiple snapshots into a unified port list,
 * deduplicating entries and tracking source snapshots.
 */

const { loadSnapshot } = require('./snapshot');

/**
 * Merge an array of snapshot entry arrays into one deduplicated list.
 * Each entry is keyed by `${port}/${protocol}`.
 * @param {Array[]} snapshots - array of entry arrays
 * @returns {Object[]} merged entries with `sources` count
 */
function mergeSnapshots(snapshots) {
  const map = new Map();

  for (const entries of snapshots) {
    for (const entry of entries) {
      const key = `${entry.port}/${entry.protocol}`;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.sources += 1;
        // prefer most recent process name if present
        if (entry.process && !existing.process) {
          existing.process = entry.process;
        }
      } else {
        map.set(key, { ...entry, sources: 1 });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.port - b.port);
}

/**
 * Load and merge snapshots by file paths.
 * @param {string[]} paths
 * @returns {Object[]}
 */
function mergeSnapshotFiles(paths) {
  const loaded = paths.map(p => {
    const snap = loadSnapshot(p);
    return Array.isArray(snap) ? snap : [];
  });
  return mergeSnapshots(loaded);
}

/**
 * Build a merge report summarising the result.
 * @param {Object[]} merged
 * @param {number} sourceCount
 * @returns {Object}
 */
function buildMergeReport(merged, sourceCount) {
  const multiSource = merged.filter(e => e.sources > 1);
  return {
    totalPorts: merged.length,
    sourceSnapshots: sourceCount,
    sharedPorts: multiSource.length,
    uniquePorts: merged.length - multiSource.length,
    entries: merged
  };
}

/**
 * Format a merge report as a human-readable string.
 * @param {Object} report
 * @returns {string}
 */
function formatMergeReport(report) {
  const lines = [
    `Merged ${report.sourceSnapshots} snapshot(s)`,
    `  Total ports : ${report.totalPorts}`,
    `  Shared      : ${report.sharedPorts}`,
    `  Unique      : ${report.uniquePorts}`
  ];
  return lines.join('\n');
}

module.exports = {
  mergeSnapshots,
  mergeSnapshotFiles,
  buildMergeReport,
  formatMergeReport
};
