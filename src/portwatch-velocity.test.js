const { buildVelocityMap, peakVelocity, averageVelocity, formatVelocityReport } = require('./portwatch-velocity');

function makeHistory(portSets) {
  return portSets.map((ports, i) => ({
    timestamp: new Date(Date.now() + i * 60000).toISOString(),
    ports: ports.map(p => ({ port: p, protocol: 'tcp', process: 'test' }))
  }));
}

describe('buildVelocityMap', () => {
  test('returns empty array for less than 2 entries', () => {
    expect(buildVelocityMap([])).toEqual([]);
    expect(buildVelocityMap([{ timestamp: new Date().toISOString(), ports: [] }])).toEqual([]);
  });

  test('detects added ports between intervals', () => {
    const history = makeHistory([[3000], [3000, 4000]]);
    const result = buildVelocityMap(history);
    expect(result).toHaveLength(1);
    expect(result[0].added).toBe(1);
    expect(result[0].removed).toBe(0);
  });

  test('detects removed ports between intervals', () => {
    const history = makeHistory([[3000, 4000], [3000]]);
    const result = buildVelocityMap(history);
    expect(result[0].removed).toBe(1);
    expect(result[0].added).toBe(0);
  });

  test('handles no change between intervals', () => {
    const history = makeHistory([[3000, 4000], [3000, 4000]]);
    const result = buildVelocityMap(history);
    expect(result[0].added).toBe(0);
    expect(result[0].removed).toBe(0);
    expect(result[0].velocity).toBe(0);
  });

  test('velocity is changes per minute', () => {
    const history = makeHistory([[3000], [3000, 4000, 5000]]);
    const result = buildVelocityMap(history);
    // 2 changes over ~1 minute = ~2/min
    expect(result[0].velocity).toBeCloseTo(2, 0);
  });
});

describe('peakVelocity', () => {
  test('returns null for empty map', () => {
    expect(peakVelocity([])).toBeNull();
  });

  test('returns entry with highest velocity', () => {
    const map = [
      { timestamp: 'a', added: 1, removed: 0, velocity: 1.0 },
      { timestamp: 'b', added: 3, removed: 2, velocity: 5.0 },
      { timestamp: 'c', added: 0, removed: 1, velocity: 0.5 }
    ];
    expect(peakVelocity(map).timestamp).toBe('b');
  });
});

describe('averageVelocity', () => {
  test('returns 0 for empty map', () => {
    expect(averageVelocity([])).toBe(0);
  });

  test('calculates mean velocity', () => {
    const map = [
      { velocity: 2.0 },
      { velocity: 4.0 }
    ];
    expect(averageVelocity(map)).toBe(3.0);
  });
});

describe('formatVelocityReport', () => {
  test('returns fallback message for empty map', () => {
    expect(formatVelocityReport([])).toMatch(/No velocity data/);
  });

  test('includes peak and average in output', () => {
    const history = makeHistory([[3000], [3000, 4000], [3000]]);
    const map = buildVelocityMap(history);
    const report = formatVelocityReport(map);
    expect(report).toMatch(/Peak velocity/);
    expect(report).toMatch(/Average velocity/);
    expect(report).toMatch(/Interval breakdown/);
  });
});
