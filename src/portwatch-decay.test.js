const { buildLastSeenMap, calcDecayScore, buildDecayReport, formatDecayReport } = require('./portwatch-decay');

const NOW = new Date('2024-06-01T12:00:00Z').getTime();
const H = 1000 * 60 * 60;

function makeHistory(entries) {
  return entries.map(([hoursAgo, ports]) => ({
    timestamp: new Date(NOW - hoursAgo * H).toISOString(),
    ports: ports.map(([port, protocol]) => ({ port, protocol }))
  }));
}

describe('buildLastSeenMap', () => {
  it('returns empty map for empty history', () => {
    expect(buildLastSeenMap([])).toEqual({});
  });

  it('maps each port to its most recent timestamp', () => {
    const history = makeHistory([
      [10, [[3000, 'tcp']]],
      [2, [[3000, 'tcp'], [8080, 'tcp']]]
    ]);
    const map = buildLastSeenMap(history);
    expect(map['3000/tcp']).toBe(NOW - 2 * H);
    expect(map['8080/tcp']).toBe(NOW - 2 * H);
  });

  it('keeps the latest timestamp when port appears multiple times', () => {
    const history = makeHistory([
      [5, [[4000, 'tcp']]],
      [1, [[4000, 'tcp']]]
    ]);
    const map = buildLastSeenMap(history);
    expect(map['4000/tcp']).toBe(NOW - 1 * H);
  });
});

describe('calcDecayScore', () => {
  it('returns 0 for a port seen right now', () => {
    expect(calcDecayScore(NOW, NOW, 24)).toBe(0);
  });

  it('returns 0.5 at half of maxAgeHours', () => {
    expect(calcDecayScore(NOW - 12 * H, NOW, 24)).toBeCloseTo(0.5);
  });

  it('returns 1.0 at or beyond maxAgeHours', () => {
    expect(calcDecayScore(NOW - 24 * H, NOW, 24)).toBe(1);
    expect(calcDecayScore(NOW - 48 * H, NOW, 24)).toBe(1);
  });
});

describe('buildDecayReport', () => {
  it('returns empty array for empty history', () => {
    expect(buildDecayReport([])).toEqual([]);
  });

  it('returns entries sorted by decayScore descending', () => {
    const history = makeHistory([
      [20, [[3000, 'tcp']]],
      [2, [[8080, 'tcp']]]
    ]);
    const report = buildDecayReport(history, { now: NOW, maxAgeHours: 24 });
    expect(report[0].port).toBe(3000);
    expect(report[0].decayScore).toBeGreaterThan(report[1].decayScore);
  });

  it('includes ageHours, decayScore, protocol, lastSeen fields', () => {
    const history = makeHistory([[6, [[5000, 'udp']]]]);
    const [entry] = buildDecayReport(history, { now: NOW, maxAgeHours: 24 });
    expect(entry.port).toBe(5000);
    expect(entry.protocol).toBe('udp');
    expect(entry.ageHours).toBe(6);
    expect(entry.decayScore).toBeCloseTo(0.25);
    expect(entry.lastSeen).toBeDefined();
  });
});

describe('formatDecayReport', () => {
  it('returns a message when no data', () => {
    expect(formatDecayReport([])).toMatch(/No decay/);
  });

  it('includes port numbers and decay bars in output', () => {
    const history = makeHistory([[12, [[3000, 'tcp']]]]);
    const report = buildDecayReport(history, { now: NOW, maxAgeHours: 24 });
    const output = formatDecayReport(report);
    expect(output).toMatch(/3000/);
    expect(output).toMatch(/score=/);
    expect(output).toMatch(/Decay Report/);
  });
});
