const { findStaleEntries, findDuplicates, excludeIgnored, buildCleanupReport } = require('./portclean');

jest.mock('./history');
jest.mock('./ignore');

const { loadHistory } = require('./history');
const { loadIgnoreList } = require('./ignore');

const mockEntries = [
  { port: 3000, pid: 101, process: 'node' },
  { port: 5432, pid: 202, process: 'postgres' },
  { port: 8080, pid: 303, process: 'python' }
];

beforeEach(() => {
  loadIgnoreList.mockReturnValue([]);
  loadHistory.mockReturnValue([]);
});

describe('findDuplicates', () => {
  it('returns empty array when no duplicates', () => {
    expect(findDuplicates(mockEntries)).toEqual([]);
  });

  it('detects duplicate ports with different pids', () => {
    const entries = [
      ...mockEntries,
      { port: 3000, pid: 999, process: 'other' }
    ];
    const result = findDuplicates(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    expect(result[0][0].port).toBe(3000);
  });
});

describe('excludeIgnored', () => {
  it('returns all entries when ignore list is empty', () => {
    expect(excludeIgnored(mockEntries)).toHaveLength(3);
  });

  it('filters out ignored ports', () => {
    loadIgnoreList.mockReturnValue([{ port: 3000 }]);
    const result = excludeIgnored(mockEntries);
    expect(result).toHaveLength(2);
    expect(result.find(e => e.port === 3000)).toBeUndefined();
  });
});

describe('findStaleEntries', () => {
  it('returns empty when not enough history', () => {
    loadHistory.mockReturnValue([{ entries: mockEntries }]);
    expect(findStaleEntries(mockEntries, 2)).toEqual([]);
  });

  it('marks entries not seen in all recent snapshots as stale', () => {
    const snap1 = { entries: [{ port: 3000, pid: 101 }] };
    const snap2 = { entries: [{ port: 3000, pid: 101 }] };
    loadHistory.mockReturnValue([snap1, snap2]);
    const result = findStaleEntries(mockEntries, 2);
    expect(result.some(e => e.port === 5432)).toBe(true);
  });
});

describe('buildCleanupReport', () => {
  it('returns a report with stale, duplicates, and suggestions', () => {
    loadHistory.mockReturnValue([]);
    const report = buildCleanupReport(mockEntries);
    expect(report).toHaveProperty('stale');
    expect(report).toHaveProperty('duplicates');
    expect(report).toHaveProperty('suggestions');
    expect(report).toHaveProperty('total');
  });

  it('total reflects combined suggestions', () => {
    const entries = [
      ...mockEntries,
      { port: 3000, pid: 999, process: 'other' }
    ];
    loadHistory.mockReturnValue([]);
    const report = buildCleanupReport(entries);
    expect(report.total).toBeGreaterThan(0);
  });
});
