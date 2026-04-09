const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => {
    const dir = path.join(os.tmpdir(), 'portwatch-ignore-test-' + process.pid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  },
}));

const {
  loadIgnoreList,
  addIgnoredPort,
  removeIgnoredPort,
  addIgnoredProcess,
  removeIgnoredProcess,
  applyIgnoreList,
  clearIgnoreList,
} = require('./ignore');

beforeEach(() => {
  clearIgnoreList();
});

test('loadIgnoreList returns empty lists by default', () => {
  const list = loadIgnoreList();
  expect(list.ports).toEqual([]);
  expect(list.processes).toEqual([]);
});

test('addIgnoredPort adds a port', () => {
  addIgnoredPort(3000);
  const list = loadIgnoreList();
  expect(list.ports).toContain(3000);
});

test('addIgnoredPort does not duplicate', () => {
  addIgnoredPort(3000);
  addIgnoredPort(3000);
  const list = loadIgnoreList();
  expect(list.ports.filter(p => p === 3000).length).toBe(1);
});

test('removeIgnoredPort removes a port', () => {
  addIgnoredPort(8080);
  removeIgnoredPort(8080);
  const list = loadIgnoreList();
  expect(list.ports).not.toContain(8080);
});

test('addIgnoredProcess adds a process name', () => {
  addIgnoredProcess('node');
  const list = loadIgnoreList();
  expect(list.processes).toContain('node');
});

test('removeIgnoredProcess removes a process name', () => {
  addIgnoredProcess('nginx');
  removeIgnoredProcess('nginx');
  const list = loadIgnoreList();
  expect(list.processes).not.toContain('nginx');
});

test('applyIgnoreList filters out ignored ports', () => {
  addIgnoredPort(3000);
  const entries = [
    { port: 3000, process: 'node' },
    { port: 4000, process: 'ruby' },
  ];
  const result = applyIgnoreList(entries);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(4000);
});

test('applyIgnoreList filters out ignored processes', () => {
  addIgnoredProcess('nginx');
  const entries = [
    { port: 80, process: 'nginx' },
    { port: 8080, process: 'node' },
  ];
  const result = applyIgnoreList(entries);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(8080);
});
