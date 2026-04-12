const {
  detectEnvFromProcess,
  detectEnvFromNodeEnv,
  resolveEnv,
  annotateWithEnv,
  annotateEntriesWithEnv,
  groupByEnv,
} = require('./portwatch-env');

describe('detectEnvFromProcess', () => {
  it('returns development for dev-related process names', () => {
    expect(detectEnvFromProcess('node-dev')).toBe('development');
    expect(detectEnvFromProcess('webpack-dev-server')).toBe('development');
  });

  it('returns staging for stg process names', () => {
    expect(detectEnvFromProcess('app-stg')).toBe('staging');
    expect(detectEnvFromProcess('staging-server')).toBe('staging');
  });

  it('returns production for prod process names', () => {
    expect(detectEnvFromProcess('prod-api')).toBe('production');
  });

  it('returns test for ci-related process names', () => {
    expect(detectEnvFromProcess('jest-worker')).toBe('test');
  });

  it('returns null for unrecognized process names', () => {
    expect(detectEnvFromProcess('nginx')).toBeNull();
    expect(detectEnvFromProcess('')).toBeNull();
  });
});

describe('detectEnvFromNodeEnv', () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('returns development when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    expect(detectEnvFromNodeEnv()).toBe('development');
  });

  it('returns test when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    expect(detectEnvFromNodeEnv()).toBe('test');
  });

  it('returns null when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;
    expect(detectEnvFromNodeEnv()).toBeNull();
  });
});

describe('resolveEnv', () => {
  it('uses process name if available', () => {
    expect(resolveEnv({ process: 'webpack-dev-server' })).toBe('development');
  });

  it('falls back to unknown when nothing matches', () => {
    const saved = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    expect(resolveEnv({ process: 'nginx' })).toBe('unknown');
    process.env.NODE_ENV = saved;
  });
});

describe('annotateWithEnv', () => {
  it('adds env field to entry', () => {
    const entry = { port: 3000, process: 'dev-server' };
    const result = annotateWithEnv(entry);
    expect(result).toHaveProperty('env');
    expect(result.port).toBe(3000);
  });
});

describe('annotateEntriesWithEnv', () => {
  it('annotates all entries', () => {
    const entries = [
      { port: 3000, process: 'dev-server' },
      { port: 8080, process: 'prod-api' },
    ];
    const result = annotateEntriesWithEnv(entries);
    expect(result).toHaveLength(2);
    expect(result[0].env).toBe('development');
    expect(result[1].env).toBe('production');
  });
});

describe('groupByEnv', () => {
  it('groups entries by env field', () => {
    const entries = [
      { port: 3000, env: 'development' },
      { port: 3001, env: 'development' },
      { port: 8080, env: 'production' },
    ];
    const groups = groupByEnv(entries);
    expect(groups.development).toHaveLength(2);
    expect(groups.production).toHaveLength(1);
  });

  it('handles missing env field as unknown', () => {
    const entries = [{ port: 9999 }];
    const groups = groupByEnv(entries);
    expect(groups.unknown).toHaveLength(1);
  });
});
