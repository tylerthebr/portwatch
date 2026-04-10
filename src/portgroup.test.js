const { groupByProcess, groupByRange, groupByTag, summarizeGroups } = require('./portgroup');

jest.mock('./tags', () => ({
  getTag: (port) => {
    const map = { 3000: 'frontend', 5432: 'database' };
    return map[port] || null;
  }
}));

const entries = [
  { port: 3000, process: 'node', protocol: 'tcp' },
  { port: 3001, process: 'node', protocol: 'tcp' },
  { port: 5432, process: 'postgres', protocol: 'tcp' },
  { port: 8080, process: 'python', protocol: 'tcp' },
];

describe('groupByProcess', () => {
  it('groups entries by process name', () => {
    const result = groupByProcess(entries);
    expect(result['node']).toHaveLength(2);
    expect(result['postgres']).toHaveLength(1);
    expect(result['python']).toHaveLength(1);
  });

  it('uses "unknown" for entries without a process', () => {
    const result = groupByProcess([{ port: 9000 }]);
    expect(result['unknown']).toHaveLength(1);
  });
});

describe('groupByRange', () => {
  const ranges = [
    { name: 'dev', from: 3000, to: 3999 },
    { name: 'db', from: 5400, to: 5499 },
  ];

  it('places entries into matching range buckets', () => {
    const result = groupByRange(entries, ranges);
    expect(result['dev']).toHaveLength(2);
    expect(result['db']).toHaveLength(1);
    expect(result['other']).toHaveLength(1);
  });

  it('puts everything in other when no ranges given', () => {
    const result = groupByRange(entries);
    expect(result['other']).toHaveLength(entries.length);
  });
});

describe('groupByTag', () => {
  it('groups tagged ports correctly', () => {
    const result = groupByTag(entries);
    expect(result['frontend']).toHaveLength(1);
    expect(result['database']).toHaveLength(1);
    expect(result['untagged']).toHaveLength(2);
  });
});

describe('summarizeGroups', () => {
  it('returns sorted summary by count desc', () => {
    const grouped = { node: [1, 2], postgres: [1], python: [1, 2, 3] };
    const summary = summarizeGroups(grouped);
    expect(summary[0]).toEqual({ group: 'python', count: 3 });
    expect(summary[1]).toEqual({ group: 'node', count: 2 });
    expect(summary[2]).toEqual({ group: 'postgres', count: 1 });
  });
});
