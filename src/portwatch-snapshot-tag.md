# portwatch-snapshot-tag

Tag named snapshots for easy reference and retrieval in portwatch.

## Overview

Allows users to assign human-readable tags (e.g. `v1`, `prod`, `before-deploy`) to snapshot IDs so they can be referenced by name in comparisons, replays, and reports.

## API

### `tagSnapshot(tag, snapshotId)`
Associates `tag` with a given `snapshotId`. Overwrites any existing mapping for that tag.

### `untagSnapshot(tag)`
Removes the tag entry. Returns `true` if removed, `false` if not found.

### `getSnapshotIdByTag(tag)`
Returns the `snapshotId` for a given tag, or `null` if not found.

### `listSnapshotTags()`
Returns all current tag → snapshotId mappings.

### `clearSnapshotTags()`
Removes all tags.

## Storage

Tags are stored in `~/.portwatch/snapshot-tags.json`.

## Example

```js
const { tagSnapshot, getSnapshotIdByTag } = require('./portwatch-snapshot-tag');

tagSnapshot('before-deploy', '2024-06-01T10:00:00Z');
const id = getSnapshotIdByTag('before-deploy');
// id === '2024-06-01T10:00:00Z'
```

## Integration

Used by `portwatch-compare` and `portwatch-snapshot-diff` to resolve named references when comparing snapshots.
