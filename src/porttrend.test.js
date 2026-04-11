const { buildFrequencyMap, topPorts, transientPorts, buildTrendReport } = require('./porttrend');
jest.mock('./history');
const { loadHistory } = require('./history');

const sampleHistory = [
  { ports: [{ port: 3000 }, { port: 8080 }, { port: 5432 }] },
  { ports: [{ port: 3000 }, { port: 8080 }] },
  { ports: [{ port: 3000 }, { port: 9229 }] },
  { ports: [{ port: 8080 }] }
];

describe('buildFrequencyMap', () => {
  it('counts port occurrences across entries', () => {
    const freq = buildFrequencyMap(sampleHistory);
    expect(freq['3000']).toBe(3);
    expect(freq['8080']).toBe(3);
    expect(freq['5432']).toBe(1);
    expect(freq['9229']).toBe(1);
  });

  it('returns empty object for empty entries', () => {
    expect(buildFrequencyMap([])).toEqual({});
  });

  it('handles entries with no ports array', () => {
    const freq = buildFrequencyMap([{ ports: [] }, {}]);
    expect(Object.keys(freq).length).toBe(0);
  });
});

describe('topPorts', () => {
  it('returns ports sorted by frequency descending', () => {
    const freq = buildFrequencyMap(sampleHistory);
    const top = topPorts(freq, 2);
    expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
    expect(top.length).toBe(2);
  });

  it('respects limit', () => {
    const freq = { 80: 5, 443: 4, 3000: 3, 8080: 2 };
    expect(topPorts(freq, 2).length).toBe(2);
  });

  it('returns numeric port values', () => {
    const freq = { '3000': 3 };
    const top = topPorts(freq, 1);
    expect(typeof top[0].port).toBe('number');
  });
});

describe('transientPorts', () => {
  it('returns ports that appeared only once', () => {
    const freq = buildFrequencyMap(sampleHistory);
    const transient = transientPorts(freq);
    expect(transient).toContain(5432);
    expect(transient).toContain(9229);
    expect(transient).not.toContain(3000);
  });

  it('returns empty array when no transient ports', () => {
    expect(transientPorts({ '80': 3, '443': 2 })).toEqual([]);
  });
});

describe('buildTrendReport', () => {
  it('returns zeroed report when history is empty', async () => {
    loadHistory.mockResolvedValue([]);
    const report = await buildTrendReport();
    expect(report.totalSnapshots).toBe(0);
    expect(report.topPorts).toEqual([]);
    expect(report.transientPorts).toEqual([]);
  });

  it('builds report from history', async () => {
    loadHistory.mockResolvedValue(sampleHistory);
    const report = await buildTrendReport(2);
    expect(report.totalSnapshots).toBe(4);
    expect(report.topPorts.length).toBe(2);
    expect(report.transientPorts.length).toBeGreaterThan(0);
  });
});
