# portwatch-cooldown

Manages cooldown periods to suppress repeated alerts for the same port within a configurable time window.

## Purpose

When a port flaps or triggers repeated events in quick succession, the cooldown module prevents alert fatigue by silencing duplicate notifications until the cooldown period expires.

## API

### `setCooldown(port, durationMs)`
Mark a port as cooling down for `durationMs` milliseconds (default: 60000).

### `isOnCooldown(port)`
Returns `true` if the port currently has an active cooldown.

### `clearCooldown(port)`
Remove the cooldown for a specific port immediately.

### `clearAllCooldowns()`
Remove all active cooldowns.

### `getActiveCooldowns()`
Returns an array of all ports currently on cooldown:
```js
[
  { port: 3000, expiresAt: 1700000000000, remainingMs: 45000, durationMs: 60000 }
]
```

### `pruneExpired()`
Removes expired cooldown entries from disk. Call periodically to keep the file clean.

## Storage

Cooldowns are persisted to `~/.portwatch/cooldowns.json` so they survive process restarts.

## Usage Example

```js
const { setCooldown, isOnCooldown } = require('./portwatch-cooldown');

if (!isOnCooldown(port)) {
  sendAlert(port);
  setCooldown(port, 5 * 60 * 1000); // 5 minute cooldown
}
```
