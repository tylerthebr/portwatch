const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => require('os').tmpdir()
}));

const {
  loadWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isWatched,
  clearWatchlist,
  getWatchlistPath
} = require('./watchlist');

beforeEach(() => {
  clearWatchlist();
});

afterAll(() => {
  const p = getWatchlistPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('starts empty', () => {
  expect(loadWatchlist()).toEqual([]);
});

test('adds a port to watchlist', () => {
  const result = addToWatchlist(3000, 'dev server');
  expect(result).toBe(true);
  const list = loadWatchlist();
  expect(list).toHaveLength(1);
  expect(list[0].port).toBe(3000);
  expect(list[0].label).toBe('dev server');
});

test('does not add duplicate port', () => {
  addToWatchlist(3000);
  const result = addToWatchlist(3000);
  expect(result).toBe(false);
  expect(loadWatchlist()).toHaveLength(1);
});

test('removes a port from watchlist', () => {
  addToWatchlist(4000);
  const result = removeFromWatchlist(4000);
  expect(result).toBe(true);
  expect(loadWatchlist()).toHaveLength(0);
});

test('returns false when removing non-existent port', () => {
  expect(removeFromWatchlist(9999)).toBe(false);
});

test('isWatched returns correct boolean', () => {
  addToWatchlist(5000);
  expect(isWatched(5000)).toBe(true);
  expect(isWatched(5001)).toBe(false);
});

test('clearWatchlist empties the list', () => {
  addToWatchlist(6000);
  addToWatchlist(6001);
  clearWatchlist();
  expect(loadWatchlist()).toHaveLength(0);
});
