const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const MOCK_PATH = path.join(os.homedir(), '.portwatch', 'export-schedules.json');

const {
  loadExportSchedules,
  saveExportSchedules,
  addExportSchedule,
  removeExportSchedule,
  getDueSchedules,
  markScheduleRun
} = require('./portwatch-export-schedule');

function load(data) {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
}

beforeEach(() => jest.clearAllMocks());

test('loadExportSchedules returns [] when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadExportSchedules()).toEqual([]);
});

test('loadExportSchedules returns parsed data', () => {
  load([{ name: 'daily', format: 'json', outputDir: '/tmp', intervalMinutes: 1440 }]);
  const result = loadExportSchedules();
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('daily');
});

test('addExportSchedule creates new schedule', () => {
  load([]);
  fs.mkdirSync = jest.fn();
  fs.writeFileSync = jest.fn();
  const entry = addExportSchedule({ name: 'hourly', format: 'csv', outputDir: '/tmp/exports', intervalMinutes: 60 });
  expect(entry.name).toBe('hourly');
  expect(entry.format).toBe('csv');
  expect(entry.lastRunAt).toBeNull();
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('addExportSchedule throws on duplicate name', () => {
  load([{ name: 'hourly', format: 'csv', outputDir: '/tmp', intervalMinutes: 60 }]);
  expect(() =>
    addExportSchedule({ name: 'hourly', format: 'csv', outputDir: '/tmp', intervalMinutes: 60 })
  ).toThrow("Export schedule 'hourly' already exists");
});

test('addExportSchedule throws on missing fields', () => {
  load([]);
  expect(() => addExportSchedule({ name: 'x' })).toThrow();
});

test('removeExportSchedule removes by name', () => {
  load([{ name: 'daily', format: 'json', outputDir: '/tmp', intervalMinutes: 1440 }]);
  fs.mkdirSync = jest.fn();
  fs.writeFileSync = jest.fn();
  const result = removeExportSchedule('daily');
  expect(result).toBe(true);
});

test('removeExportSchedule returns false when not found', () => {
  load([]);
  fs.writeFileSync = jest.fn();
  expect(removeExportSchedule('nope')).toBe(false);
});

test('getDueSchedules returns schedules with no lastRunAt', () => {
  load([{ name: 'x', intervalMinutes: 60, lastRunAt: null }]);
  expect(getDueSchedules()).toHaveLength(1);
});

test('getDueSchedules skips recently run schedules', () => {
  load([{ name: 'x', intervalMinutes: 60, lastRunAt: new Date().toISOString() }]);
  expect(getDueSchedules()).toHaveLength(0);
});

test('markScheduleRun updates lastRunAt', () => {
  load([{ name: 'x', intervalMinutes: 60, lastRunAt: null }]);
  fs.mkdirSync = jest.fn();
  fs.writeFileSync = jest.fn();
  const result = markScheduleRun('x');
  expect(result).toBe(true);
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written[0].lastRunAt).not.toBeNull();
});
