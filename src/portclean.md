# portclean

Identifies stale and redundant port entries to help keep your dev environment tidy.

## Functions

### `findStaleEntries(current, threshold?)`
Compares current entries against recent history snapshots. Any entry not consistently present across the last `threshold` snapshots (default: 2) is flagged as stale.

```js
const { findStaleEntries } = require('./portclean');
const stale = findStaleEntries(currentEntries, 3);
```

### `findDuplicates(entries)`
Groups entries by port number and returns groups where more than one process is bound to the same port.

```js
const { findDuplicates } = require('./portclean');
const dupes = findDuplicates(entries);
// [ [{ port: 3000, pid: 101 }, { port: 3000, pid: 202 }] ]
```

### `excludeIgnored(entries)`
Strips out any entries whose port appears in the current ignore list (via `src/ignore.js`).

### `buildCleanupReport(current)`
Runs all checks and returns a unified report:

```js
{
  stale: [...],
  duplicates: [...],
  suggestions: [
    { type: 'stale', port: 8080, pid: 303, process: 'python' },
    { type: 'duplicate', port: 3000, pid: 999, process: 'other' }
  ],
  total: 2
}
```

## Notes
- Ignored ports are excluded before any analysis
- Requires at least `threshold` history entries to detect stale ports
- Duplicate detection is purely count-based per port number
