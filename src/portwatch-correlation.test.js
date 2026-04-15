'use strict';

const {
  buildCoOccurrenceMap,
  findCorrelatedPairs,
  buildCorrelationReport,
  formatCorrelationReport
} = require('./portwatch-correlation');

const makeHistory = (snapshots) =>
  snapshots.map((ports, i) => ({ timestamp: `2024-01-01T00:0${i}:00Z`, ports }));

describe('buildCoOccurrenceMap', () => {
  test('returns empty map for empty history', () => {
    expect(buildCoOccurrenceMap([])).toEqual({});
  });

  test('counts co-occurrences correctly', () => {
    const history = makeHistory([[3000, 4000], [3000, 4000], [3000, 5000]]);
    const map = buildCoOccurrenceMap(history);
    expect(map['3000:4000']).toBe(2);
    expect(map['3000:5000']).toBe(1);
    expect(map['4000:5000']).toBeUndefined();
  });

  test('handles single-port snapshots (no pairs)', () => {
    const history = makeHistory([[8080], [8080]]);
    expect(buildCoOccurrenceMap(history)).toEqual({});
  });

  test('key is always low:high order', () => {
    const history = makeHistory([[5000, 3000]]);
    const map = buildCoOccurrenceMap(history);
    expect(map['3000:5000']).toBe(1);
    expect(map['5000:3000']).toBeUndefined();
  });
});

describe('findCorrelatedPairs', () => {
  test('filters by minCount', () => {
    const coMap = { '3000:4000': 3, '4000:5000': 1 };
    const pairs = findCorrelatedPairs(coMap, 2);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ portA: 3000, portB: 4000, count: 3 });
  });

  test('returns all pairs when minCount is 1', () => {
    const coMap = { '3000:4000': 1, '4000:5000': 1 };
    expect(findCorrelatedPairs(coMap, 1)).toHaveLength(2);
  });

  test('sorts by count descending', () => {
    const coMap = { '3000:4000': 2, '5000:6000': 5, '7000:8000': 3 };
    const pairs = findCorrelatedPairs(coMap, 1);
    expect(pairs[0].count).toBe(5);
    expect(pairs[1].count).toBe(3);
    expect(pairs[2].count).toBe(2);
  });
});

describe('buildCorrelationReport', () => {
  test('returns totalSnapshots count', () => {
    const history = makeHistory([[3000, 4000], [3000, 4000]]);
    const report = buildCorrelationReport(history);
    expect(report.totalSnapshots).toBe(2);
  });

  test('respects minCount option', () => {
    const history = makeHistory([[3000, 4000], [3000, 5000]]);
    const report = buildCorrelationReport(history, { minCount: 2 });
    expect(report.pairs).toHaveLength(0);
  });
});

describe('formatCorrelationReport', () => {
  test('shows message when no pairs', () => {
    const out = formatCorrelationReport({ pairs: [], totalSnapshots: 5 });
    expect(out).toMatch(/No correlated/);
    expect(out).toMatch(/5 snapshots/);
  });

  test('lists pairs when present', () => {
    const report = {
      pairs: [{ portA: 3000, portB: 4000, count: 4 }],
      totalSnapshots: 10
    };
    const out = formatCorrelationReport(report);
    expect(out).toMatch(/3000 <-> 4000/);
    expect(out).toMatch(/4/);
    expect(out).toMatch(/10 snapshots/);
  });
});
