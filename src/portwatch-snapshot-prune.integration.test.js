const { pruneHistory, buildPruneReport } = require('./portwatch-snapshot-prune');

const now = Date.now();

function makeEntry(daysAgo) {
  return {
    timestamp: new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    ports: [{ port: 3000, process: 'node' }],
  };
}

describe('portwatch-snapshot-prune integration', () => {
  it('prunes a realistic history set by age and count', () => {
    const history = [
      makeEntry(60),
      makeEntry(45),
      makeEntry(20),
      makeEntry(10),
      makeEntry(2),
    ];

    const pruned = pruneHistory(history, { maxAgeDays: 30, maxCount: 10 });
    expect(pruned).toHaveLength(3);
    pruned.forEach((e) => {
      const age = (now - new Date(e.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      expect(age).toBeLessThan(30);
    });
  });

  it('respects maxCount when all entries are recent', () => {
    const history = Array.from({ length: 10 }, (_, i) => makeEntry(i));
    const pruned = pruneHistory(history, { maxAgeDays: 30, maxCount: 5 });
    expect(pruned).toHaveLength(5);
  });

  it('returns empty array when all entries are stale', () => {
    const history = [makeEntry(90), makeEntry(60)];
    const pruned = pruneHistory(history, { maxAgeDays: 30, maxCount: 100 });
    expect(pruned).toHaveLength(0);
  });

  it('buildPruneReport reflects accurate diff', () => {
    const history = [makeEntry(60), makeEntry(5), makeEntry(1)];
    const pruned = pruneHistory(history, { maxAgeDays: 30, maxCount: 100 });
    const report = buildPruneReport(history, pruned);
    expect(report.before).toBe(3);
    expect(report.after).toBe(2);
    expect(report.removed).toBe(1);
    expect(report.oldest).toBeTruthy();
    expect(report.newest).toBeTruthy();
  });

  it('no-op when history is already within limits', () => {
    const history = [makeEntry(5), makeEntry(3)];
    const pruned = pruneHistory(history, { maxAgeDays: 30, maxCount: 100 });
    expect(pruned).toHaveLength(2);
    const report = buildPruneReport(history, pruned);
    expect(report.removed).toBe(0);
  });
});
