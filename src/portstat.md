# portstat

Provides per-port connection statistics and enrichment utilities for portwatch.

## Functions

### `getConnectionCount(port)`
Returns the number of ESTABLISHED connections on the given port using `lsof`. Returns `0` if none found or on error.

### `getPortStat(entry)`
Builds a stat object for a single port entry including:
- `port`, `protocol`, `process`, `pid`
- `connections` — live ESTABLISHED connection count
- `timestamp` — ms since epoch when stat was captured

### `enrichWithStats(entries)`
Takes an array of port entries and returns a new array where each entry has an additional `stat` field populated by `getPortStat`.

### `summarizeStats(entries)`
Aggregates stats across all entries and returns:
- `totalPorts` — count of entries
- `totalConnections` — sum of all connection counts
- `busiestPort` — port number with most connections
- `busiestProcess` — process name on that port
- `generatedAt` — ISO timestamp

## Usage

```js
const { enrichWithStats, summarizeStats } = require('./portstat');

const entries = [{ port: 3000, process: 'node', pid: 1234 }];
const enriched = enrichWithStats(entries);
console.log(summarizeStats(enriched));
```

## Notes
- Only supported on macOS and Linux via `lsof`
- Connection count may be `0` in environments without active connections
