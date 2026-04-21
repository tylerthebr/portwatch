// portwatch-baseline-drift.js
// Compares current snapshot against a named baseline to detect drift over time

const { loadBaseline } = require('./baseline');
const { diffSnapshots } = require('./snapshot');

function calcDriftScore(diff) {
  const added = (diff.added || []).length;
  const removed = (diff.removed || []).length;
  const changed = (diff.changed || []).length;
  return added * 2 + removed * 3 + changed * 1;
}

function classifyDrift(score) {
  if (score === 0) return 'none';
  if (score <= 5) return 'low';
  if (score <= 15) return 'moderate';
  return 'high';
}

function buildBaselineDriftReport(current, baselineName = 'default') {
  const baseline = loadBaseline(baselineName);
  if (!baseline) {
    return { error: `No baseline found: ${baselineName}`, score: null, level: null };
  }

  const diff = diffSnapshots(baseline, current);
  const score = calcDriftScore(diff);
  const level = classifyDrift(score);

  return {
    baselineName,
    score,
    level,
    added: diff.added || [],
    removed: diff.removed || [],
    changed: diff.changed || [],
    timestamp: new Date().toISOString()
  };
}

function formatBaselineDriftReport(report) {
  if (report.error) return `[baseline-drift] Error: ${report.error}`;

  const lines = [
    `Baseline Drift Report — "${report.baselineName}"`,
    `Drift Score : ${report.score} (${report.level})`,
    `Added       : ${report.added.length}`,
    `Removed     : ${report.removed.length}`,
    `Changed     : ${report.changed.length}`,
    `Checked At  : ${report.timestamp}`
  ];

  if (report.added.length) {
    lines.push('\nNew ports:');
    report.added.forEach(e => lines.push(`  + ${e.port}/${e.proto} (${e.process || 'unknown'})`));
  }

  if (report.removed.length) {
    lines.push('\nRemoved ports:');
    report.removed.forEach(e => lines.push(`  - ${e.port}/${e.proto} (${e.process || 'unknown'})`));
  }

  return lines.join('\n');
}

module.exports = {
  calcDriftScore,
  classifyDrift,
  buildBaselineDriftReport,
  formatBaselineDriftReport
};
