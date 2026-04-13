# portwatch-archive

Archives the current port-watch history into a named, persistent snapshot for long-term reference.

## Purpose

While `history.js` tracks recent port activity, the archive module lets you **freeze** a labelled copy of history at any point in time. Useful for comparing environments before/after deployments or capturing end-of-day state.

## API

### `archiveHistory(label?)`
Captures the current history and saves it as an archive entry. Returns the entry or `null` if history is empty.

### `loadArchive()`
Returns all saved archive entries as an array.

### `getArchiveById(id)`
Looks up a single archive entry by its generated ID.

### `removeArchive(id)`
Deletes an archive entry by ID and returns the updated list.

### `clearArchive()`
Removes all archive entries.

### `formatArchiveList(archive)`
Returns a human-readable string listing all archive entries.

## Storage

Archives are stored in `~/.portwatch/archive.json`.

## Example

```js
const { archiveHistory, formatArchiveList, loadArchive } = require('./portwatch-archive');

const entry = archiveHistory('pre-deploy snapshot');
console.log('Archived:', entry.id);
console.log(formatArchiveList(loadArchive()));
```

## Archive Entry Shape

```json
{
  "id": "archive-1700000000000",
  "label": "pre-deploy snapshot",
  "createdAt": "2024-01-15T12:00:00.000Z",
  "entryCount": 14,
  "snapshot": [ ... ]
}
```
