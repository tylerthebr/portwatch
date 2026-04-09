// Integration test: tags round-trip through real config file
const fs = require('fs');
const os = require('os');
const path = require('path');

// Redirect config dir to a temp directory
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-tags-'));
process.env.PORTWATCH_CONFIG_DIR = tmpDir;

const { setTag, getTag, removeTag, getTags, clearTags, applyTagsToEntries } = require('./tags');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.PORTWATCH_CONFIG_DIR;
});

test('set and retrieve a tag end-to-end', () => {
  setTag(4000, 'db');
  expect(getTag(4000)).toBe('db');
});

test('multiple tags persist independently', () => {
  setTag(3000, 'frontend');
  setTag(8080, 'api');
  const tags = getTags();
  expect(tags[3000]).toBe('frontend');
  expect(tags[8080]).toBe('api');
});

test('removeTag removes only the specified port', () => {
  setTag(5000, 'worker');
  setTag(5001, 'scheduler');
  removeTag(5000);
  expect(getTag(5000)).toBeNull();
  expect(getTag(5001)).toBe('scheduler');
});

test('clearTags removes all tags', () => {
  setTag(9000, 'temp');
  clearTags();
  expect(getTags()).toEqual({});
});

test('applyTagsToEntries enriches correctly after real persist', () => {
  clearTags();
  setTag(3000, 'frontend');
  const entries = [
    { port: 3000, pid: 10, process: 'node' },
    { port: 9999, pid: 20, process: 'python' }
  ];
  const result = applyTagsToEntries(entries);
  expect(result[0]).toMatchObject({ port: 3000, tag: 'frontend' });
  expect(result[1]).toMatchObject({ port: 9999, tag: null });
});
