const { filterByWindow, buildDigest, formatDigest } = require('./portwatch-digest');

const now = Date.now();

function makeEntry(offsetMs, ports = [], opened = [], closed = []) {
  return {
    timestamp: new Date(now - offsetMs).toISOString(),
    ports: ports.map(p => ({ port: p, protocol: 'tcp', process: 'node' })),
    opened,
    closed,
  };
}

const HOUR = 60 * 60 * 1000;

describe('filterByWindow', () => {
  it('keeps entries within the window', () => {
    const entries = [
      makeEntry(30 * 60 * 1000),  // 30 min ago — inside
      makeEntry(90 * 60 * 1000),  // 90 min ago — outside
    ];
    const result = filterByWindow(entries, HOUR);
    expect(result).toHaveLength(1);
  });

  it('returns all entries if all are within window', () => {
    const entries = [makeEntry(1000), makeEntry(5000)];
    expect(filterByWindow(entries, HOUR)).toHaveLength(2);
  });

  it('returns empty array if no entries in window', () => {
    const entries = [makeEntry(2 * HOUR)];
    expect(filterByWindow(entries, HOUR)).toHaveLength(0);
  });
});

describe('buildDigest', () => {
  it('returns empty digest when no recent entries', () => {
    const result = buildDigest([makeEntry(2 * HOUR)], HOUR);
    expect(result.empty).toBe(true);
  });

  it('counts unique ports correctly', () => {
    const entries = [
      makeEntry(1000, [3000, 3001]),
      makeEntry(2000, [3000, 4000]),
    ];
    const result = buildDigest(entries, HOUR);
    expect(result.empty).toBe(false);
    expect(result.uniquePorts).toBe(3);
  });

  it('counts opened and closed ports', () => {
    const entries = [
      makeEntry(1000, [], [3000, 3001], [4000]),
      makeEntry(2000, [], [5000], []),
    ];
    const result = buildDigest(entries, HOUR);
    expect(result.totalOpened).toBe(3);
    expect(result.totalClosed).toBe(1);
  });

  it('includes snapshotCount', () => {
    const entries = [makeEntry(1000), makeEntry(2000), makeEntry(3000)];
    const result = buildDigest(entries, HOUR);
    expect(result.snapshotCount).toBe(3);
  });
});

describe('formatDigest', () => {
  it('returns empty message for empty digest', () => {
    const out = formatDigest({ empty: true, window: HOUR });
    expect(out).toMatch(/No activity/);
  });

  it('formats a non-empty digest with headers', () => {
    const digest = buildDigest([
      makeEntry(1000, [3000, 8080], [3000], []),
    ], HOUR);
    const out = formatDigest(digest);
    expect(out).toMatch(/Digest/);
    expect(out).toMatch(/Snapshots/);
    expect(out).toMatch(/Unique ports/);
  });
});
