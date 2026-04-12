const { parseQuery, queryPorts, matchesQuery } = require('./portquery');

const sampleEntries = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' },
  { port: 8080, protocol: 'tcp', process: 'nginx' },
  { port: 53,   protocol: 'udp', process: 'dnsmasq' },
];

describe('parseQuery', () => {
  test('parses port', () => {
    expect(parseQuery('port=3000')).toEqual({ port: 3000 });
  });

  test('parses protocol', () => {
    expect(parseQuery('proto=udp')).toEqual({ protocol: 'udp' });
  });

  test('parses process', () => {
    expect(parseQuery('process=node')).toEqual({ process: 'node' });
  });

  test('parses range', () => {
    expect(parseQuery('range=3000-9000')).toEqual({ range: [3000, 9000] });
  });

  test('parses multiple tokens', () => {
    const result = parseQuery('proto=tcp process=node');
    expect(result).toMatchObject({ protocol: 'tcp', process: 'node' });
  });

  test('returns empty object for empty string', () => {
    expect(parseQuery('')).toEqual({});
  });

  test('ignores unknown keys', () => {
    expect(parseQuery('foo=bar')).toEqual({});
  });
});

describe('queryPorts', () => {
  test('filters by protocol', () => {
    const res = queryPorts(sampleEntries, 'proto=udp');
    expect(res).toHaveLength(1);
    expect(res[0].process).toBe('dnsmasq');
  });

  test('filters by process', () => {
    const res = queryPorts(sampleEntries, 'process=node');
    expect(res).toHaveLength(1);
    expect(res[0].port).toBe(3000);
  });

  test('filters by port', () => {
    const res = queryPorts(sampleEntries, 'port=5432');
    expect(res).toHaveLength(1);
    expect(res[0].process).toBe('postgres');
  });

  test('returns empty for no match', () => {
    expect(queryPorts(sampleEntries, 'port=9999')).toHaveLength(0);
  });

  test('handles non-array input', () => {
    expect(queryPorts(null, 'proto=tcp')).toEqual([]);
  });
});

describe('matchesQuery', () => {
  test('returns true when entry matches', () => {
    const entry = { port: 3000, protocol: 'tcp', process: 'node' };
    expect(matchesQuery(entry, 'proto=tcp')).toBe(true);
  });

  test('returns false when entry does not match', () => {
    const entry = { port: 3000, protocol: 'tcp', process: 'node' };
    expect(matchesQuery(entry, 'proto=udp')).toBe(false);
  });
});
