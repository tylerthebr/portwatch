const fs = require('fs');
const path = require('path');
const os = require('os');
const { exportToJSON, exportToCSV, exportDiffReport, resolveFormat } = require('./exporter');

const mockSnapshot = {
  timestamp: '2024-01-01T00:00:00.000Z',
  ports: [
    { port: 3000, protocol: 'tcp', process: 'node', pid: 1234, state: 'LISTEN' },
    { port: 5432, protocol: 'tcp', process: 'postgres', pid: 5678, state: 'LISTEN' }
  ]
};

const mockDiff = {
  added: [{ port: 8080, protocol: 'tcp', process: 'python' }],
  removed: [{ port: 3001, protocol: 'tcp', process: 'node' }]
};

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-export-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('exportToJSON writes valid JSON file', () => {
  const out = path.join(tmpDir, 'snap.json');
  exportToJSON(mockSnapshot, out);
  const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(parsed.ports).toHaveLength(2);
  expect(parsed.ports[0].port).toBe(3000);
});

test('exportToCSV writes correct CSV with headers', () => {
  const out = path.join(tmpDir, 'snap.csv');
  exportToCSV(mockSnapshot, out);
  const content = fs.readFileSync(out, 'utf8');
  expect(content).toContain('port,protocol,process,pid,state');
  expect(content).toContain('"3000"');
  expect(content).toContain('"postgres"');
});

test('exportDiffReport writes readable text report', () => {
  const out = path.join(tmpDir, 'report.txt');
  exportDiffReport(mockDiff, out, '2024-01-01T00:00:00.000Z');
  const content = fs.readFileSync(out, 'utf8');
  expect(content).toContain('Port Change Report');
  expect(content).toContain('+ 8080/tcp');
  expect(content).toContain('- 3001/tcp');
});

test('resolveFormat detects csv from extension', () => {
  expect(resolveFormat('output.csv')).toBe('csv');
});

test('resolveFormat detects txt from extension', () => {
  expect(resolveFormat('report.txt')).toBe('txt');
});

test('resolveFormat defaults to json', () => {
  expect(resolveFormat('output.json')).toBe('json');
  expect(resolveFormat('output.xyz')).toBe('json');
});

test('resolveFormat respects explicit format override', () => {
  expect(resolveFormat('output.csv', 'json')).toBe('json');
});
