const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => {
    const dir = path.join(os.tmpdir(), 'portwatch-test-profiles-' + process.pid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}));

const { getProfile, setProfile, removeProfile, listProfiles, clearProfiles } = require('./profile');

beforeEach(() => clearProfiles());

describe('setProfile / getProfile', () => {
  it('stores and retrieves a profile', () => {
    setProfile('dev', { ports: [3000, 5432], protocol: 'tcp' });
    const p = getProfile('dev');
    expect(p.ports).toEqual([3000, 5432]);
    expect(p.protocol).toBe('tcp');
    expect(p.updatedAt).toBeDefined();
  });

  it('returns null for unknown profile', () => {
    expect(getProfile('nonexistent')).toBeNull();
  });

  it('throws if name is empty', () => {
    expect(() => setProfile('', {})).toThrow();
  });

  it('overwrites existing profile', () => {
    setProfile('dev', { ports: [3000] });
    setProfile('dev', { ports: [4000] });
    expect(getProfile('dev').ports).toEqual([4000]);
  });
});

describe('removeProfile', () => {
  it('removes an existing profile', () => {
    setProfile('staging', { ports: [8080] });
    expect(removeProfile('staging')).toBe(true);
    expect(getProfile('staging')).toBeNull();
  });

  it('returns false for missing profile', () => {
    expect(removeProfile('ghost')).toBe(false);
  });
});

describe('listProfiles', () => {
  it('returns all profiles as array', () => {
    setProfile('dev', { ports: [3000] });
    setProfile('prod', { ports: [80] });
    const list = listProfiles();
    expect(list).toHaveLength(2);
    expect(list.map(p => p.name)).toContain('dev');
    expect(list.map(p => p.name)).toContain('prod');
  });

  it('returns empty array when no profiles', () => {
    expect(listProfiles()).toEqual([]);
  });
});
