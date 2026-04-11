const { categorizeDiff, buildDiffReport, renderDiffReport } = require('./portdiff');

const before = {
  timestamp: '2024-01-01T10:00:00.000Z',
  ports: [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' },
  ],
};

const after = {
  timestamp: '2024-01-01T10:05:00.000Z',
  ports: [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 8080, protocol: 'tcp', process: 'nginx' },
  ],
};

const rawDiff = [
  { type: 'added',   port: 8080, protocol: 'tcp', process: 'nginx' },
  { type: 'removed', port: 5432, protocol: 'tcp', process: 'postgres' },
  { type: 'changed', port: 3000, protocol: 'tcp', process: 'node', prev: { process: 'deno' } },
];

describe('categorizeDiff', () => {
  it('splits entries by type', () => {
    const { added, removed, changed } = categorizeDiff(rawDiff);
    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(1);
    expect(changed).toHaveLength(1);
  });

  it('returns empty arrays when diff is empty', () => {
    const result = categorizeDiff([]);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });
});

describe('buildDiffReport', () => {
  it('includes correct summary counts', () => {
    const report = buildDiffReport(before, after, rawDiff);
    expect(report.summary.added).toBe(1);
    expect(report.summary.removed).toBe(1);
    expect(report.summary.changed).toBe(1);
    expect(report.summary.total).toBe(3);
  });

  it('preserves timestamps from snapshots', () => {
    const report = buildDiffReport(before, after, rawDiff);
    expect(report.beforeTimestamp).toBe(before.timestamp);
    expect(report.afterTimestamp).toBe(after.timestamp);
  });

  it('returns zero counts for empty diff', () => {
    const report = buildDiffReport(before, after, []);
    expect(report.summary.total).toBe(0);
  });
});

describe('renderDiffReport', () => {
  it('includes section headers for changes', () => {
    const report = buildDiffReport(before, after, rawDiff);
    const output = renderDiffReport(report);
    expect(output).toMatch(/Added/);
    expect(output).toMatch(/Removed/);
    expect(output).toMatch(/Changed/);
  });

  it('shows no-change message when diff is empty', () => {
    const report = buildDiffReport(before, after, []);
    const output = renderDiffReport(report);
    expect(output).toMatch(/No changes detected/);
  });

  it('includes summary line with counts', () => {
    const report = buildDiffReport(before, after, rawDiff);
    const output = renderDiffReport(report);
    expect(output).toMatch(/\+1 added/);
    expect(output).toMatch(/-1 removed/);
  });
});
