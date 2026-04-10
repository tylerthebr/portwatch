# summary.js

Provides snapshot and diff summarisation utilities for portwatch.

## Functions

### `buildSummary(snapshot)`

Accepts a port snapshot object (keyed by port number) and returns a summary:

```js
{
  totalPorts: 4,
  protocols: { tcp: 3, udp: 1 },
  topProcesses: [ { name: 'node', count: 2 }, ... ],
  generatedAt: '2024-01-15 10:30:00'
}
```

### `buildDiffSummary(diff)`

Accepts a diff array (as produced by `diffSnapshots`) and returns counts of opened, closed, and changed ports:

```js
{
  opened: 2,
  closed: 1,
  changed: 0,
  total: 3,
  openedPorts: [3000, 4000],
  closedPorts: [8080]
}
```

### `getTopProcesses(processMap, n)`

Internal helper — sorts a `{ processName: count }` map and returns the top `n` entries as `[{ name, count }]`.

### `formatSummary(summary)`

Formats a summary object (from `buildSummary`) into a human-readable multi-line string suitable for CLI output.

## Usage

```js
const { buildSummary, formatSummary } = require('./summary');
const snapshot = loadSnapshot();
const summary = buildSummary(snapshot);
console.log(formatSummary(summary));
```
