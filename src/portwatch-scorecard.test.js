const {
  buildScorecard,
  scoreToGrade,
  formatScorecard,
  calcStalePenalty,
  calcThresholdPenalty,
  calcLockBonus
} = require('./portwatch-scorecard');

jest.mock('./portmetrics', () => ({
  buildMetricsReport: () => ({ totalEntries: 3 })
}));
jest.mock('./portwatch-stale', () => ({
  getStaleEntries: (_h, _ms) => [{ port: 3000 }]
}));
jest.mock('./portlock', () => ({
  loadLocks: () => [{ port: 3000 }, { port: 4000 }]
}));
jest.mock('./portwatch-threshold', () => ({
  loadThresholds: () => [],
  checkThresholds: () => []
}));

const makeHistory = (ports = []) => [{ ports, timestamp: Date.now() }];

describe('scoreToGrade', () => {
  it('returns A for 95', () => expect(scoreToGrade(95)).toBe('A'));
  it('returns B for 80', () => expect(scoreToGrade(80)).toBe('B'));
  it('returns C for 65', () => expect(scoreToGrade(65)).toBe('C'));
  it('returns D for 50', () => expect(scoreToGrade(50)).toBe('D'));
  it('returns F for 30', () => expect(scoreToGrade(30)).toBe('F'));
});

describe('calcStalePenalty', () => {
  it('returns 0 when no total', () => expect(calcStalePenalty([], 0)).toBe(0));
  it('returns 30 when all stale', () => {
    expect(calcStalePenalty([{}, {}], 2)).toBe(30);
  });
  it('returns 15 when half stale', () => {
    expect(calcStalePenalty([{}], 2)).toBe(15);
  });
});

describe('calcThresholdPenalty', () => {
  it('returns 0 with no violations', () => expect(calcThresholdPenalty([])).toBe(0));
  it('returns 10 per violation up to 40', () => {
    expect(calcThresholdPenalty([1, 2, 3])).toBe(30);
    expect(calcThresholdPenalty([1, 2, 3, 4, 5])).toBe(40);
  });
});

describe('calcLockBonus', () => {
  it('returns 0 with no entries', () => expect(calcLockBonus([], [])).toBe(0));
  it('returns bonus proportional to coverage', () => {
    const locks = [{ port: 3000 }];
    const entries = [{ port: 3000 }, { port: 4000 }];
    expect(calcLockBonus(locks, entries)).toBe(5);
  });
});

describe('buildScorecard', () => {
  it('returns a scorecard object with score and grade', () => {
    const history = makeHistory([{ port: 3000 }, { port: 4000 }, { port: 5000 }]);
    const result = buildScorecard(history);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('totalPorts');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('formatScorecard', () => {
  it('includes score and grade in output', () => {
    const sc = { score: 82, grade: 'B', totalPorts: 5, stalePorts: 1, violations: 0, lockedPorts: 2, breakdown: { stalePenalty: 6, thresholdPenalty: 0, lockBonus: 4 } };
    const out = formatScorecard(sc);
    expect(out).toContain('82');
    expect(out).toContain('B');
    expect(out).toContain('Total ports');
  });
});
