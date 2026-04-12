const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => require('os').tmpdir()
}));

const {
  loadAliases,
  saveAliases,
  setAlias,
  getAlias,
  removeAlias,
  clearAliases,
  annotateWithAliases,
  getAliasPath
} = require('./portaliases');

beforeEach(() => {
  const p = getAliasPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('loadAliases returns empty object when no file', () => {
  expect(loadAliases()).toEqual({});
});

test('setAlias stores alias for port', () => {
  setAlias(3000, 'dev-server');
  expect(loadAliases()).toEqual({ '3000': 'dev-server' });
});

test('getAlias returns alias by port', () => {
  setAlias(8080, 'proxy');
  expect(getAlias(8080)).toBe('proxy');
});

test('getAlias returns null for unknown port', () => {
  expect(getAlias(9999)).toBeNull();
});

test('removeAlias deletes alias', () => {
  setAlias(4000, 'api');
  removeAlias(4000);
  expect(getAlias(4000)).toBeNull();
});

test('clearAliases wipes all entries', () => {
  setAlias(3000, 'a');
  setAlias(4000, 'b');
  clearAliases();
  expect(loadAliases()).toEqual({});
});

test('annotateWithAliases adds alias field to matching entries', () => {
  setAlias(3000, 'frontend');
  const entries = [
    { port: 3000, process: 'node' },
    { port: 5432, process: 'postgres' }
  ];
  const result = annotateWithAliases(entries);
  expect(result[0].alias).toBe('frontend');
  expect(result[1].alias).toBeUndefined();
});

test('annotateWithAliases returns original entries untouched when no aliases', () => {
  const entries = [{ port: 8080, process: 'nginx' }];
  const result = annotateWithAliases(entries);
  expect(result).toEqual(entries);
});
