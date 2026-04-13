const {
  groupByField,
  groupByPortRange,
  groupByEnv,
  summarizeGroupBy,
  formatGroupBy,
} = require('./portwatch-groupby');

const entries = [
  { port: 3000, process: 'node', protocol: 'tcp', state: 'LISTEN', env: 'development' },
  { port: 3001, process: 'node', protocol: 'tcp', state: 'LISTEN', env: 'development' },
  { port: 5432, process: 'postgres', protocol: 'tcp', state: 'LISTEN', env: 'production' },
  { port: 6379, process: 'redis', protocol: 'tcp', state: 'LISTEN', env: 'development' },
  { port: 8080, process: 'nginx', protocol: 'tcp', state: 'ESTABLISHED' },
];

describe('groupByField', () => {
  test('groups by process name', () => {
    const result = groupByField(entries, 'process');
    expect(result['node']).toHaveLength(2);
    expect(result['postgres']).toHaveLength(1);
    expect(result['redis']).toHaveLength(1);
  });

  test('uses unknown for missing field', () => {
    const result = groupByField(entries, 'env');
    expect(result['unknown']).toHaveLength(1);
    expect(result['development']).toHaveLength(3);
  });

  test('groups by protocol', () => {
    const result = groupByField(entries, 'protocol');
    expect(result['tcp']).toHaveLength(5);
  });
});

describe('groupByPortRange', () => {
  test('groups into 1000-port buckets by default', () => {
    const result = groupByPortRange(entries);
    expect(result['3000-3999']).toHaveLength(2);
    expect(result['5000-5999']).toHaveLength(1);
    expect(result['6000-6999']).toHaveLength(1);
    expect(result['8000-8999']).toHaveLength(1);
  });

  test('supports custom bucket size', () => {
    const result = groupByPortRange(entries, 5000);
    expect(result['0-4999']).toHaveLength(3);
    expect(result['5000-9999']).toHaveLength(2);
  });
});

describe('groupByEnv', () => {
  test('groups by env annotation', () => {
    const result = groupByEnv(entries);
    expect(result['development']).toHaveLength(3);
    expect(result['production']).toHaveLength(1);
    expect(result['unknown']).toHaveLength(1);
  });
});

describe('summarizeGroupBy', () => {
  test('returns counts per group', () => {
    const grouped = groupByField(entries, 'process');
    const summary = summarizeGroupBy(grouped);
    expect(summary['node']).toBe(2);
    expect(summary['postgres']).toBe(1);
  });
});

describe('formatGroupBy', () => {
  test('formats summary as sorted string', () => {
    const grouped = groupByField(entries, 'process');
    const summary = summarizeGroupBy(grouped);
    const output = formatGroupBy(summary, 'process');
    expect(output).toContain('Port entries by process:');
    expect(output).toContain('node: 2');
    expect(output.indexOf('node: 2')).toBeLessThan(output.indexOf('postgres: 1'));
  });
});
