# portwatch-watchdog

The watchdog module checks active port entries against user-defined expectations from the watchlist and fires events when violations are detected.

## Overview

When portwatch scans ports, the watchdog can be invoked to verify that watched ports are being used by the expected process and protocol. Any mismatch triggers a `watchdog:violation` event via `portevents`.

Ignored ports (from `ignore.js`) are automatically excluded from watchdog checks.

## API

### `checkViolation(entry, watchlist)`
Checks a single port entry against the watchlist. Returns a violation object or `null`.

**Violation types:**
- `process_mismatch` — the port is held by an unexpected process
- `protocol_mismatch` — the port is using an unexpected protocol

### `runWatchdog(entries)`
Runs the watchdog over an array of port entries. Loads the watchlist and ignore list automatically. Returns an array of violations.

### `dispatchViolations(violations)`
Emits `watchdog:violation` events for each violation, respecting the global throttle to avoid flooding. Returns the count of violations dispatched.

### `formatViolation(violation)`
Returns a human-readable string describing a single violation.

## Example

```js
const { runWatchdog, dispatchViolations, formatViolation } = require('./portwatch-watchdog');

const entries = await scanPorts();
const violations = runWatchdog(entries);
dispatchViolations(violations);
violations.forEach(v => console.log(formatViolation(v)));
```

## Integration

The watchdog integrates with:
- `src/watchlist.js` — source of expected port definitions
- `src/ignore.js` — ports to skip
- `src/portevents.js` — event bus for violation notifications
- `src/throttle.js` — prevents repeated alerts for the same violation
