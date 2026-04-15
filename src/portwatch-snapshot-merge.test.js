const {
  mergeSnapshots,
  buildMergeReport,
  formatMergeReport
} = require('./portwatch-snapshot-merge');

const snap1 = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' }
];

const snap2 = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 8080, protocol: 'tcp', process: 'nginx' }
];

const snap3 = [
  { port: 8080, protocol: 'tcp', process: 'nginx' },
  { port: 9200, protocol: 'tcp', process: 'elasticsearch' }
];

describe('mergeSnapshots', () => {
  test('deduplicates identical port/protocol pairs', () => {
    const result = mergeSnapshots([snap1, snap2]);
    const ports = result.map(e => e.port);
    expect(ports).toEqual([3000, 5432, 8080]);
  });

  test('tracks sources count correctly', () => {
    const result = mergeSnapshots([snap1, snap2]);
    const entry3000 = result.find(e => e.port === 3000);
    const entry5432 = result.find(e => e.port === 5432);
    expect(entry3000.sources).toBe(2);
    expect(entry5432.sources).toBe(1);
  });

  test('merges three snapshots', () => {
    const result = mergeSnapshots([snap1, snap2, snap3]);
    expect(result.length).toBe(4);
  });

  test('returns empty array for empty input', () => {
    expect(mergeSnapshots([])).toEqual([]);
  });

  test('preserves process name from first occurrence', () => {
    const a = [{ port: 4000, protocol: 'tcp', process: 'myapp' }];
    const b = [{ port: 4000, protocol: 'tcp', process: null }];
    const result = mergeSnapshots([a, b]);
    expect(result[0].process).toBe('myapp');
  });

  test('fills missing process name from later snapshot', () => {
    const a = [{ port: 4000, protocol: 'tcp', process: null }];
    const b = [{ port: 4000, protocol: 'tcp', process: 'myapp' }];
    const result = mergeSnapshots([a, b]);
    expect(result[0].process).toBe('myapp');
  });
});

describe('buildMergeReport', () => {
  test('counts total, shared, and unique ports', () => {
    const merged = mergeSnapshots([snap1, snap2]);
    const report = buildMergeReport(merged, 2);
    expect(report.totalPorts).toBe(3);
    expect(report.sharedPorts).toBe(1);
    expect(report.uniquePorts).toBe(2);
    expect(report.sourceSnapshots).toBe(2);
  });

  test('entries array is included', () => {
    const merged = mergeSnapshots([snap1]);
    const report = buildMergeReport(merged, 1);
    expect(Array.isArray(report.entries)).toBe(true);
  });
});

describe('formatMergeReport', () => {
  test('returns a non-empty string', () => {
    const merged = mergeSnapshots([snap1, snap2]);
    const report = buildMergeReport(merged, 2);
    const output = formatMergeReport(report);
    expect(typeof output).toBe('string');
    expect(output).toContain('Merged 2 snapshot(s)');
    expect(output).toContain('Total ports');
  });
});
