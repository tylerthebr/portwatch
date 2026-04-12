const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portnotebook-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portnotebook');
}

test('addNote stores a note for a port', () => {
  const { addNote, getNotes } = load();
  addNote(3000, 'dev server');
  const notes = getNotes(3000);
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('dev server');
  expect(notes[0].createdAt).toBeTruthy();
});

test('addNote appends multiple notes', () => {
  const { addNote, getNotes } = load();
  addNote(3000, 'first');
  addNote(3000, 'second');
  expect(getNotes(3000)).toHaveLength(2);
});

test('getNotes returns empty array for unknown port', () => {
  const { getNotes } = load();
  expect(getNotes(9999)).toEqual([]);
});

test('removeNote removes by index', () => {
  const { addNote, removeNote, getNotes } = load();
  addNote(4000, 'alpha');
  addNote(4000, 'beta');
  const result = removeNote(4000, 0);
  expect(result).toBe(true);
  const notes = getNotes(4000);
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('beta');
});

test('removeNote returns false for missing index', () => {
  const { removeNote } = load();
  expect(removeNote(5000, 0)).toBe(false);
});

test('clearNotes removes all notes for a port', () => {
  const { addNote, clearNotes, getNotes } = load();
  addNote(6000, 'keep me not');
  clearNotes(6000);
  expect(getNotes(6000)).toEqual([]);
});

test('allAnnotatedPorts returns ports with notes', () => {
  const { addNote, allAnnotatedPorts } = load();
  addNote(7000, 'a');
  addNote(8000, 'b');
  const ports = allAnnotatedPorts();
  expect(ports).toContain(7000);
  expect(ports).toContain(8000);
});

test('addNote throws if port or text missing', () => {
  const { addNote } = load();
  expect(() => addNote(null, 'text')).toThrow();
  expect(() => addNote(3000, '')).toThrow();
});

test('notes persist across separate load() calls', () => {
  // Verify that notes are written to disk and survive a fresh require
  const { addNote } = load();
  addNote(3000, 'persisted note');

  jest.resetModules();
  const { getNotes } = load();
  const notes = getNotes(3000);
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('persisted note');
});
