const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-threshold-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const load = () => require('./portwatch-threshold');

describe('loadThresholds / saveThresholds', () => {
  it('returns empty object when no file exists', () => {
    const { loadThresholds } = load();
    expect(loadThresholds()).toEqual({});
  });

  it('round-trips thresholds', () => {
    const { loadThresholds, saveThresholds } = load();
    saveThresholds({ web: { name: 'web', maxPorts: 10 } });
    expect(loadThresholds()).toEqual({ web: { name: 'web', maxPorts: 10 } });
  });
});

describe('setThreshold / removeThreshold', () => {
  it('sets a threshold with defaults', () => {
    const { setThreshold, loadThresholds } = load();
    setThreshold('api', { maxPorts: 5 });
    const t = loadThresholds()['api'];
    expect(t.name).toBe('api');
    expect(t.maxPorts).toBe(5);
    expect(t.minPorts).toBeNull();
    expect(t.process).toBeNull();
  });

  it('removes a threshold', () => {
    const { setThreshold, removeThreshold, loadThresholds } = load();
    setThreshold('api', { maxPorts: 5 });
    removeThreshold('api');
    expect(loadThresholds()['api']).toBeUndefined();
  });

  it('returns false when removing nonexistent threshold', () => {
    const { removeThreshold } = load();
    expect(removeThreshold('ghost')).toBe(false);
  });
});

describe('checkThresholds', () => {
  const entries = [
    { port: 3000, process: 'node' },
    { port: 3001, process: 'node' },
    { port: 5432, process: 'postgres' }
  ];

  it('returns no violations when within limits', () => {
    const { setThreshold, checkThresholds } = load();
    setThreshold('all', { maxPorts: 10 });
    expect(checkThresholds(entries)).toHaveLength(0);
  });

  it('detects max violation', () => {
    const { setThreshold, checkThresholds } = load();
    setThreshold('all', { maxPorts: 2 });
    const v = checkThresholds(entries);
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe('max');
    expect(v[0].actual).toBe(3);
  });

  it('detects min violation', () => {
    const { setThreshold, checkThresholds } = load();
    setThreshold('need5', { minPorts: 5 });
    const v = checkThresholds(entries);
    expect(v[0].type).toBe('min');
  });

  it('scopes check to process when specified', () => {
    const { setThreshold, checkThresholds } = load();
    setThreshold('node-limit', { maxPorts: 1, process: 'node' });
    const v = checkThresholds(entries);
    expect(v[0].process).toBe('node');
    expect(v[0].actual).toBe(2);
  });
});

describe('formatViolation', () => {
  it('formats a max violation', () => {
    const { formatViolation } = load();
    const msg = formatViolation({ threshold: 'all', type: 'max', limit: 2, actual: 3, process: null });
    expect(msg).toMatch('exceeded');
    expect(msg).toMatch('all');
  });

  it('includes process scope when present', () => {
    const { formatViolation } = load();
    const msg = formatViolation({ threshold: 't', type: 'min', limit: 5, actual: 2, process: 'node' });
    expect(msg).toMatch('node');
  });
});
