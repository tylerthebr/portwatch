const net = require('net');

const DEFAULT_TIMEOUT = 1500;

/**
 * Attempt a TCP connection to determine if a port is reachable.
 * Resolves to { port, host, reachable, latencyMs }.
 */
function probePort(port, host = '127.0.0.1', timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    const finish = (reachable) => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ port, host, reachable, latencyMs });
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    socket.connect(port, host);
  });
}

/**
 * Probe all ports in an entries array concurrently.
 * Returns array of entries annotated with reachability info.
 */
async function checkReachability(entries, host = '127.0.0.1', timeout = DEFAULT_TIMEOUT) {
  const results = await Promise.all(
    entries.map(async (entry) => {
      const probe = await probePort(entry.port, host, timeout);
      return { ...entry, reachable: probe.reachable, latencyMs: probe.latencyMs };
    })
  );
  return results;
}

/**
 * Build a reachability report from annotated entries.
 */
function buildReachabilityReport(entries) {
  const reachable = entries.filter((e) => e.reachable);
  const unreachable = entries.filter((e) => !e.reachable);
  const avgLatency =
    reachable.length > 0
      ? Math.round(reachable.reduce((sum, e) => sum + e.latencyMs, 0) / reachable.length)
      : null;

  return {
    total: entries.length,
    reachableCount: reachable.length,
    unreachableCount: unreachable.length,
    avgLatencyMs: avgLatency,
    reachable,
    unreachable,
  };
}

/**
 * Format a reachability report for CLI output.
 */
function formatReachabilityReport(report) {
  const lines = [
    `Reachability Report`,
    `  Total probed : ${report.total}`,
    `  Reachable    : ${report.reachableCount}`,
    `  Unreachable  : ${report.unreachableCount}`,
  ];
  if (report.avgLatencyMs !== null) {
    lines.push(`  Avg latency  : ${report.avgLatencyMs}ms`);
  }
  if (report.unreachable.length > 0) {
    lines.push('  Unreachable ports:');
    report.unreachable.forEach((e) => {
      lines.push(`    - ${e.port} (${e.process || 'unknown'})`);
    });
  }
  return lines.join('\n');
}

module.exports = {
  probePort,
  checkReachability,
  buildReachabilityReport,
  formatReachabilityReport,
};
