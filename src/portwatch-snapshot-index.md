# portwatch-snapshot-index

Builds and maintains a lightweight index of all snapshots stored in history, enabling fast lookup by label, tag, or date without scanning the full history file.

## Functions

### `getIndexPath(configDir?)`
Returns the file path to the snapshot index JSON file.

### `loadIndex(configDir?)`
Loads the index from disk. Returns an empty array if the file does not exist.

### `saveIndex(entries, configDir?)`
Persists the given index entries to disk.

### `buildIndex(configDir?)`
Reads the full history and constructs an index array. Each entry contains:
- `index` — position in history
- `timestamp` — ISO timestamp
- `portCount` — number of ports in the snapshot
- `label` — optional label string
- `tag` — optional tag string

### `rebuildIndex(configDir?)`
Runs `buildIndex` and immediately saves the result. Returns the new index.

### `findByLabel(label, configDir?)`
Returns all index entries whose `label` matches the given string.

### `findByTag(tag, configDir?)`
Returns all index entries whose `tag` matches the given string.

### `findByDate(dateStr, configDir?)`
Returns all index entries whose `timestamp` starts with `dateStr` (e.g. `'2024-06-01'` or `'2024-06'`).

## Usage

```js
const { rebuildIndex, findByLabel } = require('./portwatch-snapshot-index');

rebuildIndex();
const devSnapshots = findByLabel('dev');
console.log(devSnapshots);
```
