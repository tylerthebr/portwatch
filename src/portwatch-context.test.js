const os = require('os');
const { buildContext, formatContext, contextMatches, diffContexts } = require('./portwatch-context');

jest.mock('./portwatch-env', () => ({
  resolveEnv: () => 'development',
}));

describe('buildContext', () => {
  it('returns an object with expected keys', () => {
    const ctx = buildContext();
    expect(ctx).toHaveProperty('hostname');
    expect(ctx).toHaveProperty('user');
    expect(ctx).toHaveProperty('cwd');
    expect(ctx).toHaveProperty('platform');
    expect(ctx).toHaveProperty('env', 'development');
    expect(ctx).toHaveProperty('pid');
    expect(ctx).toHaveProperty('capturedAt');
  });

  it('applies overrides', () => {
    const ctx = buildContext({ hostname: 'test-host', env: 'staging' });
    expect(ctx.hostname).toBe('test-host');
    expect(ctx.env).toBe('staging');
  });

  it('capturedAt is a valid ISO string', () => {
    const ctx = buildContext();
    expect(() => new Date(ctx.capturedAt)).not.toThrow();
    expect(new Date(ctx.capturedAt).toISOString()).toBe(ctx.capturedAt);
  });
});

describe('formatContext', () => {
  it('returns a multiline string with all fields', () => {
    const ctx = buildContext({ hostname: 'myhost', user: 'alice', env: 'test', pid: 1234 });
    const out = formatContext(ctx);
    expect(out).toContain('myhost');
    expect(out).toContain('alice');
    expect(out).toContain('test');
    expect(out).toContain('1234');
  });
});

describe('contextMatches', () => {
  const base = { hostname: 'h1', user: 'u1', env: 'development', cwd: '/a' };

  it('returns true when specified fields match', () => {
    const other = { hostname: 'h1', user: 'u1', env: 'development', cwd: '/b' };
    expect(contextMatches(base, other)).toBe(true);
  });

  it('returns false when a field differs', () => {
    const other = { hostname: 'h2', user: 'u1', env: 'development', cwd: '/a' };
    expect(contextMatches(base, other)).toBe(false);
  });

  it('checks only the provided fields', () => {
    const other = { hostname: 'h1', user: 'u1', env: 'production', cwd: '/a' };
    expect(contextMatches(base, other, ['hostname', 'user'])).toBe(true);
  });
});

describe('diffContexts', () => {
  it('returns empty array for identical contexts', () => {
    const ctx = buildContext();
    expect(diffContexts(ctx, { ...ctx })).toEqual([]);
  });

  it('detects changed fields', () => {
    const a = { hostname: 'h1', env: 'dev', user: 'alice' };
    const b = { hostname: 'h2', env: 'dev', user: 'alice' };
    const diff = diffContexts(a, b);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({ field: 'hostname', from: 'h1', to: 'h2' });
  });

  it('handles new keys in b', () => {
    const a = { hostname: 'h1' };
    const b = { hostname: 'h1', extra: 'new' };
    const diff = diffContexts(a, b);
    expect(diff).toHaveLength(1);
    expect(diff[0].field).toBe('extra');
  });
});
