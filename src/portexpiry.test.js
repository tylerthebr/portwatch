const {
  buildLastSeenMap,
  getStaleEntries,
  formatStaleEntry,
  DEFAULT_TTL_MS,
} = require('./portexpiry');

const now = Date.now();
const oneHourAgo = now - DEFAULT_TTL_MS - 1;
const tenMinsAgo = now - 1000 * 60 * 10;

const fakeHistory = [
  {
    timestamp: new Date(oneHourAgo).toISOString(),
    ports: [
      { port: 3000, protocol: 'tcp' },
      { port: 5432, protocol: 'tcp' },
    ],
  },
  {
    timestamp: new Date(tenMinsAgo).toISOString(),
    ports: [
      { port: 3000, protocol: 'tcp' }, // updated recently
      { port: 8080, protocol: 'tcp' },
    ],
  },
];

describe('buildLastSeenMap', () => {
  it('returns the most recent timestamp per port/protocol', () => {
    const map = buildLastSeenMap(fakeHistory);
    expect(map['3000/tcp']).toBeCloseTo(tenMinsAgo, -2);
    expect(map['5432/tcp']).toBeCloseTo(oneHourAgo, -2);
    expect(map['8080/tcp']).toBeCloseTo(tenMinsAgo, -2);
  });

  it('returns empty map for empty history', () => {
    expect(buildLastSeenMap([])).toEqual({});
  });

  it('skips entries without ports', () => {
    const map = buildLastSeenMap([{ timestamp: new Date().toISOString() }]);
    expect(Object.keys(map)).toHaveLength(0);
  });
});

describe('getStaleEntries', () => {
  it('flags ports older than TTL', () => {
    const map = buildLastSeenMap(fakeHistory);
    const stale = getStaleEntries(map, DEFAULT_TTL_MS, now);
    const keys = stale.map(e => `${e.port}/${e.protocol}`);
    expect(keys).toContain('5432/tcp');
    expect(keys).not.toContain('3000/tcp');
    expect(keys).not.toContain('8080/tcp');
  });

  it('returns entries sorted by age descending', () => {
    const map = { '9000/tcp': now - 5000, '9001/tcp': now - 10000 };
    const stale = getStaleEntries(map, 1000, now);
    expect(stale[0].port).toBe(9001);
  });

  it('returns empty array when nothing is stale', () => {
    const map = { '3000/tcp': now - 100 };
    expect(getStaleEntries(map, DEFAULT_TTL_MS, now)).toHaveLength(0);
  });
});

describe('formatStaleEntry', () => {
  it('includes port, protocol, and age', () => {
    const entry = {
      port: 5432,
      protocol: 'tcp',
      lastSeenAt: new Date(oneHourAgo).toISOString(),
      ageMs: DEFAULT_TTL_MS + 5000,
    };
    const out = formatStaleEntry(entry);
    expect(out).toContain('5432/tcp');
    expect(out).toContain('ago');
  });
});
