const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const {
  getLabelPath,
  loadLabels,
  saveLabels,
  setSnapshotLabel,
  getSnapshotLabel,
  removeSnapshotLabel,
  listSnapshotLabels,
  resolveLabel,
  formatLabelEntry
} = require('./portwatch-snapshot-label');

const MOCK_LABELS = {
  'snap-001': { label: 'before-deploy', createdAt: '2024-01-01T00:00:00.000Z' },
  'snap-002': { label: 'after-deploy', createdAt: '2024-01-02T00:00:00.000Z' }
};

beforeEach(() => {
  jest.resetAllMocks();
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(MOCK_LABELS));
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
});

test('getLabelPath returns path under home dir', () => {
  const p = getLabelPath();
  expect(p).toContain('.portwatch');
  expect(p).toContain('snapshot-labels.json');
});

test('loadLabels returns empty object when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadLabels()).toEqual({});
});

test('loadLabels returns parsed labels', () => {
  expect(loadLabels()).toEqual(MOCK_LABELS);
});

test('loadLabels returns empty object on parse error', () => {
  fs.readFileSync.mockReturnValue('not-json');
  expect(loadLabels()).toEqual({});
});

test('setSnapshotLabel adds a new label', () => {
  setSnapshotLabel('snap-003', 'hotfix');
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written['snap-003'].label).toBe('hotfix');
  expect(written['snap-003'].createdAt).toBeDefined();
});

test('setSnapshotLabel throws if args missing', () => {
  expect(() => setSnapshotLabel(null, 'label')).toThrow();
  expect(() => setSnapshotLabel('id', '')).toThrow();
});

test('getSnapshotLabel returns entry for known id', () => {
  expect(getSnapshotLabel('snap-001')).toEqual(MOCK_LABELS['snap-001']);
});

test('getSnapshotLabel returns null for unknown id', () => {
  expect(getSnapshotLabel('snap-999')).toBeNull();
});

test('removeSnapshotLabel removes existing label', () => {
  const result = removeSnapshotLabel('snap-001');
  expect(result).toBe(true);
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written['snap-001']).toBeUndefined();
});

test('removeSnapshotLabel returns false for unknown id', () => {
  expect(removeSnapshotLabel('snap-999')).toBe(false);
});

test('listSnapshotLabels returns all labels', () => {
  expect(listSnapshotLabels()).toEqual(MOCK_LABELS);
});

test('resolveLabel returns label string when found', () => {
  expect(resolveLabel('snap-001')).toBe('before-deploy');
});

test('resolveLabel returns snapshotId when not found', () => {
  expect(resolveLabel('snap-999')).toBe('snap-999');
});

test('formatLabelEntry formats correctly', () => {
  const out = formatLabelEntry('snap-001', MOCK_LABELS['snap-001']);
  expect(out).toContain('snap-001');
  expect(out).toContain('before-deploy');
});
