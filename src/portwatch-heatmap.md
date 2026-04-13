# portwatch-heatmap

Builds a frequency heatmap of port activity over time, bucketed by hour (or custom interval).

## Functions

### `buildHeatmap(historyEntries, bucketSize?)`
Groups history entries into time buckets and counts how often each port appears.
- `historyEntries` — array of history objects with `{ timestamp, ports[] }`
- `bucketSize` — bucket width in ms (default: 1 hour)
- Returns `{ [bucketKey]: { ["port/proto"]: count } }`

### `getBucketKey(timestamp, bucketSize?)`
Rounds a timestamp down to the nearest bucket boundary and returns an ISO string.

### `getHotPorts(heatmap, topN?)`
Aggregates counts across all buckets and returns the top N most-seen ports.
- Returns `[{ key: "3000/tcp", count: 12 }, ...]`

### `formatHeatmap(heatmap)`
Renders a human-readable summary of the heatmap, sorted by time bucket.

## Example

```js
const { buildHeatmap, getHotPorts, formatHeatmap } = require('./portwatch-heatmap');
const history = loadHistory();
const heatmap = buildHeatmap(history);
console.log(formatHeatmap(heatmap));
console.log('Hot ports:', getHotPorts(heatmap, 3));
```

## Output format

```
  2024-01-01T01:00:00.000Z: 3000/tcp(5), 8080/tcp(2)
  2024-01-01T02:00:00.000Z: 5432/tcp(3)
```
