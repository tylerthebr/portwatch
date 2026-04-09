const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveSnapshot, loadSnapshot, diffSnapshots } = require('./snapshot');

const tmpPath = path.join(os.tmpdir(), 'portwatch-test-snapshot.json');

afterEach(() => {
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
});

const samplePorts = [
  { port: 3000, protocol: 'tcp', pid: 1234, process: 'node' },
  { port: 5432, protocol: 'tcp', pid: 5678, process: 'postgres' },
];

describe('saveSnapshot', () => {
  test('writes a JSON file with timestamp and ports', () => {
    const snap = saveSnapshot(samplePorts, tmpPath);
    expect(fs.existsSync(tmpPath)).toBe(true);
    expect(snap.ports).toEqual(samplePorts);
    expect(snap.timestamp).toBeDefined();
  });
});

describe('loadSnapshot', () => {
  test('returns null when no snapshot file exists', () => {
    expect(loadSnapshot(tmpPath)).toBeNull();
  });

  test('returns snapshot object after saving', () => {
    saveSnapshot(samplePorts, tmpPath);
    const loaded = loadSnapshot(tmpPath);
    expect(loaded).not.toBeNull();
    expect(loaded.ports).toEqual(samplePorts);
  });

  test('returns null on corrupted file', () => {
    fs.writeFileSync(tmpPath, 'not valid json', 'utf8');
    expect(loadSnapshot(tmpPath)).toBeNull();
  });
});

describe('diffSnapshots', () => {
  test('detects added ports', () => {
    const prev = [samplePorts[0]];
    const curr = samplePorts;
    const { added, removed } = diffSnapshots(prev, curr);
    expect(added).toHaveLength(1);
    expect(added[0].port).toBe(5432);
    expect(removed).toHaveLength(0);
  });

  test('detects removed ports', () => {
    const { added, removed } = diffSnapshots(samplePorts, [samplePorts[0]]);
    expect(removed).toHaveLength(1);
    expect(removed[0].port).toBe(5432);
    expect(added).toHaveLength(0);
  });

  test('returns empty diff when ports unchanged', () => {
    const { added, removed } = diffSnapshots(samplePorts, samplePorts);
    expect(added).toHaveLength(0);
    expect(removed).toHaveLength(0);
  });
});
