const { formatTimestamp } = require('./formatter');

/**
 * Build a summary object from a port snapshot
 */
function buildSummary(snapshot) {
  const entries = Object.values(snapshot);
  const protocols = { tcp: 0, udp: 0 };
  const processes = {};

  for (const entry of entries) {
    const proto = (entry.protocol || 'tcp').toLowerCase();
    if (proto in protocols) protocols[proto]++;

    const proc = entry.process || 'unknown';
    processes[proc] = (processes[proc] || 0) + 1;
  }

  return {
    totalPorts: entries.length,
    protocols,
    topProcesses: getTopProcesses(processes, 5),
    generatedAt: formatTimestamp(new Date()),
  };
}

/**
 * Build a diff summary comparing two snapshots
 */
function buildDiffSummary(diff) {
  const opened = diff.filter(d => d.type === 'opened');
  const closed = diff.filter(d => d.type === 'closed');
  const changed = diff.filter(d => d.type === 'changed');

  return {
    opened: opened.length,
    closed: closed.length,
    changed: changed.length,
    total: diff.length,
    openedPorts: opened.map(d => d.port),
    closedPorts: closed.map(d => d.port),
  };
}

/**
 * Return top N processes by port count
 */
function getTopProcesses(processMap, n = 5) {
  return Object.entries(processMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Format summary as a human-readable string
 */
function formatSummary(summary) {
  const lines = [
    `Total open ports : ${summary.totalPorts}`,
    `TCP: ${summary.protocols.tcp}  UDP: ${summary.protocols.udp}`,
    `Generated at     : ${summary.generatedAt}`,
    '',
    'Top processes:',
    ...summary.topProcesses.map(p => `  ${p.name.padEnd(20)} ${p.count} port(s)`),
  ];
  return lines.join('\n');
}

module.exports = { buildSummary, buildDiffSummary, getTopProcesses, formatSummary };
