const {
  parsePattern,
  matchesAny,
  filterByPatterns,
  getNamedSets,
  resolveNamedSet,
} = require('./portmatch');

describe('parsePattern', () => {
  test('matches exact port', () => {
    const match = parsePattern('3000');
    expect(match(3000)).toBe(true);
    expect(match(3001)).toBe(false);
  });

  test('matches port range', () => {
    const match = parsePattern('8000-8080');
    expect(match(8000)).toBe(true);
    expect(match(8080)).toBe(true);
    expect(match(8040)).toBe(true);
    expect(match(7999)).toBe(false);
    expect(match(8081)).toBe(false);
  });

  test('matches wildcard prefix', () => {
    const match = parsePattern('80*');
    expect(match(80)).toBe(true);
    expect(match(8080)).toBe(true);
    expect(match(8000)).toBe(true);
    expect(match(443)).toBe(false);
  });

  test('matches named set "web"', () => {
    const match = parsePattern('web');
    expect(match(80)).toBe(true);
    expect(match(3000)).toBe(true);
    expect(match(9999)).toBe(false);
  });

  test('matches named set "db"', () => {
    const match = parsePattern('db');
    expect(match(5432)).toBe(true);
    expect(match(6379)).toBe(true);
    expect(match(80)).toBe(false);
  });
});

describe('matchesAny', () => {
  test('returns true if port matches any pattern', () => {
    expect(matchesAny(3000, ['3000-3100', '8080'])).toBe(true);
    expect(matchesAny(8080, ['3000-3100', '8080'])).toBe(true);
  });

  test('returns false when no patterns match', () => {
    expect(matchesAny(9999, ['3000', 'web'])).toBe(false);
  });

  test('returns false for empty patterns', () => {
    expect(matchesAny(3000, [])).toBe(false);
  });
});

describe('filterByPatterns', () => {
  const entries = [
    { port: 80, process: 'nginx' },
    { port: 3000, process: 'node' },
    { port: 5432, process: 'postgres' },
    { port: 9200, process: 'elastic' },
  ];

  test('filters entries by pattern list', () => {
    const result = filterByPatterns(entries, ['web', '92*']);
    expect(result.map((e) => e.port)).toEqual([80, 3000, 9200]);
  });

  test('returns all entries when patterns is empty', () => {
    expect(filterByPatterns(entries, [])).toHaveLength(4);
  });
});

describe('getNamedSets', () => {
  test('returns known set names', () => {
    const sets = getNamedSets();
    expect(sets).toContain('web');
    expect(sets).toContain('db');
    expect(sets).toContain('dev');
  });
});

describe('resolveNamedSet', () => {
  test('returns port list for known set', () => {
    expect(resolveNamedSet('web')).toContain(80);
  });

  test('returns null for unknown set', () => {
    expect(resolveNamedSet('unknown')).toBeNull();
  });
});
