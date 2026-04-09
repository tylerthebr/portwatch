const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  loadConfig: () => ({ configDir: require('os').tmpdir() })
}));

jest.mock('./snapshot', () => ({
  diffSnapshots: (a, b) => ({
    added: b.filter(p => !a.find(x => x.port === p.port)),
    removed: a.filter(p => !b.find(x => x.port === p.port))
  })
}));

const { saveBaseline, loadBaseline, clearBaseline, diffFromBaseline, getBaselinePath } = require('./baseline');

const samplePorts = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' }
];

afterEach(() => {
  const p = getBaselinePath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('saveBaseline writes file with timestamp and ports', () => {
  const result = saveBaseline(samplePorts);
  expect(result.ports).toEqual(samplePorts);
  expect(result.timestamp).toBeDefined();
  expect(fs.existsSync(getBaselinePath())).toBe(true);
});

test('loadBaseline returns null when no file exists', () => {
  expect(loadBaseline()).toBeNull();
});

test('loadBaseline returns saved baseline', () => {
  saveBaseline(samplePorts);
  const loaded = loadBaseline();
  expect(loaded.ports).toEqual(samplePorts);
});

test('clearBaseline removes the file', () => {
  saveBaseline(samplePorts);
  const removed = clearBaseline();
  expect(removed).toBe(true);
  expect(fs.existsSync(getBaselinePath())).toBe(false);
});

test('clearBaseline returns false when no file', () => {
  expect(clearBaseline()).toBe(false);
});

test('diffFromBaseline returns hasBaseline false when no baseline', () => {
  const result = diffFromBaseline(samplePorts);
  expect(result.hasBaseline).toBe(false);
  expect(result.unchanged).toEqual(samplePorts);
});

test('diffFromBaseline detects added ports', () => {
  saveBaseline([samplePorts[0]]);
  const result = diffFromBaseline(samplePorts);
  expect(result.hasBaseline).toBe(true);
  expect(result.added).toHaveLength(1);
  expect(result.added[0].port).toBe(5432);
});
