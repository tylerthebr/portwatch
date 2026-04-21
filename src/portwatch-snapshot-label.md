# portwatch-snapshot-label

Assign human-readable labels to snapshots for easier identification and comparison.

## Overview

Snapshot IDs are timestamps or hashes — hard to remember. This module lets you tag any snapshot with a short label like `"before-deploy"` or `"stable-baseline"` so you can reference it by name in other commands.

Labels are stored in `~/.portwatch/snapshot-labels.json`.

## API

### `setSnapshotLabel(snapshotId, label)`
Assigns a label to a snapshot. Overwrites any existing label for that ID.

### `getSnapshotLabel(snapshotId)`
Returns the label entry `{ label, createdAt }` or `null` if not found.

### `removeSnapshotLabel(snapshotId)`
Removes the label for a snapshot. Returns `true` if removed, `false` if not found.

### `listSnapshotLabels()`
Returns all stored labels as a plain object keyed by snapshot ID.

### `resolveLabel(snapshotId)`
Returns the label string if set, otherwise returns the raw `snapshotId`.

### `formatLabelEntry(snapshotId, entry)`
Formats a label entry as a human-readable string for display.

## Usage

```js
const { setSnapshotLabel, resolveLabel } = require('./portwatch-snapshot-label');

setSnapshotLabel('2024-06-01T10:00:00Z', 'pre-release');
console.log(resolveLabel('2024-06-01T10:00:00Z')); // 'pre-release'
```

## Storage

```json
{
  "2024-06-01T10:00:00Z": {
    "label": "pre-release",
    "createdAt": "2024-06-01T10:05:00.000Z"
  }
}
```
