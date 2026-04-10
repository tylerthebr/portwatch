# portmap

Builds a unified, enriched port map from active port entries by merging data from watchlists, tags, port labels, and profiles.

## Functions

### `buildPortMap(entries, profileName?)`

Takes an array of raw port entries (from `scanner.js`) and returns a map keyed by port number. Each entry is enriched with:

- `label` — well-known service name (e.g. `HTTP`) or process name fallback
- `tags` — any user-defined tags for this port
- `watched` — whether the port is on the watchlist
- `profileMatch` — whether the port belongs to the given profile

```js
const { buildPortMap } = require('./portmap');
const map = buildPortMap(entries, 'work');
console.log(map[3000]); // { port: 3000, label: 'node', tags: ['dev'], watched: true, ... }
```

### `flattenPortMap(portMap)`

Converts the map back into a sorted array of entries (ascending by port number). Useful for display and export.

### `getPortEntry(portMap, port)`

Looks up a single port entry by number. Returns `null` if not found.

### `getWatchedEntries(portMap)`

Filters the map to return only entries marked as `watched: true`.

## Dependencies

- `src/watchlist.js` — watched port list
- `src/tags.js` — user-defined port tags
- `src/portlabel.js` — well-known port labels
- `src/profile.js` — named port profiles
