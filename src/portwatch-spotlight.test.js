const { buildSpotlightIndex, spotlightPort, topSpotlightPorts, formatSpotlight } = require('./portwatch-spotlight');

const makeHistory = (entries) => entries;

const h = makeHistory([
  { timestamp: 1000, ports: [{ port: 3000, protocol: 'tcp', process: 'node' }, { port: 5432, protocol: 'tcp', process: 'postgres' }] },
  { timestamp: 2000, ports: [{ port: 3000, protocol: 'tcp', process: 'node' }, { port: 8080, protocol: 'tcp', process: 'nginx' }] },
  { timestamp: 3000, ports: [{ port: 3000, protocol: 'tcp', process: 'node' }] },
]);

describe('buildSpotlightIndex', () => {
  it('counts occurrences per port', () => {
    const idx = buildSpotlightIndex(h);
    const p3000 = idx.find(e => e.port === 3000);
    expect(p3000.seenCount).toBe(3);
  });

  it('collects unique processes', () => {
    const idx = buildSpotlightIndex(h);
    const p3000 = idx.find(e => e.port === 3000);
    expect(p3000.processes).toEqual(['node']);
  });

  it('tracks firstSeen and lastSeen', () => {
    const idx = buildSpotlightIndex(h);
    const p3000 = idx.find(e => e.port === 3000);
    expect(p3000.firstSeen).toBe(1000);
    expect(p3000.lastSeen).toBe(3000);
  });

  it('returns empty array for empty history', () => {
    expect(buildSpotlightIndex([])).toEqual([]);
  });
});

describe('spotlightPort', () => {
  it('returns entry for known port', () => {
    const result = spotlightPort(3000, h);
    expect(result).not.toBeNull();
    expect(result.port).toBe(3000);
  });

  it('returns null for unknown port', () => {
    expect(spotlightPort(9999, h)).toBeNull();
  });
});

describe('topSpotlightPorts', () => {
  it('returns top n ports by seenCount', () => {
    const top = topSpotlightPorts(h, 2);
    expect(top.length).toBe(2);
    expect(top[0].port).toBe(3000);
  });

  it('respects n limit', () => {
    const top = topSpotlightPorts(h, 1);
    expect(top.length).toBe(1);
  });
});

describe('formatSpotlight', () => {
  it('returns a formatted string', () => {
    const entry = { port: 3000, protocol: 'tcp', seenCount: 3, processes: ['node'], firstSeen: 1000, lastSeen: 3000 };
    const out = formatSpotlight(entry);
    expect(out).toContain('3000/tcp');
    expect(out).toContain('Seen: 3');
    expect(out).toContain('node');
  });
});
