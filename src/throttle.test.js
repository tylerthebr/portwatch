const { shouldFire, throttle, resetThrottle, lastFiredAt, DEFAULT_INTERVAL_MS } = require('./throttle');

beforeEach(() => {
  resetThrottle();
});

describe('shouldFire', () => {
  test('fires on first call for a key', () => {
    expect(shouldFire('port:3000')).toBe(true);
  });

  test('does not fire again within interval', () => {
    shouldFire('port:3000');
    expect(shouldFire('port:3000')).toBe(false);
  });

  test('fires again after interval has passed', () => {
    shouldFire('port:3000', 10);
    return new Promise(resolve => setTimeout(() => {
      expect(shouldFire('port:3000', 10)).toBe(true);
      resolve();
    }, 20));
  });

  test('different keys are independent', () => {
    shouldFire('port:3000');
    expect(shouldFire('port:4000')).toBe(true);
  });
});

describe('throttle', () => {
  test('calls fn on first invocation', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const throttled = throttle(fn, 1000);
    const result = await throttled('key1');
    expect(fn).toHaveBeenCalledWith('key1');
    expect(result).toBe('ok');
  });

  test('suppresses fn within interval and returns null', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const throttled = throttle(fn, 1000);
    await throttled('key1');
    const result = await throttled('key1');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});

describe('resetThrottle', () => {
  test('resets a specific key', () => {
    shouldFire('port:3000');
    resetThrottle('port:3000');
    expect(shouldFire('port:3000')).toBe(true);
  });

  test('resets all keys when called with no argument', () => {
    shouldFire('port:3000');
    shouldFire('port:4000');
    resetThrottle();
    expect(shouldFire('port:3000')).toBe(true);
    expect(shouldFire('port:4000')).toBe(true);
  });
});

describe('lastFiredAt', () => {
  test('returns null for unknown key', () => {
    expect(lastFiredAt('never')).toBeNull();
  });

  test('returns timestamp after firing', () => {
    const before = Date.now();
    shouldFire('port:9000');
    const ts = lastFiredAt('port:9000');
    expect(ts).toBeGreaterThanOrEqual(before);
  });
});
