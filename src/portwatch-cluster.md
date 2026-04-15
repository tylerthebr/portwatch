# portwatch-cluster

Groups active port entries into logical **clusters** based on port proximity or shared process name.

## Functions

### `clusterByProximity(entries, gap?)`

Sorts entries by port number and groups them into clusters where consecutive ports are within `gap` of each other (default: `10`).

Returns an array of `{ start, end, entries }` objects.

```js
const { clusterByProximity } = require('./portwatch-cluster');
const clusters = clusterByProximity(entries, 5);
// [ { start: 3000, end: 3002, entries: [...] }, ... ]
```

### `clusterByProcess(entries)`

Groups entries by their `process` field. Entries without a process are grouped under `'unknown'`.

Returns a plain object mapping process name → entries array.

### `buildClusterReport(entries, gap?)`

Builds a combined report with both proximity clusters and process-based clusters.

```js
{
  proximity: [...],
  byProcess: { node: [...], postgres: [...] },
  total: 5,
  generatedAt: '2024-01-01T00:00:00.000Z'
}
```

### `formatCluster(cluster)`

Formats a single proximity cluster as a human-readable string:

```
[3000-3002] (3 ports): 3000, 3001, 3002
```

## Use Cases

- Visualizing which port ranges belong to the same service
- Detecting port sprawl from a single process
- Grouping diff results for cleaner output
