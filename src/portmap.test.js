const { buildPortMap, flattenPortMap, getPortEntry, getWatchedEntries } = require('./portmap');

jest.mock('./watchlist', () => ({ loadWatchlist: () => [3000, 8080] }));
jest.mock('./tags', () => ({ getTags: () => ({ 3000: 'dev', 8080: ['web', 'proxy'] }) }));
jest.mock('./portlabel', () => ({ getLabelForPort: (p) => p === 80 ? 'HTTP' : null }));
jest.mock('./profile', () => ({ getProfile: () => ({ ports: [3000] }) }));

const entries = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 8080, protocol: 'tcp', process: 'nginx' },
  { port: 80,   protocol: 'tcp', process: 'apache' },
];

describe('buildPortMap', () => {
  test('keys map by port number', () => {
    const map = buildPortMap(entries);
    expect(Object.keys(map).map(Number)).toEqual(expect.arrayContaining([3000, 8080, 80]));
  });

  test('attaches tags correctly', () => {
    const map = buildPortMap(entries);
    expect(map[3000].tags).toEqual(['dev']);
    expect(map[8080].tags).toEqual(['web', 'proxy']);
    expect(map[80].tags).toEqual([]);
  });

  test('marks watched ports', () => {
    const map = buildPortMap(entries);
    expect(map[3000].watched).toBe(true);
    expect(map[8080].watched).toBe(true);
    expect(map[80].watched).toBe(false);
  });

  test('uses well-known label when available', () => {
    const map = buildPortMap(entries);
    expect(map[80].label).toBe('HTTP');
    expect(map[3000].label).toBe('node');
  });

  test('marks profile match', () => {
    const map = buildPortMap(entries, 'myprofile');
    expect(map[3000].profileMatch).toBe(true);
    expect(map[8080].profileMatch).toBe(false);
  });
});

describe('flattenPortMap', () => {
  test('returns sorted array', () => {
    const map = buildPortMap(entries);
    const flat = flattenPortMap(map);
    expect(flat.map(e => e.port)).toEqual([80, 3000, 8080]);
  });
});

describe('getPortEntry', () => {
  test('returns entry for known port', () => {
    const map = buildPortMap(entries);
    expect(getPortEntry(map, 3000)).toMatchObject({ port: 3000 });
  });

  test('returns null for unknown port', () => {
    const map = buildPortMap(entries);
    expect(getPortEntry(map, 9999)).toBeNull();
  });
});

describe('getWatchedEntries', () => {
  test('returns only watched entries', () => {
    const map = buildPortMap(entries);
    const watched = getWatchedEntries(map);
    expect(watched.map(e => e.port)).toEqual(expect.arrayContaining([3000, 8080]));
    expect(watched.find(e => e.port === 80)).toBeUndefined();
  });
});
