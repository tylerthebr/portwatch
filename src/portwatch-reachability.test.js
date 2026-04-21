const net = require('net');
const {
  probePort,
  checkReachability,
  buildReachabilityReport,
  formatReachabilityReport,
} = require('./portwatch-reachability');

describe('probePort', () => {
  it('returns reachable=true when a server is listening', async () => {
    const server = net.createServer();
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();

    const result = await probePort(port);
    expect(result.reachable).toBe(true);
    expect(result.port).toBe(port);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    await new Promise((r) => server.close(r));
  });

  it('returns reachable=false for a closed port', async () => {
    const result = await probePort(19999, '127.0.0.1', 300);
    expect(result.reachable).toBe(false);
  });
});

describe('checkReachability', () => {
  it('annotates all entries with reachability info', async () => {
    const server = net.createServer();
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();

    const entries = [
      { port, process: 'test-server' },
      { port: 19998, process: 'ghost' },
    ];

    const results = await checkReachability(entries, '127.0.0.1', 400);
    expect(results).toHaveLength(2);
    expect(results[0].reachable).toBe(true);
    expect(results[1].reachable).toBe(false);
    expect(results[0].process).toBe('test-server');

    await new Promise((r) => server.close(r));
  });
});

describe('buildReachabilityReport', () => {
  const entries = [
    { port: 3000, reachable: true, latencyMs: 10 },
    { port: 4000, reachable: true, latencyMs: 20 },
    { port: 5000, reachable: false, latencyMs: 300 },
  ];

  it('counts reachable and unreachable correctly', () => {
    const report = buildReachabilityReport(entries);
    expect(report.total).toBe(3);
    expect(report.reachableCount).toBe(2);
    expect(report.unreachableCount).toBe(1);
  });

  it('calculates average latency from reachable entries only', () => {
    const report = buildReachabilityReport(entries);
    expect(report.avgLatencyMs).toBe(15);
  });

  it('returns null avgLatencyMs when no reachable entries', () => {
    const report = buildReachabilityReport([{ port: 9999, reachable: false, latencyMs: 400 }]);
    expect(report.avgLatencyMs).toBeNull();
  });
});

describe('formatReachabilityReport', () => {
  it('includes summary lines', () => {
    const report = buildReachabilityReport([
      { port: 3000, process: 'node', reachable: true, latencyMs: 8 },
      { port: 9999, process: 'ghost', reachable: false, latencyMs: 500 },
    ]);
    const output = formatReachabilityReport(report);
    expect(output).toContain('Reachability Report');
    expect(output).toContain('Reachable    : 1');
    expect(output).toContain('Unreachable  : 1');
    expect(output).toContain('9999');
    expect(output).toContain('ghost');
  });
});
