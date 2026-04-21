const {
  calcDriftScore,
  classifyDrift,
  buildBaselineDriftReport,
  formatBaselineDriftReport
} = require('./portwatch-baseline-drift');

jest.mock('./baseline');
jest.mock('./snapshot');

const { loadBaseline } = require('./baseline');
const { diffSnapshots } = require('./snapshot');

const makeEntry = (port, proto = 'tcp', process = 'node') => ({ port, proto, process });

describe('calcDriftScore', () => {
  it('returns 0 for empty diff', () => {
    expect(calcDriftScore({ added: [], removed: [], changed: [] })).toBe(0);
  });

  it('weights removed heavier than added', () => {
    const score = calcDriftScore({ added: [makeEntry(3000)], removed: [makeEntry(4000)], changed: [] });
    expect(score).toBe(5); // 2 + 3
  });

  it('counts changed entries', () => {
    expect(calcDriftScore({ added: [], removed: [], changed: [makeEntry(8080)] })).toBe(1);
  });
});

describe('classifyDrift', () => {
  it('returns none for 0', () => expect(classifyDrift(0)).toBe('none'));
  it('returns low for score <= 5', () => expect(classifyDrift(4)).toBe('low'));
  it('returns moderate for score <= 15', () => expect(classifyDrift(10)).toBe('moderate'));
  it('returns high for score > 15', () => expect(classifyDrift(20)).toBe('high'));
});

describe('buildBaselineDriftReport', () => {
  it('returns error if no baseline found', () => {
    loadBaseline.mockReturnValue(null);
    const report = buildBaselineDriftReport([], 'missing');
    expect(report.error).toMatch(/missing/);
  });

  it('builds report from diff', () => {
    loadBaseline.mockReturnValue([makeEntry(3000)]);
    diffSnapshots.mockReturnValue({
      added: [makeEntry(4000)],
      removed: [],
      changed: []
    });
    const report = buildBaselineDriftReport([makeEntry(4000)], 'default');
    expect(report.score).toBe(2);
    expect(report.level).toBe('low');
    expect(report.added).toHaveLength(1);
  });
});

describe('formatBaselineDriftReport', () => {
  it('formats error report', () => {
    const out = formatBaselineDriftReport({ error: 'No baseline found: x' });
    expect(out).toContain('Error');
  });

  it('formats full report', () => {
    const report = {
      baselineName: 'default',
      score: 5,
      level: 'low',
      added: [makeEntry(9000)],
      removed: [],
      changed: [],
      timestamp: '2024-01-01T00:00:00.000Z'
    };
    const out = formatBaselineDriftReport(report);
    expect(out).toContain('Drift Score');
    expect(out).toContain('9000');
  });
});
