# portmetrics

Aggregates port usage metrics across historical snapshots.

## Functions

### `buildOccurrenceMap(history)`
Returns a map of `port/protocol` → count of appearances across all history entries.

### `calcUptimeRatios(history)`
Returns a map of `port/protocol` → uptime ratio (0.0–1.0) based on how often each port appeared relative to total snapshots.

### `findTransientPorts(history)`
Returns a list of `port/protocol` strings that appeared in only one snapshot — useful for filtering noise.

### `buildMetricsReport(history)`
Builds a full metrics report object containing:
- `totalSnapshots` — number of history entries analyzed
- `uniquePorts` — count of distinct port/protocol combinations seen
- `occurrences` — raw occurrence counts per port
- `uptimeRatios` — uptime ratios per port
- `transientPorts` — list of ports seen only once
- `generatedAt` — ISO timestamp of report generation

## Usage

```js
const { buildMetricsReport } = require('./portmetrics');
const { loadHistory } = require('./history');

const history = loadHistory();
const report = buildMetricsReport(history);
console.log(report);
```

## Notes
- Designed to work with history entries produced by `src/history.js`
- Pairs well with `porttrend.js` and `portrank.js` for deeper analysis
