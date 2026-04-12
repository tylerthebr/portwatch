# portwatch-timeline

Builds and formats a chronological timeline of port events from scan history.

## Functions

### `buildTimeline(history)`

Converts raw history entries into a sorted timeline of port change events.

- Filters out entries with no changes (empty diffs)
- Sorts ascending by timestamp
- Returns an array of `{ timestamp, added, removed, total }` objects

### `timelineForPort(timeline, port)`

Filters a timeline down to only entries that include a specific port number.

Useful for tracing the lifecycle of a single port across multiple scans.

### `formatTimeline(timeline)`

Renders a timeline as a human-readable string.

Output format:
```
[2024-01-01 10:00:00]
  + 3000/tcp  node
[2024-01-01 11:00:00]
  + 5432/tcp  postgres
  - 3000/tcp  node
```

### `loadTimeline(configDir)`

Convenience function that loads history from disk and builds a timeline in one step.

## Usage

```js
const { loadTimeline, formatTimeline, timelineForPort } = require('./portwatch-timeline');

const timeline = loadTimeline(configDir);
console.log(formatTimeline(timeline));

// trace a specific port
const port3000Events = timelineForPort(timeline, 3000);
```

## Notes

- Depends on `history.js` for loading persisted scan history
- Depends on `formatter.js` for timestamp formatting
- Timeline entries with zero changes are excluded automatically
