const { getSnapshotAt, replaySnapshot, replayDiff } = require('./portreplay');
const history = require('./history');
const snapshot = require('./snapshot');

jest.mock('./history');
jest.mock('./snapshot');
jest.mock('./reporter', () => ({ printPortList: jest.fn(), printDiff: jest.fn() }));

const mockHistory = [
  { timestamp: '2024-01-01T10:00:00Z', ports: [{ port: 3000, process: 'node' }] },
  { timestamp: '2024-01-01T11:00:00Z', ports: [{ port: 3000, process: 'node' }, { port: 4000, process: 'python' }] },
  { timestamp: '2024-01-01T12:00:00Z', ports: [{ port: 4000, process: 'python' }] }
];

beforeEach(() => {
  jest.clearAllMocks();
  history.loadHistory.mockReturnValue(mockHistory);
});

describe('getSnapshotAt', () => {
  it('returns entry at positive index', () => {
    const entry = getSnapshotAt(mockHistory, 0);
    expect(entry).toBe(mockHistory[0]);
  });

  it('returns entry at negative index', () => {
    const entry = getSnapshotAt(mockHistory, -1);
    expect(entry).toBe(mockHistory[2]);
  });

  it('returns entry at negative index -2', () => {
    const entry = getSnapshotAt(mockHistory, -2);
    expect(entry).toBe(mockHistory[1]);
  });

  it('returns null for empty history', () => {
    expect(getSnapshotAt([], 0)).toBeNull();
  });

  it('returns null for out-of-bounds index', () => {
    expect(getSnapshotAt(mockHistory, 99)).toBeNull();
  });

  it('returns null for out-of-bounds negative index', () => {
    expect(getSnapshotAt(mockHistory, -99)).toBeNull();
  });
});

describe('replaySnapshot', () => {
  it('returns snapshot at given index', () => {
    const entry = replaySnapshot(1);
    expect(entry).toBe(mockHistory[1]);
  });

  it('defaults to index 0', () => {
    const entry = replaySnapshot();
    expect(entry).toBe(mockHistory[0]);
  });

  it('returns null when history is empty', () => {
    history.loadHistory.mockReturnValue([]);
    const entry = replaySnapshot(0);
    expect(entry).toBeNull();
  });
});

describe('replayDiff', () => {
  it('returns diff between two snapshots', () => {
    snapshot.diffSnapshots.mockReturnValue({ added: [], removed: [] });
    const result = replayDiff(0, 1);
    expect(result).not.toBeNull();
    expect(result.from).toBe(mockHistory[0]);
    expect(result.to).toBe(mockHistory[1]);
    expect(snapshot.diffSnapshots).toHaveBeenCalledWith(mockHistory[0].ports, mockHistory[1].ports);
  });

  it('includes the diff result in the returned object', () => {
    const mockDiff = { added: [{ port: 4000, process: 'python' }], removed: [] };
    snapshot.diffSnapshots.mockReturnValue(mockDiff);
    const result = replayDiff(0, 1);
    expect(result.diff).toEqual(mockDiff);
  });

  it('returns null if from index is invalid', () => {
    const result = replayDiff(99, 1);
    expect(result).toBeNull();
  });

  it('returns null if to index is invalid', () => {
    const result = replayDiff(0, 99);
    expect(result).toBeNull();
  });
});
