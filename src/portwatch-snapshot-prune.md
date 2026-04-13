# portwatch-snapshot-prune

Prunes old or excess snapshot/history entries to keep storage manageable.

## Functions

### `getPruneConfig(config?)`
Returns a resolved prune configuration with defaults:
- `maxAgeDays` (default: 30) — remove entries older than this many days
- `maxCount` (default: 100) — keep at most this many entries (newest wins)

### `pruneByAge(entries, maxAgeDays)`
Filters out history entries whose `timestamp` is older than `maxAgeDays` days from now.

### `pruneByCount(entries, maxCount)`
If `entries.length > maxCount`, trims the oldest entries, retaining the most recent `maxCount`.

### `pruneHistory(entries, config?)`
Applies both `pruneByAge` and `pruneByCount` in sequence.

### `buildPruneReport(before, after)`
Returns a summary object:
```json
{ "before": 42, "after": 30, "removed": 12, "oldest": "...", "newest": "..." }
```

### `formatPruneReport(report)`
Formats the prune report as a human-readable string for CLI output.

## Usage
```js
const { pruneHistory, buildPruneReport, formatPruneReport } = require('./portwatch-snapshot-prune');
const { loadHistory, saveHistory } = require('./history');

const history = loadHistory();
const pruned = pruneHistory(history, { maxAgeDays: 14, maxCount: 50 });
saveHistory(pruned);
console.log(formatPruneReport(buildPruneReport(history, pruned)));
```
