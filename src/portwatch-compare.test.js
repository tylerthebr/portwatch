const { resolveSnapshot, compareSnapshots, formatCompareReport } = require('./portwatch-compare');

const makeSnapshot = (timestamp, ports, label) => ({ timestamp, ports, label });

const snap1 = makeSnapshot('2024-01-01T10:00:00Z', [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' }
], 'snap-a');

const snap2 = makeSnapshot('2024-01-01T11:00:00Z', [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 8080, protocol: 'tcp', process: 'nginx' }
], 'snap-b');

describe('resolveSnapshot', () => {
  const history = [snap1, snap2];

  test('returns latest snapshot', () => {
    const result = resolveSnapshot(history, 'latest');
    expect(result).toBe(snap2);
  });

  test('returns oldest snapshot', () => {
    const result = resolveSnapshot(history, 'oldest');
    expect(result).toBe(snap1);
  });

  test('returns snapshot by label', () => {
    const result = resolveSnapshot(history, 'snap-a');
    expect(result).toBe(snap1);
  });

  test('returns snapshot by timestamp', () => {
    const result = resolveSnapshot(history, '2024-01-01T11:00:00Z');
    expect(result).toBe(snap2);
  });

  test('returns null for unknown label', () => {
    const result = resolveSnapshot(history, 'nonexistent');
    expect(result).toBeNull();
  });

  test('returns null for empty history', () => {
    expect(resolveSnapshot([], 'latest')).toBeNull();
    expect(resolveSnapshot(null, 'latest')).toBeNull();
  });
});

describe('compareSnapshots', () => {
  test('returns a structured report', () => {
    const report = compareSnapshots(snap1, snap2);
    expect(report).toHaveProperty('from');
    expect(report).toHaveProperty('to');
    expect(report).toHaveProperty('added');
    expect(report).toHaveProperty('removed');
    expect(report).toHaveProperty('summary');
  });

  test('summary counts are correct', () => {
    const report = compareSnapshots(snap1, snap2);
    expect(report.summary.added).toBe(report.added.length);
    expect(report.summary.removed).toBe(report.removed.length);
  });

  test('throws if a snapshot is missing', () => {
    expect(() => compareSnapshots(null, snap2)).toThrow();
    expect(() => compareSnapshots(snap1, null)).toThrow();
  });
});

describe('formatCompareReport', () => {
  test('returns a non-empty string', () => {
    const report = compareSnapshots(snap1, snap2);
    const output = formatCompareReport(report);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('includes from/to labels', () => {
    const report = compareSnapshots(snap1, snap2);
    const output = formatCompareReport(report);
    expect(output).toContain('snap-a');
    expect(output).toContain('snap-b');
  });

  test('shows no changes message when snapshots are identical', () => {
    const report = compareSnapshots(snap1, snap1);
    const output = formatCompareReport(report);
    expect(output).toContain('No changes');
  });
});
