const { buildLastSeenMap, getStaleEntries, formatStaleEntry, buildStaleReport } = require('./portwatch-stale');

const now = Date.now();
const old = new Date(now - 48 * 60 * 60 * 1000).toISOString();
const recent = new Date(now - 10 * 60 * 1000).toISOString();

function makeHistory(entries) {
  return entries.map(([timestamp, ports]) => ({ timestamp, ports }));
}

const history = makeHistory([
  [old,    [{ port: 3000, proto: 'tcp', process: 'node' }]],
  [recent, [{ port: 5432, proto: 'tcp', process: 'postgres' }]],
  [old,    [{ port: 8080, proto: 'tcp', process: 'python' }]]
]);

describe('buildLastSeenMap', () => {
  it('returns a map keyed by port/proto', () => {
    const map = buildLastSeenMap(history);
    expect(map).toHaveProperty('3000/tcp');
    expect(map).toHaveProperty('5432/tcp');
    expect(map).toHaveProperty('8080/tcp');
  });

  it('keeps the most recent timestamp for duplicate ports', () => {
    const h = makeHistory([
      [old,    [{ port: 3000, proto: 'tcp' }]],
      [recent, [{ port: 3000, proto: 'tcp' }]]
    ]);
    const map = buildLastSeenMap(h);
    expect(new Date(map['3000/tcp'].ts).toISOString()).toBe(recent);
  });
});

describe('getStaleEntries', () => {
  it('returns ports not seen within threshold', () => {
    const stale = getStaleEntries(history, 24 * 60 * 60 * 1000);
    const keys = stale.map(e => e.key);
    expect(keys).toContain('3000/tcp');
    expect(keys).toContain('8080/tcp');
    expect(keys).not.toContain('5432/tcp');
  });

  it('returns empty array if nothing is stale', () => {
    const fresh = makeHistory([[recent, [{ port: 9000, proto: 'tcp' }]]]);
    expect(getStaleEntries(fresh, 24 * 60 * 60 * 1000)).toHaveLength(0);
  });
});

describe('formatStaleEntry', () => {
  it('includes port key and process name', () => {
    const entry = { key: '3000/tcp', lastSeenAt: old, port: { process: 'node' } };
    const out = formatStaleEntry(entry);
    expect(out).toContain('3000/tcp');
    expect(out).toContain('node');
    expect(out).toContain(old);
  });

  it('omits process label when not present', () => {
    const entry = { key: '8080/tcp', lastSeenAt: old, port: {} };
    expect(formatStaleEntry(entry)).not.toContain('(');
  });
});

describe('buildStaleReport', () => {
  it('returns count and entries', () => {
    const report = buildStaleReport(history);
    expect(report.count).toBe(2);
    expect(report.entries).toHaveLength(2);
    expect(report).toHaveProperty('generatedAt');
  });
});
