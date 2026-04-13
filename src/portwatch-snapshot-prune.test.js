const {
  getPruneConfig,
  pruneByAge,
  pruneByCount,
  pruneHistory,
  buildPruneReport,
  formatPruneReport,
} = require('./portwatch-snapshot-prune');

const now = Date.now();
const old = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
const recent = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

function makeEntry(ts) {
  return { timestamp: ts, ports: [] };
}

describe('getPruneConfig', () => {
  it('returns defaults when no config given', () => {
    const cfg = getPruneConfig();
    expect(cfg.maxAgeDays).toBe(30);
    expect(cfg.maxCount).toBe(100);
  });

  it('uses provided values', () => {
    const cfg = getPruneConfig({ maxAgeDays: 7, maxCount: 20 });
    expect(cfg.maxAgeDays).toBe(7);
    expect(cfg.maxCount).toBe(20);
  });
});

describe('pruneByAge', () => {
  it('removes entries older than maxAgeDays', () => {
    const entries = [makeEntry(old), makeEntry(recent)];
    const result = pruneByAge(entries, 30);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(recent);
  });

  it('keeps all if none are old', () => {
    const entries = [makeEntry(recent)];
    expect(pruneByAge(entries, 30)).toHaveLength(1);
  });
});

describe('pruneByCount', () => {
  it('trims to maxCount keeping newest', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(new Date(now - i * 1000).toISOString())
    );
    const result = pruneByCount(entries, 3);
    expect(result).toHaveLength(3);
  });

  it('does nothing if under limit', () => {
    const entries = [makeEntry(recent)];
    expect(pruneByCount(entries, 10)).toHaveLength(1);
  });
});

describe('pruneHistory', () => {
  it('applies both age and count pruning', () => {
    const entries = [makeEntry(old), makeEntry(recent)];
    const result = pruneHistory(entries, { maxAgeDays: 30, maxCount: 50 });
    expect(result).toHaveLength(1);
  });
});

describe('buildPruneReport', () => {
  it('reports correct counts', () => {
    const before = [makeEntry(old), makeEntry(recent)];
    const after = [makeEntry(recent)];
    const report = buildPruneReport(before, after);
    expect(report.before).toBe(2);
    expect(report.after).toBe(1);
    expect(report.removed).toBe(1);
  });
});

describe('formatPruneReport', () => {
  it('returns a readable string', () => {
    const report = { before: 10, after: 7, removed: 3, oldest: recent, newest: recent };
    const out = formatPruneReport(report);
    expect(out).toContain('Removed');
    expect(out).toContain('3');
  });
});
