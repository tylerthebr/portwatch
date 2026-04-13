const { compareNamedSnapshots, formatNamedDiffReport } = require('./portwatch-snapshot-diff');
const { loadSnapshot } = require('./snapshot');

jest.mock('./snapshot');
jest.mock('./portdiff', () => ({
  categorizeDiff: (from, to) => {
    const fromPorts = new Set(from.map(e => e.port));
    const toPorts = new Set(to.map(e => e.port));
    return {
      added: to.filter(e => !fromPorts.has(e.port)),
      removed: from.filter(e => !toPorts.has(e.port)),
      changed: []
    };
  }
}));
jest.mock('./formatter', () => ({
  formatTimestamp: ts => ts || 'unknown'
}));

const snapA = {
  timestamp: '2024-01-01T10:00:00Z',
  ports: [
    { port: 3000, process: 'node' },
    { port: 5432, process: 'postgres' }
  ]
};

const snapB = {
  timestamp: '2024-01-01T11:00:00Z',
  ports: [
    { port: 3000, process: 'node' },
    { port: 8080, process: 'nginx' }
  ]
};

describe('compareNamedSnapshots', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns null if from snapshot is missing', () => {
    loadSnapshot.mockImplementationOnce(() => { throw new Error('not found'); });
    loadSnapshot.mockReturnValueOnce(snapB);
    const result = compareNamedSnapshots('missing', 'snapB');
    expect(result).toBeNull();
  });

  test('returns null if to snapshot is missing', () => {
    loadSnapshot.mockReturnValueOnce(snapA);
    loadSnapshot.mockImplementationOnce(() => { throw new Error('not found'); });
    const result = compareNamedSnapshots('snapA', 'missing');
    expect(result).toBeNull();
  });

  test('returns diff report with correct added/removed', () => {
    loadSnapshot.mockReturnValueOnce(snapA).mockReturnValueOnce(snapB);
    const result = compareNamedSnapshots('snapA', 'snapB');
    expect(result).not.toBeNull();
    expect(result.diff.added).toHaveLength(1);
    expect(result.diff.added[0].port).toBe(8080);
    expect(result.diff.removed).toHaveLength(1);
    expect(result.diff.removed[0].port).toBe(5432);
  });

  test('includes from/to metadata', () => {
    loadSnapshot.mockReturnValueOnce(snapA).mockReturnValueOnce(snapB);
    const result = compareNamedSnapshots('snapA', 'snapB');
    expect(result.from.name).toBe('snapA');
    expect(result.from.count).toBe(2);
    expect(result.to.name).toBe('snapB');
    expect(result.to.count).toBe(2);
  });
});

describe('formatNamedDiffReport', () => {
  test('returns fallback message for null input', () => {
    expect(formatNamedDiffReport(null)).toMatch(/Could not load/);
  });

  test('includes added and removed port numbers', () => {
    loadSnapshot.mockReturnValueOnce(snapA).mockReturnValueOnce(snapB);
    const report = compareNamedSnapshots('snapA', 'snapB');
    const output = formatNamedDiffReport(report);
    expect(output).toContain(':8080');
    expect(output).toContain(':5432');
    expect(output).toContain('Added   : 1');
    expect(output).toContain('Removed : 1');
  });

  test('includes snapshot names in output', () => {
    loadSnapshot.mockReturnValueOnce(snapA).mockReturnValueOnce(snapB);
    const report = compareNamedSnapshots('snapA', 'snapB');
    const output = formatNamedDiffReport(report);
    expect(output).toContain('snapA');
    expect(output).toContain('snapB');
  });
});
