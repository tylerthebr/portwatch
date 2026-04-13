const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-quota-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
  return require('./portwatch-quota');
}

test('loadQuotas returns empty object when file missing', () => {
  const { loadQuotas } = load();
  expect(loadQuotas()).toEqual({});
});

test('setQuota and getQuota round-trip', () => {
  const { setQuota, getQuota } = load();
  setQuota('node', 5);
  expect(getQuota('node')).toBe(5);
});

test('setQuota throws on invalid limit', () => {
  const { setQuota } = load();
  expect(() => setQuota('node', 0)).toThrow('limit must be a positive integer');
  expect(() => setQuota('node', -3)).toThrow();
  expect(() => setQuota('node', 'many')).toThrow();
});

test('removeQuota deletes entry', () => {
  const { setQuota, removeQuota, getQuota } = load();
  setQuota('python', 3);
  removeQuota('python');
  expect(getQuota('python')).toBeNull();
});

test('checkQuotas returns violations when exceeded', () => {
  const { setQuota, checkQuotas } = load();
  setQuota('node', 2);
  const entries = [
    { port: 3000, process: 'node' },
    { port: 3001, process: 'node' },
    { port: 3002, process: 'node' },
  ];
  const violations = checkQuotas(entries);
  expect(violations).toHaveLength(1);
  expect(violations[0]).toMatchObject({ process: 'node', limit: 2, count: 3, excess: 1 });
});

test('checkQuotas returns empty array when within limits', () => {
  const { setQuota, checkQuotas } = load();
  setQuota('node', 5);
  const entries = [{ port: 3000, process: 'node' }, { port: 3001, process: 'node' }];
  expect(checkQuotas(entries)).toHaveLength(0);
});

test('formatViolation returns readable string', () => {
  const { formatViolation } = load();
  const msg = formatViolation({ process: 'ruby', limit: 2, count: 4, excess: 2 });
  expect(msg).toContain('ruby');
  expect(msg).toContain('limit: 2');
  expect(msg).toContain('+2');
});
