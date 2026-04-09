/**
 * throttle.js
 * Rate-limits repeated scan/alert actions to avoid flooding output or notifications.
 */

const DEFAULT_INTERVAL_MS = 5000;

const _lastFired = new Map();

/**
 * Returns true if the action identified by `key` is allowed to fire.
 * Enforces a minimum interval between firings.
 */
function shouldFire(key, intervalMs = DEFAULT_INTERVAL_MS) {
  const now = Date.now();
  const last = _lastFired.get(key);
  if (last === undefined || now - last >= intervalMs) {
    _lastFired.set(key, now);
    return true;
  }
  return false;
}

/**
 * Wraps an async function so it is throttled per unique key.
 * @param {Function} fn - async function(key, ...args)
 * @param {number} intervalMs
 */
function throttle(fn, intervalMs = DEFAULT_INTERVAL_MS) {
  return async function throttled(key, ...args) {
    if (!shouldFire(key, intervalMs)) {
      return null;
    }
    return fn(key, ...args);
  };
}

/**
 * Resets the throttle state for a specific key or all keys.
 */
function resetThrottle(key) {
  if (key !== undefined) {
    _lastFired.delete(key);
  } else {
    _lastFired.clear();
  }
}

/**
 * Returns the timestamp (ms) of the last firing for a key, or null.
 */
function lastFiredAt(key) {
  return _lastFired.get(key) ?? null;
}

module.exports = { shouldFire, throttle, resetThrottle, lastFiredAt, DEFAULT_INTERVAL_MS };
