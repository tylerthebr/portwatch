// integration test: add → list → updateLastRun → remove cycle

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-sched-int-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('full lifecycle: add, list, updateLastRun, remove', () => {
  const {
    addSchedule, listSchedules, updateLastRun, removeSchedule, getSchedule,
  } = require('./portwatch-schedule');

  addSchedule('alpha', 60);
  addSchedule('beta', 120, { notify: false });

  let list = listSchedules();
  expect(list).toHaveLength(2);

  updateLastRun('alpha', '2024-06-01T12:00:00.000Z');
  expect(getSchedule('alpha').lastRun).toBe('2024-06-01T12:00:00.000Z');

  // beta lastRun still null
  expect(getSchedule('beta').lastRun).toBeNull();

  removeSchedule('alpha');
  list = listSchedules();
  expect(list).toHaveLength(1);
  expect(list[0].name).toBe('beta');
});

test('schedules persist across module reloads', () => {
  const mod1 = require('./portwatch-schedule');
  mod1.addSchedule('persist-me', 30);

  jest.resetModules();
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
  const mod2 = require('./portwatch-schedule');

  const s = mod2.getSchedule('persist-me');
  expect(s).not.toBeNull();
  expect(s.intervalSeconds).toBe(30);
});

test('updateLastRun returns false for unknown schedule', () => {
  const { updateLastRun } = require('./portwatch-schedule');
  expect(updateLastRun('nonexistent')).toBe(false);
});

test('disabled schedule is listed but marked disabled', () => {
  const { addSchedule, listSchedules } = require('./portwatch-schedule');
  addSchedule('off', 10, { enabled: false });
  const list = listSchedules();
  expect(list[0].enabled).toBe(false);
});
