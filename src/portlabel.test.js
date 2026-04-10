const { getLabelForPort, annotateEntry, annotateEntries, getWellKnownMap } = require('./portlabel');

describe('getLabelForPort', () => {
  test('returns label for well-known port number', () => {
    expect(getLabelForPort(80)).toBe('HTTP');
    expect(getLabelForPort(443)).toBe('HTTPS');
    expect(getLabelForPort(5432)).toBe('PostgreSQL');
  });

  test('accepts port as string', () => {
    expect(getLabelForPort('3306')).toBe('MySQL');
    expect(getLabelForPort('6379')).toBe('Redis');
  });

  test('returns null for unknown port', () => {
    expect(getLabelForPort(9999)).toBeNull();
    expect(getLabelForPort(12345)).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(getLabelForPort('abc')).toBeNull();
    expect(getLabelForPort(null)).toBeNull();
    expect(getLabelForPort(undefined)).toBeNull();
  });
});

describe('annotateEntry', () => {
  test('adds label field for known port', () => {
    const entry = { port: 27017, protocol: 'tcp', process: 'mongod' };
    const result = annotateEntry(entry);
    expect(result.label).toBe('MongoDB');
    expect(result.port).toBe(27017);
    expect(result.process).toBe('mongod');
  });

  test('sets label to null for unknown port', () => {
    const entry = { port: 54321, protocol: 'tcp', process: 'myapp' };
    const result = annotateEntry(entry);
    expect(result.label).toBeNull();
  });

  test('does not mutate original entry', () => {
    const entry = { port: 80, protocol: 'tcp' };
    const result = annotateEntry(entry);
    expect(entry.label).toBeUndefined();
    expect(result.label).toBe('HTTP');
  });
});

describe('annotateEntries', () => {
  test('annotates all entries in array', () => {
    const entries = [
      { port: 80, protocol: 'tcp' },
      { port: 9999, protocol: 'udp' },
      { port: 5432, protocol: 'tcp' },
    ];
    const results = annotateEntries(entries);
    expect(results[0].label).toBe('HTTP');
    expect(results[1].label).toBeNull();
    expect(results[2].label).toBe('PostgreSQL');
  });

  test('returns empty array for empty input', () => {
    expect(annotateEntries([])).toEqual([]);
  });
});

describe('getWellKnownMap', () => {
  test('returns an object with port entries', () => {
    const map = getWellKnownMap();
    expect(typeof map).toBe('object');
    expect(map[22]).toBe('SSH');
    expect(map[3306]).toBe('MySQL');
  });

  test('returns a copy, not the original reference', () => {
    const map = getWellKnownMap();
    map[80] = 'TAMPERED';
    expect(getWellKnownMap()[80]).toBe('HTTP');
  });
});
