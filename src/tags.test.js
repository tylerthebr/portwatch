const { getTags, setTag, removeTag, getTag, clearTags, applyTagsToEntries } = require('./tags');
const { loadConfig, saveConfig, resetConfig } = require('./config');

jest.mock('./config');

let mockConfig;

beforeEach(() => {
  mockConfig = { tags: {} };
  loadConfig.mockImplementation(() => JSON.parse(JSON.stringify(mockConfig)));
  saveConfig.mockImplementation(cfg => { mockConfig = cfg; });
  resetConfig && resetConfig();
});

test('getTags returns empty object when no tags set', () => {
  expect(getTags()).toEqual({});
});

test('setTag stores a tag for a port', () => {
  const result = setTag(3000, 'frontend');
  expect(result).toBe('frontend');
  expect(mockConfig.tags[3000]).toBe('frontend');
});

test('setTag trims whitespace from tag', () => {
  setTag(8080, '  api  ');
  expect(mockConfig.tags[8080]).toBe('api');
});

test('setTag throws on invalid port', () => {
  expect(() => setTag(0, 'test')).toThrow('Invalid port');
  expect(() => setTag(99999, 'test')).toThrow('Invalid port');
  expect(() => setTag('abc', 'test')).toThrow('Invalid port');
});

test('setTag throws on empty tag', () => {
  expect(() => setTag(3000, '')).toThrow('non-empty string');
  expect(() => setTag(3000, '   ')).toThrow('non-empty string');
});

test('getTag returns tag for known port', () => {
  mockConfig.tags = { 3000: 'frontend' };
  expect(getTag(3000)).toBe('frontend');
});

test('getTag returns null for unknown port', () => {
  expect(getTag(9999)).toBeNull();
});

test('removeTag removes existing tag', () => {
  mockConfig.tags = { 3000: 'frontend' };
  expect(removeTag(3000)).toBe(true);
  expect(mockConfig.tags[3000]).toBeUndefined();
});

test('removeTag returns false for nonexistent tag', () => {
  expect(removeTag(9999)).toBe(false);
});

test('clearTags empties all tags', () => {
  mockConfig.tags = { 3000: 'frontend', 8080: 'api' };
  clearTags();
  expect(mockConfig.tags).toEqual({});
});

test('applyTagsToEntries attaches tags to entries', () => {
  mockConfig.tags = { 3000: 'frontend' };
  const entries = [{ port: 3000, pid: 1 }, { port: 8080, pid: 2 }];
  const result = applyTagsToEntries(entries);
  expect(result[0].tag).toBe('frontend');
  expect(result[1].tag).toBeNull();
});
