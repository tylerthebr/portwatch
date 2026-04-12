const {
  buildOccurrenceMap,
  calcUptimeRatios,
  findTransientPorts,
  buildMetricsReport,
} = require('./portmetrics');

const mockHistory = [
  {
    timestamp: '2024-01-01T00:00:00.000Z',
    ports: [
      { port: 3000, protocol: 'tcp', process: 'node' },
      { port: 5432, protocol: 'tcp', process: 'postgres' },
    ],
  },
  {
    timestamp: '2024-01-01T01:00:00.000Z',
    ports: [
      { port: 3000, protocol: 'tcp', process: 'node' },
      { port: 8080, protocol: 'tcp', process: 'nginx' },
    ],
  },
  {
    timestamp: '2024-01-01T02:00:00.000Z',
    ports: [
      { port: 3000, protocol: 'tcp', process: 'node' },
    ],
  },
];

describe('buildOccurrenceMap', () => {
  it('counts port appearances correctly', () => {
    const map = buildOccurrenceMap(mockHistory);
    expect(map['3000/tcp']).toBe(3);
    expect(map['5432/tcp']).toBe(1);
    expect(map['8080/tcp']).toBe(1);
  });

  it('returns empty map for empty history', () => {
    expect(buildOccurrenceMap([])).toEqual({});
  });
});

describe('calcUptimeRatios', () => {
  it('calculates correct ratios', () => {
    const ratios = calcUptimeRatios(mockHistory);
    expect(ratios['3000/tcp']).toBe(1.0);
    expect(ratios['5432/tcp']).toBeCloseTo(0.3333, 3);
  });

  it('returns empty object for empty history', () => {
    expect(calcUptimeRatios([])).toEqual({});
  });
});

describe('findTransientPorts', () => {
  it('identifies ports that appeared only once', () => {
    const transient = findTransientPorts(mockHistory);
    expect(transient).toContain('5432/tcp');
    expect(transient).toContain('8080/tcp');
    expect(transient).not.toContain('3000/tcp');
  });
});

describe('buildMetricsReport', () => {
  it('returns a complete report object', () => {
    const report = buildMetricsReport(mockHistory);
    expect(report.totalSnapshots).toBe(3);
    expect(report.uniquePorts).toBe(3);
    expect(report.transientPorts.length).toBe(2);
    expect(report.generatedAt).toBeDefined();
  });

  it('handles empty history gracefully', () => {
    const report = buildMetricsReport([]);
    expect(report.totalSnapshots).toBe(0);
    expect(report.uniquePorts).toBe(0);
    expect(report.transientPorts).toEqual([]);
  });
});
