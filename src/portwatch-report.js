const { loadHistory } = require('./history');
const { buildDiffSummary } = require('./summary');
const { formatTimestamp } = require('./formatter');
const { loadBaseline } = require('./baseline');

function buildReport(options = {}) {
  const { limit = 10, since = null } = options;
  const history = loadHistory();

  let entries = history;
  if (since) {
    const sinceTs = new Date(since).getTime();
    entries = history.filter(e => new Date(e.timestamp).getTime() >= sinceTs);
  }

  entries = entries.slice(-limit);

  const baseline = loadBaseline();
  const totalSnapshots = entries.length;
  const totalChanges = entries.reduce((sum, e) => sum + (e.diff ? e.diff.length : 0), 0);

  const summary = buildDiffSummary(entries.flatMap(e => e.diff || []));

  return {
    generatedAt: new Date().toISOString(),
    totalSnapshots,
    totalChanges,
    hasBaseline: !!baseline,
    summary,
    entries: entries.map(e => ({
      timestamp: e.timestamp,
      label: formatTimestamp(e.timestamp),
      changeCount: e.diff ? e.diff.length : 0
    }))
  };
}

function formatReport(report) {
  const lines = [];
  lines.push(`portwatch report — generated ${report.label || formatTimestamp(report.generatedAt)}`);
  lines.push(`snapshots: ${report.totalSnapshots}  total changes: ${report.totalChanges}  baseline: ${report.hasBaseline ? 'yes' : 'no'}`);
  lines.push('');

  if (report.summary) {
    lines.push(`  opened: ${report.summary.opened || 0}  closed: ${report.summary.closed || 0}  changed: ${report.summary.changed || 0}`);
    lines.push('');
  }

  report.entries.forEach(e => {
    lines.push(`  [${e.label}]  ${e.changeCount} change(s)`);
  });

  return lines.join('\n');
}

module.exports = { buildReport, formatReport };
