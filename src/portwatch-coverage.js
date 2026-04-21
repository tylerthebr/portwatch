// portwatch-coverage.js
// Tracks which ports in a watchlist have been seen, reporting coverage gaps

const { loadWatchlist } = require('./watchlist');

function buildCoverageMap(watchlist, snapshots) {
  const seen = new Map();
  for (const entry of watchlist) {
    seen.set(entry.port, false);
  }
  for (const snapshot of snapshots) {
    for (const entry of snapshot.ports || []) {
      if (seen.has(entry.port)) {
        seen.set(entry.port, true);
      }
    }
  }
  return seen;
}

function calcCoverageRatio(coverageMap) {
  if (coverageMap.size === 0) return 1;
  let seen = 0;
  for (const v of coverageMap.values()) {
    if (v) seen++;
  }
  return seen / coverageMap.size;
}

function getMissingPorts(coverageMap) {
  const missing = [];
  for (const [port, wasSeen] of coverageMap.entries()) {
    if (!wasSeen) missing.push(port);
  }
  return missing.sort((a, b) => a - b);
}

function buildCoverageReport(watchlist, snapshots) {
  const coverageMap = buildCoverageMap(watchlist, snapshots);
  const ratio = calcCoverageRatio(coverageMap);
  const missing = getMissingPorts(coverageMap);
  return {
    total: watchlist.length,
    seen: watchlist.length - missing.length,
    missing,
    ratio,
    percent: Math.round(ratio * 100)
  };
}

function formatCoverageReport(report) {
  const lines = [
    `Coverage: ${report.seen}/${report.total} ports seen (${report.percent}%)`
  ];
  if (report.missing.length > 0) {
    lines.push(`Missing ports: ${report.missing.join(', ')}`);
  } else {
    lines.push('All watched ports have been observed.');
  }
  return lines.join('\n');
}

module.exports = {
  buildCoverageMap,
  calcCoverageRatio,
  getMissingPorts,
  buildCoverageReport,
  formatCoverageReport
};
