# portwatch-healthcheck

Activelyprobes ports on the watchlist and produces a health report.

## Functions

### `runHealthCheck(entries)`
Accepts an array of port entry objects (`{ port, host?, process? }`) and pings each one.
Returns a promise resolving to an array of health results:
```js
[
  { port: 3000, process: 'node', reachable: true, connections: 4,
    status: 'healthy', checkedAt: '...' }
]
```

### `checkWatchlist()`
Convenience wrapper that loads the current watchlist and runs `runHealthCheck` against it.

### `buildHealthReport(results)`
Turns a results array into a summary report:
```js
{ total, healthy, unreachable, score, results, generatedAt }
```
`score` is a 0–100 integer representing the percentage of healthy ports.

### `formatHealthReport(report)`
Returns a human-readable multi-line string suitable for CLI output.

## Usage
```js
const { checkWatchlist, buildHealthReport, formatHealthReport } =
  require('./portwatch-healthcheck');

const results = await checkWatchlist();
const report  = buildHealthReport(results);
console.log(formatHealthReport(report));
```

## Integration
Pairs naturally with `portwatch-watchdog`, `portwatch-reachability`, and `portwatch-badge`
to surface health status in dashboards or CI pipelines.
