const { scoreEntry, rankPorts, topRankedPort, buildRankMap } = require('./portrank');

const now = Date.now();

const makeEntry = (port, process = 'node', timestamp = now) => ({ port, process, timestamp });

describe('scoreEntry', () => {
  it('returns higher score for frequently seen port', () => {
    const freqMap = { 3000: 10, 4000: 1 };
    const a = scoreEntry(makeEntry(3000), freqMap, now);
    const b = scoreEntry(makeEntry(4000), freqMap, now);
    expect(a).toBeGreaterThan(b);
  });

  it('returns lower score for older entries', () => {
    const freqMap = { 3000: 5 };
    const recent = scoreEntry(makeEntry(3000, 'node', now), freqMap, now);
    const old = scoreEntry(makeEntry(3000, 'node', now - 1000 * 60 * 60 * 12), freqMap, now);
    expect(recent).toBeGreaterThan(old);
  });

  it('handles missing frequency gracefully', () => {
    const score = scoreEntry(makeEntry(9999), {}, now);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('rankPorts', () => {
  it('sorts entries by descending score', () => {
    const entries = [
      makeEntry(4000, 'python', now - 1000 * 60 * 30),
      makeEntry(3000, 'node', now),
      makeEntry(8080, 'java', now - 1000 * 60 * 60 * 5)
    ];
    const history = [[makeEntry(3000), makeEntry(3000), makeEntry(4000)]];
    const ranked = rankPorts(entries, history);
    expect(ranked[0].port).toBe(3000);
    expect(ranked.every(e => typeof e.score === 'number')).toBe(true);
  });

  it('respects topN option', () => {
    const entries = [makeEntry(3000), makeEntry(4000), makeEntry(5000)];
    const ranked = rankPorts(entries, [], { topN: 2 });
    expect(ranked).toHaveLength(2);
  });

  it('works with empty history', () => {
    const entries = [makeEntry(3000), makeEntry(4000)];
    const ranked = rankPorts(entries);
    expect(ranked).toHaveLength(2);
  });
});

describe('topRankedPort', () => {
  it('returns the port number with highest score', () => {
    const entries = [makeEntry(3000, 'node', now), makeEntry(9999, 'unknown', now - 1000 * 60 * 60 * 20)];
    const top = topRankedPort(entries, []);
    expect(top).toBe(3000);
  });

  it('returns null for empty entries', () => {
    expect(topRankedPort([])).toBeNull();
  });
});

describe('buildRankMap', () => {
  it('maps each port to its 1-indexed rank', () => {
    const entries = [makeEntry(3000), makeEntry(4000), makeEntry(5000)];
    const map = buildRankMap(entries);
    const ranks = Object.values(map);
    expect(ranks).toContain(1);
    expect(ranks).toContain(2);
    expect(ranks).toContain(3);
  });

  it('returns empty map for empty entries', () => {
    expect(buildRankMap([])).toEqual({});
  });
});
