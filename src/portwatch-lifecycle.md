# portwatch-lifecycle

Tracks the full lifecycle of ports observed across history snapshots.

## Overview

`portwatch-lifecycle` analyzes historical snapshot data to compute per-port lifecycle metrics including first/last seen timestamps, total appearance count, uptime duration, and average gap between appearances.

## API

### `buildLifecycleMap(history)`

Builds a map keyed by `port/protocol` from an array of history entries. Each value contains:
- `firstSeen` / `lastSeen` — ISO timestamps
- `appearances` — total number of snapshots the port appeared in
- `gaps` — array of millisecond gaps between consecutive appearances
- `process` — process name from first appearance

### `calcUptimeDuration(entry)`

Returns the total elapsed time in milliseconds between `firstSeen` and `lastSeen`.

### `getLifecycleForPort(port, protocol, history)`

Lookup helper — returns the lifecycle entry for a specific port/protocol pair, or `null` if not found.

### `buildLifecycleReport(history)`

Returns a full array of lifecycle entries enriched with:
- `uptimeMs` — total uptime in milliseconds
- `avgGapMs` — average gap between appearances in milliseconds

### `formatLifecycleEntry(entry)`

Formats a lifecycle entry as a human-readable string for CLI output.

## Example

```js
const { buildLifecycleReport, formatLifecycleEntry } = require('./portwatch-lifecycle');
const { loadHistory } = require('./history');

const history = loadHistory();
const report = buildLifecycleReport(history);
report.forEach(e => console.log(formatLifecycleEntry(e)));
```

## Notes

- Ports that appear only once will have `gaps: []` and `avgGapMs: 0`
- Useful for identifying long-lived vs transient ports
- Pairs well with `portwatch-decay` and `portwatch-stale`
