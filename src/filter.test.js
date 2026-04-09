const {
  filterByRange,
  filterByProtocol,
  filterByProcess,
  applyFilters,
} = require('./filter');

const SAMPLE_PORTS = [
  { port: 80,   protocol: 'tcp', pid: '123', process: 'nginx' },
  { port: 443,  protocol: 'tcp', pid: '124', process: 'nginx' },
  { port: 3000, protocol: 'tcp', pid: '200', process: 'node' },
  { port: 5353, protocol: 'udp', pid: '301', process: 'mdnsresponder' },
  { port: 8080, protocol: 'tcp', pid: '202', process: 'node' },
];

describe('filterByRange', () => {
  test('returns all ports when no bounds given', () => {
    expect(filterByRange(SAMPLE_PORTS, null, null)).toHaveLength(5);
  });

  test('filters by min port', () => {
    const result = filterByRange(SAMPLE_PORTS, 3000, null);
    expect(result.map((e) => e.port)).toEqual([3000, 5353, 8080]);
  });

  test('filters by max port', () => {
    const result = filterByRange(SAMPLE_PORTS, null, 443);
    expect(result.map((e) => e.port)).toEqual([80, 443]);
  });

  test('filters by both min and max', () => {
    const result = filterByRange(SAMPLE_PORTS, 443, 5353);
    expect(result.map((e) => e.port)).toEqual([443, 3000, 5353]);
  });
});

describe('filterByProtocol', () => {
  test('returns all when no protocol given', () => {
    expect(filterByProtocol(SAMPLE_PORTS, '')).toHaveLength(5);
  });

  test('filters udp entries', () => {
    const result = filterByProtocol(SAMPLE_PORTS, 'udp');
    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(5353);
  });

  test('is case-insensitive', () => {
    expect(filterByProtocol(SAMPLE_PORTS, 'TCP')).toHaveLength(4);
  });
});

describe('filterByProcess', () => {
  test('returns all when no process name given', () => {
    expect(filterByProcess(SAMPLE_PORTS, '')).toHaveLength(5);
  });

  test('matches substring case-insensitively', () => {
    const result = filterByProcess(SAMPLE_PORTS, 'Node');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.port)).toEqual([3000, 8080]);
  });
});

describe('applyFilters', () => {
  test('combines all filters', () => {
    const result = applyFilters(SAMPLE_PORTS, {
      minPort: 80,
      maxPort: 8080,
      protocol: 'tcp',
      process: 'node',
    });
    expect(result.map((e) => e.port)).toEqual([3000, 8080]);
  });

  test('returns all ports with empty opts', () => {
    expect(applyFilters(SAMPLE_PORTS, {})).toHaveLength(5);
  });
});
