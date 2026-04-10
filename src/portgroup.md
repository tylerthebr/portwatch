# portgroup

Groups port entries into logical buckets for display and analysis.

## Functions

### `groupByProcess(entries)`
Returns a map of `processName -> entries[]`. Entries missing a `process` field are placed under `"unknown"`.

### `groupByRange(entries, ranges)`
Accepts a `ranges` array of `{ name, from, to }` objects and sorts each entry into the matching bucket. Entries that don't fit any range go into `"other"`.

```js
const ranges = [
  { name: 'dev',  from: 3000, to: 3999 },
  { name: 'db',   from: 5400, to: 5499 },
];
groupByRange(entries, ranges);
// { dev: [...], db: [...], other: [...] }
```

### `groupByTag(entries)`
Looks up each entry's port in the tags store (via `getTag` from `tags.js`) and groups accordingly. Untagged ports land in `"untagged"`.

### `summarizeGroups(grouped)`
Flattens a grouped map into a sorted array of `{ group, count }` objects, ordered by count descending. Useful for quick reporting.

## Usage

```js
const { groupByProcess, summarizeGroups } = require('./portgroup');

const grouped = groupByProcess(entries);
console.table(summarizeGroups(grouped));
```

## Notes
- Depends on `tags.js` only for `groupByTag`.
- All other functions are pure with no side effects.
