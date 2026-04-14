# portwatch-stale

Detects ports that haven't been seen in recent history snapshots — useful for identifying zombie or abandoned services.

## Functions

### `buildLastSeenMap(history)`
Builds a map of `port/proto` keys to their most recent observed timestamp and port metadata.

```js
const map = buildLastSeenMap(history);
// { '3000/tcp': { ts: 1700000000000, port: { port: 3000, proto: 'tcp', process: 'node' } } }
```

### `getStaleEntries(history, thresholdMs?)`
Returns entries not seen within `thresholdMs` (default: 24 hours). Sorted by `lastSeenAt` ascending.

```js
const stale = getStaleEntries(history, 12 * 60 * 60 * 1000);
```

### `formatStaleEntry(entry)`
Formats a stale entry as a human-readable string for CLI output.

```
  3000/tcp (node) — last seen 2024-01-01T00:00:00.000Z
```

### `buildStaleReport(history, thresholdMs?)`
Returns a structured report object with `count`, `entries`, `thresholdMs`, and `generatedAt`.

## Usage

```js
const { loadHistory } = require('./history');
const { buildStaleReport, formatStaleEntry } = require('./portwatch-stale');

const history = loadHistory();
const report = buildStaleReport(history);
console.log(`${report.count} stale port(s) found:`);
report.entries.forEach(e => console.log(formatStaleEntry(e)));
```
