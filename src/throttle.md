# throttle.js

Rate-limits repeated actions in portwatch to prevent alert flooding during rapid port churn.

## Purpose

When ports open and close quickly (e.g., during a dev server restart), the same alert or notification could fire dozens of times. `throttle.js` ensures each unique event key can only trigger an action once per configured interval.

## API

### `shouldFire(key, intervalMs?)`
Returns `true` if the action for `key` is allowed to fire. Subsequent calls within `intervalMs` (default 5000ms) return `false`.

### `throttle(fn, intervalMs?)`
Wraps an async function so it is silently skipped (returns `null`) if called again for the same key within the interval.

```js
const { throttle } = require('./throttle');
const throttledNotify = throttle(sendNotification, 10000);
await throttledNotify('port:3000', payload);
```

### `resetThrottle(key?)`
Clears throttle state for a specific key, or all keys if called with no argument. Useful in tests or after a manual scan reset.

### `lastFiredAt(key)`
Returns the Unix timestamp (ms) of the last firing for a key, or `null` if it has never fired.

## Integration

- Used by `notifier.js` to suppress duplicate notifications.
- Used by `alerts.js` to debounce repeated alert triggers for the same port.
- Keys are typically formatted as `port:<number>` or `alert:<ruleName>`.
