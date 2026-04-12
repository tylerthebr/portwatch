// portquery integration test — exercises query pipeline end-to-end

const { parseQuery, queryPorts, lookupPort, matchesQuery } = require('./portquery');
const { buildPortMap } = require('./portmap');

const entries = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 3001, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' },
  { port: 6379, protocol: 'tcp', process: 'redis' },
  { port: 53,   protocol: 'udp', process: 'dnsmasq' },
  { port: 123,  protocol: 'udp', process: 'ntpd' },
];

describe('portquery integration', () => {
  test('full pipeline: parse + query by range and proto', () => {
    const q = parseQuery('proto=tcp range=3000-4000');
    expect(q).toMatchObject({ protocol: 'tcp', range: [3000, 4000] });

    const results = queryPorts(entries, 'proto=tcp range=3000-4000');
    expect(results.every(e => e.protocol === 'tcp')).toBe(true);
    expect(results.every(e => e.port >= 3000 && e.port <= 4000)).toBe(true);
    expect(results).toHaveLength(2);
  });

  test('lookup by port using portmap', () => {
    const portMap = buildPortMap(entries);
    const entry = lookupPort(portMap, 6379);
    expect(entry).toBeDefined();
    expect(entry.process).toBe('redis');
  });

  test('lookup returns null for unknown port', () => {
    const portMap = buildPortMap(entries);
    expect(lookupPort(portMap, 9999)).toBeNull();
  });

  test('matchesQuery works across multiple entries', () => {
    const nodeEntries = entries.filter(e => matchesQuery(e, 'process=node'));
    expect(nodeEntries).toHaveLength(2);
  });

  test('query with only process filter', () => {
    const results = queryPorts(entries, 'process=postgres');
    expect(results).toHaveLength(1);
    expect(results[0].port).toBe(5432);
  });

  test('query udp entries', () => {
    const results = queryPorts(entries, 'proto=udp');
    expect(results).toHaveLength(2);
    expect(results.map(e => e.process).sort()).toEqual(['dnsmasq', 'ntpd']);
  });
});
