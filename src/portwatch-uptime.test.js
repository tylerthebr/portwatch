const {
  buildSeenMap,
  calcUptimeRatio,
  buildUptimeReport,
  formatUptimeReport
} = require('./portwatch-uptime');

const NOW = new Date('2024-06-01T12:00:00Z').getTime();
const DAY = 86400000;

function makeHistory(ports, offsets) {
  return offsets.map(offset => ({
    timestamp: new Date(NOW - offset).toISOString(),
    ports
  }));
}

describe('buildSeenMap', () => {
  it('maps port/protocol keys to timestamp arrays', () => {
    const history = makeHistory([{ port: 3000, protocol: 'tcp' }], [0, DAY, 2 * DAY]);
    const map = buildSeenMap(history);
    expect(map['3000/tcp']).toHaveLength(3);
  });

  it('handles multiple ports in one snapshot', () => {
    const history = [{
      timestamp: new Date(NOW).toISOString(),
      ports: [{ port: 3000, protocol: 'tcp' }, { port: 5432, protocol: 'tcp' }]
    }];
    const map = buildSeenMap(history);
    expect(Object.keys(map)).toHaveLength(2);
  });

  it('returns empty map for empty history', () => {
    expect(buildSeenMap([])).toEqual({});
  });
});

describe('calcUptimeRatio', () => {
  it('returns 0 for empty timestamps', () => {
    expect(calcUptimeRatio([], 7 * DAY, NOW)).toBe(0);
  });

  it('returns 0 when all timestamps are outside window', () => {
    const old = [NOW - 30 * DAY];
    expect(calcUptimeRatio(old, 7 * DAY, NOW)).toBe(0);
  });

  it('returns a ratio between 0 and 1 for valid data', () => {
    const timestamps = Array.from({ length: 12 }, (_, i) => NOW - i * 3600000);
    const ratio = calcUptimeRatio(timestamps, 7 * DAY, NOW);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });
});

describe('buildUptimeReport', () => {
  it('returns sorted report with uptime fields', () => {
    const history = makeHistory([{ port: 8080, protocol: 'tcp' }], [0, DAY, 2 * DAY]);
    const report = buildUptimeReport(history, 7, NOW);
    expect(report).toHaveLength(1);
    expect(report[0]).toMatchObject({
      port: 8080,
      protocol: 'tcp',
      occurrences: 3
    });
    expect(typeof report[0].uptimePercent).toBe('number');
    expect(report[0].firstSeen).toBeDefined();
  });

  it('returns empty array for empty history', () => {
    expect(buildUptimeReport([], 7, NOW)).toEqual([]);
  });

  it('sorts by uptimeRatio descending', () => {
    const h1 = makeHistory([{ port: 3000, protocol: 'tcp' }], [0, DAY]);
    const h2 = makeHistory([{ port: 4000, protocol: 'tcp' }], [0]);
    const combined = [...h1, ...h2];
    const report = buildUptimeReport(combined, 7, NOW);
    expect(report[0].uptimeRatio).toBeGreaterThanOrEqual(report[1]?.uptimeRatio ?? 0);
  });
});

describe('formatUptimeReport', () => {
  it('returns a string with header', () => {
    const report = [{ port: 3000, protocol: 'tcp', uptimePercent: 80, occurrences: 5 }];
    const out = formatUptimeReport(report);
    expect(out).toContain('Uptime Report');
    expect(out).toContain('3000/tcp');
    expect(out).toContain('80%');
  });

  it('returns no data message for empty report', () => {
    expect(formatUptimeReport([])).toMatch(/no uptime data/i);
  });
});
