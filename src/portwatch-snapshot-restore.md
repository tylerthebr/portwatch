# portwatch-snapshot-restore

Restores a previous port snapshot from history, allowing you to roll back the active snapshot to any recorded state.

## Functions

### `findSnapshotByIndex(history, index)`
Returns a history entry by numeric index. Supports negative indexing (`-1` = latest).

### `findSnapshotByTimestamp(history, timestamp)`
Finds the first history entry whose timestamp starts with the given string (supports partial matches like `"2024-01-15"`).

### `restoreSnapshot(entry, options)`
Restores the given history entry as the active snapshot.

Options:
- `label` (string): A label recorded in the restore log. Default: `'restored'`
- `dry` (boolean): If true, performs a dry run without writing. Default: `false`

Returns a result object with `{ ports, timestamp, label, dry }`.

### `formatRestoreResult(result)`
Formats a restore result into a human-readable string.

### `loadRestoreLog()` / `saveRestoreLog(log)`
Load or persist the restore audit log at `~/.portwatch/restore-log.json`.

## Example

```js
const { loadHistory } = require('./history');
const { findSnapshotByIndex, restoreSnapshot, formatRestoreResult } = require('./portwatch-snapshot-restore');

const history = loadHistory();
const entry = findSnapshotByIndex(history, -1); // latest
const result = restoreSnapshot(entry, { label: 'pre-deploy' });
console.log(formatRestoreResult(result));
```

## Restore Log

Each restore is recorded in `~/.portwatch/restore-log.json`:
```json
[
  { "restoredAt": "2024-01-15T12:00:00Z", "from": "2024-01-14T09:00:00Z", "label": "pre-deploy" }
]
```
