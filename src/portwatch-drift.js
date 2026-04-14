// portwatch-drift.js
// Detects configuration drift by comparing current ports against a known-good baseline

const { loadBaseline } = require('./baseline');
const { diffSnapshots } = require('./snapshot');
const { formatTimestamp } = require('./formatter');

const DRIFT_SEVERITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

function scoreDrift(added, removed) {
  const total = added.length + removed.length;
  if (total === 0) return { score: 0, severity: null };
  if (total <= 2) return { score: total, severity: DRIFT_SEVERITY.low };
  if (total <= 6) return { score: total, severity: DRIFT_SEVERITY.medium };
  return { score: total, severity: DRIFT_SEVERITY.high };
}

function detectDrift(current, baseline) {
  if (!baseline || !baseline.ports) {
    return { hasDrift: false, added: [], removed: [], score: 0, severity: null, message: 'No baseline found' };
  }

  const diff = diffSnapshots(baseline.ports, current);
  const added = diff.filter(d => d.status === 'added');
  const removed = diff.filter(d => d.status === 'removed');
  const { score, severity } = scoreDrift(added, removed);
  const hasDrift = score > 0;

  return {
    hasDrift,
    added,
    removed,
    score,
    severity,
    baselineAt: baseline.savedAt || null,
    message: hasDrift ? `Drift detected: +${added.length} added, -${removed.length} removed` : 'No drift detected',
  };
}

function formatDriftReport(report) {
  const lines = [];
  lines.push(`Drift Report — ${formatTimestamp(Date.now())}`);
  if (report.baselineAt) lines.push(`Baseline taken: ${formatTimestamp(report.baselineAt)}`);
  lines.push(report.message);
  if (report.severity) lines.push(`Severity: ${report.severity.toUpperCase()} (score: ${report.score})`);
  if (report.added.length) {
    lines.push('\nAdded ports:');
    report.added.forEach(e => lines.push(`  + ${e.port}/${e.protocol} (${e.process || 'unknown'})`));
  }
  if (report.removed.length) {
    lines.push('\nRemoved ports:');
    report.removed.forEach(e => lines.push(`  - ${e.port}/${e.protocol} (${e.process || 'unknown'})`));
  }
  return lines.join('\n');
}

async function runDriftCheck(currentPorts) {
  const baseline = await loadBaseline();
  return detectDrift(currentPorts, baseline);
}

module.exports = { detectDrift, scoreDrift, formatDriftReport, runDriftCheck, DRIFT_SEVERITY };
