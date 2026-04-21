# portwatch-coverage

Tracks which ports from your watchlist have actually been observed across one or more snapshots, reporting coverage gaps.

## Functions

### `buildCoverageMap(watchlist, snapshots)`
Returns a `Map<port, boolean>` indicating whether each watched port appeared in any of the provided snapshots.

### `calcCoverageRatio(coverageMap)`
Returns a float between 0 and 1 representing the fraction of watched ports that were seen. Returns `1` if the watchlist is empty.

### `getMissingPorts(coverageMap)`
Returns a sorted array of port numbers that were never observed.

### `buildCoverageReport(watchlist, snapshots)`
Returns a report object:
```js
{
  total: 3,
  seen: 2,
  missing: [5000],
  ratio: 0.667,
  percent: 67
}
```

### `formatCoverageReport(report)`
Formats the coverage report as a human-readable string for CLI output.

## Example

```js
const { buildCoverageReport, formatCoverageReport } = require('./portwatch-coverage');
const { loadWatchlist } = require('./watchlist');
const { loadHistory } = require('./history');

const watchlist = await loadWatchlist();
const history = await loadHistory();
const report = buildCoverageReport(watchlist, history);
console.log(formatCoverageReport(report));
```

## Use Case

Useful for validating that your watchlist is actively being hit — if certain ports never appear in snapshots, they may be misconfigured, offline, or no longer relevant.
