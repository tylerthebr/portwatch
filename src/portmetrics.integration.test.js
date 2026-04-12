// portmetrics integration test — exercises full pipeline with realistic history

const { buildMetricsReport, findTransientPorts, calcUptimeRatios } = require('./portmetrics');

function makeEntry(timestamp, ports) {
  return { timestamp, ports };
}

const realisticHistory = [
  makeEntry('2024-06-01T08:00:00Z', [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' },
    { port: 6379, protocol: 'tcp', process: 'redis' },
  ]),
  makeEntry('2024-06-01T09:00:00Z', [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' },
    { port: 9229, protocol: 'tcp', process: 'node' }, // debug port, transient
  ]),
  makeEntry('2024-06-01T10:00:00Z', [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' },
  ]),
  makeEntry('2024-06-01T11:00:00Z', [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' },
    { port: 6379, protocol: 'tcp', process: 'redis' },
  ]),
];

describe('portmetrics integration', () => {
  it('produces a correct full report from realistic history', () => {
    const report = buildMetricsReport(realisticHistory);
    expect(report.totalSnapshots).toBe(4);
    expect(report.uniquePorts).toBe(4); // 3000, 5432, 6379, 9229
    expect(report.occurrences['3000/tcp']).toBe(4);
    expect(report.occurrences['5432/tcp']).toBe(4);
    expect(report.occurrences['6379/tcp']).toBe(2);
    expect(report.occurrences['9229/tcp']).toBe(1);
  });

  it('correctly identifies 9229 as transient', () => {
    const transient = findTransientPorts(realisticHistory);
    expect(transient).toContain('9229/tcp');
    expect(transient).not.toContain('3000/tcp');
  });

  it('gives node port 100% uptime', () => {
    const ratios = calcUptimeRatios(realisticHistory);
    expect(ratios['3000/tcp']).toBe(1.0);
    expect(ratios['6379/tcp']).toBe(0.5);
    expect(ratios['9229/tcp']).toBe(0.25);
  });

  it('handles a single-entry history without errors', () => {
    const single = [realisticHistory[0]];
    const report = buildMetricsReport(single);
    expect(report.totalSnapshots).toBe(1);
    expect(report.transientPorts.length).toBe(report.uniquePorts);
  });
});
