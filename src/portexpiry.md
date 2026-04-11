# portexpiry

Tracks ports that haven't been seen in recent history and flags them as **stale**.

Useful for identifying lingering port references that may no longer be active in your dev environment.

## Functions

### `buildLastSeenMap(history)`
Takes an array of history entries (from `loadHistory()`) and returns a map of `"port/protocol" -> lastSeenTimestampMs`.

### `getStaleEntries(lastSeenMap, ttlMs?, now?)`
Filters the last-seen map and returns entries whose age exceeds the TTL. Defaults to `1 hour`. Results are sorted by age descending (oldest first).

Each result entry contains:
- `port` — port number
- `protocol` — e.g. `tcp`
- `lastSeenAt` — ISO timestamp of last observation
- `ageMs` — milliseconds since last seen

### `findStalePorts(ttlMs?)`
Convenience async function that loads history and returns stale ports in one call.

### `formatStaleEntry(entry)`
Formats a stale entry as a human-readable string:
```
5432/tcp — last seen 2024-01-01T10:00:00.000Z (2h 15m ago)
```

## Constants

- `DEFAULT_TTL_MS` — `3600000` (1 hour)

## Example

```js
const { findStalePorts, formatStaleEntry } = require('./portexpiry');

const stale = await findStalePorts();
for (const entry of stale) {
  console.log(formatStaleEntry(entry));
}
```
