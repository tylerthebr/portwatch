const { pingPort } = require('./portping');
const { loadWatchlist } = require('./watchlist');
const { getPortStat } = require('./portstat');

/**
 * Run a health check against a list of port entries.
 * Returns an array of health result objects.
 */
async function runHealthCheck(entries) {
  const results = [];
  for (const entry of entries) {
    const reachable = await pingPort(entry.port, entry.host || '127.0.0.1');
    const stat = await getPortStat(entry.port).catch(() => null);
    results.push({
      port: entry.port,
      process: entry.process || null,
      reachable,
      connections: stat ? stat.connections : 0,
      status: reachable ? 'healthy' : 'unreachable',
      checkedAt: new Date().toISOString()
    });
  }
  return results;
}

/**
 * Run health check against the current watchlist.
 */
async function checkWatchlist() {
  const watchlist = loadWatchlist();
  return runHealthCheck(watchlist);
}

/**
 * Summarise health results into a simple report object.
 */
function buildHealthReport(results) {
  const total = results.length;
  const healthy = results.filter(r => r.status === 'healthy').length;
  const unreachable = total - healthy;
  return {
    total,
    healthy,
    unreachable,
    score: total > 0 ? Math.round((healthy / total) * 100) : 100,
    results,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Format a health report as a human-readable string.
 */
function formatHealthReport(report) {
  const lines = [
    `Health Check — ${report.generatedAt}`,
    `  Total : ${report.total}`,
    `  Healthy     : ${report.healthy}`,
    `  Unreachable : ${report.unreachable}`,
    `  Score : ${report.score}%`,
    ''
  ];
  for (const r of report.results) {
    const icon = r.status === 'healthy' ? '✓' : '✗';
    const proc = r.process ? ` (${r.process})` : '';
    lines.push(`  ${icon} :${r.port}${proc} — ${r.status}, ${r.connections} conn`);
  }
  return lines.join('\n');
}

module.exports = { runHealthCheck, checkWatchlist, buildHealthReport, formatHealthReport };
