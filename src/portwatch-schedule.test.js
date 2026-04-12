const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-sched-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portwatch-schedule');
}

test('loadSchedules returns empty object when no file', () => {
  const { loadSchedules } = load();
  expect(loadSchedules()).toEqual({});
});

test('addSchedule creates a schedule entry', () => {
  const { addSchedule, getSchedule } = load();
  addSchedule('dev', 30);
  const s = getSchedule('dev');
  expect(s).not.toBeNull();
  expect(s.intervalSeconds).toBe(30);
  expect(s.enabled).toBe(true);
  expect(s.notify).toBe(true);
  expect(s.lastRun).toBeNull();
});

test('addSchedule throws on invalid interval', () => {
  const { addSchedule } = load();
  expect(() => addSchedule('bad', 2)).toThrow('Invalid schedule');
  expect(() => addSchedule('', 30)).toThrow('Invalid schedule');
});

test('removeSchedule deletes entry and returns true', () => {
  const { addSchedule, removeSchedule, getSchedule } = load();
  addSchedule('ci', 60);
  expect(removeSchedule('ci')).toBe(true);
  expect(getSchedule('ci')).toBeNull();
});

test('removeSchedule returns false for missing entry', () => {
  const { removeSchedule } = load();
  expect(removeSchedule('ghost')).toBe(false);
});

test('updateLastRun sets timestamp', () => {
  const { addSchedule, updateLastRun, getSchedule } = load();
  addSchedule('nightly', 3600);
  const ts = '2024-01-01T00:00:00.000Z';
  expect(updateLastRun('nightly', ts)).toBe(true);
  expect(getSchedule('nightly').lastRun).toBe(ts);
});

test('listSchedules returns array of all schedules', () => {
  const { addSchedule, listSchedules } = load();
  addSchedule('a', 10);
  addSchedule('b', 20);
  const list = listSchedules();
  expect(list).toHaveLength(2);
  expect(list.map(s => s.name)).toEqual(expect.arrayContaining(['a', 'b']));
});

test('clearSchedules empties all entries', () => {
  const { addSchedule, clearSchedules, listSchedules } = load();
  addSchedule('x', 15);
  clearSchedules();
  expect(listSchedules()).toHaveLength(0);
});

test('opts.enabled and opts.notify are respected', () => {
  const { addSchedule, getSchedule } = load();
  addSchedule('quiet', 60, { enabled: false, notify: false });
  const s = getSchedule('quiet');
  expect(s.enabled).toBe(false);
  expect(s.notify).toBe(false);
});
