const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-pin-int-'));
  jest.resetModules();
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portwatch-pin');
}

test('full pin lifecycle', () => {
  const pin = load();
  expect(pin.listPins()).toHaveLength(0);

  pin.pinPort(3000, 'frontend');
  pin.pinPort(8080, 'proxy');
  pin.pinPort(5432, 'db');

  expect(pin.listPins()).toHaveLength(3);
  expect(pin.isPinned(8080)).toBe(true);

  pin.unpinPort(8080);
  expect(pin.isPinned(8080)).toBe(false);
  expect(pin.listPins()).toHaveLength(2);

  pin.clearPins();
  expect(pin.listPins()).toHaveLength(0);
});

test('filterPinned integrates with real pin state', () => {
  const pin = load();
  pin.pinPort(3000);
  pin.pinPort(5432);

  const entries = [
    { port: 3000, process: 'node' },
    { port: 4000, process: 'ruby' },
    { port: 5432, process: 'postgres' },
    { port: 6379, process: 'redis' },
  ];

  const pinned = pin.filterPinned(entries);
  expect(pinned).toHaveLength(2);
  expect(pinned.map(e => e.port)).toEqual(expect.arrayContaining([3000, 5432]));
});

test('pins persist to disk and reload correctly', () => {
  const pin = load();
  pin.pinPort(9000, 'test service');

  const pinFile = pin.getPinPath();
  expect(fs.existsSync(pinFile)).toBe(true);

  jest.resetModules();
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
  const pin2 = require('./portwatch-pin');

  expect(pin2.isPinned(9000)).toBe(true);
  const entry = pin2.loadPins()['9000'];
  expect(entry.label).toBe('test service');
});
