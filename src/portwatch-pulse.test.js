'use strict';

const { buildPulseMap, scorePulse, buildPulseReport, formatPulseReport } = require('./portwatch-pulse');

const makeHistory = (snapshots) =>
  snapshots.map((ports, i) => ({ timestamp: 1000 + i * 60, ports }));

describe('buildPulseMap', () => {
  it('counts port appearances across snapshots', () => {
    const history = makeHistory([
      [{ port: 3000, process: 'node' }],
      [{ port: 3000, process: 'node' }, { port: 5432, process: 'postgres' }],
      [{ port: 5432, process: 'postgres' }]
    ]);
    const map = buildPulseMap(history);
    expect(map['3000'].count).toBe(2);
    expect(map['5432'].count).toBe(2);
  });

  it('tracks firstSeen and lastSeen', () => {
    const history = makeHistory([
      [{ port: 8080 }],
      [],
      [{ port: 8080 }]
    ]);
    const map = buildPulseMap(history);
    expect(map['8080'].firstSeen).toBe(1000);
    expect(map['8080'].lastSeen).toBe(1120);
  });

  it('returns empty map for empty history', () => {
    expect(buildPulseMap([])).toEqual({});
  });
});

describe('scorePulse', () => {
  it('returns 1 when port appears in all snapshots', () => {
    expect(scorePulse({ count: 5 }, 5)).toBe(1);
  });

  it('returns partial score', () => {
    expect(scorePulse({ count: 2 }, 10)).toBeCloseTo(0.2);
  });

  it('returns 0 for zero total snapshots', () => {
    expect(scorePulse({ count: 3 }, 0)).toBe(0);
  });
});

describe('buildPulseReport', () => {
  it('sorts by score descending', () => {
    const history = makeHistory([
      [{ port: 3000 }, { port: 9000 }],
      [{ port: 3000 }],
      [{ port: 3000 }]
    ]);
    const report = buildPulseReport(history);
    expect(report[0].port).toBe(3000);
    expect(report[0].score).toBeGreaterThan(report[1].score);
  });

  it('returns empty array for empty history', () => {
    expect(buildPulseReport([])).toEqual([]);
  });
});

describe('formatPulseReport', () => {
  it('returns no-data message for empty report', () => {
    expect(formatPulseReport([])).toBe('No pulse data available.');
  });

  it('includes port and score in output', () => {
    const report = [{ port: 3000, score: 0.9, count: 9, process: 'node' }];
    const out = formatPulseReport(report);
    expect(out).toContain('3000');
    expect(out).toContain('0.9');
    expect(out).toContain('node');
  });

  it('uses dash for missing process', () => {
    const report = [{ port: 4000, score: 0.5, count: 5, process: null }];
    expect(formatPulseReport(report)).toContain('-');
  });
});
