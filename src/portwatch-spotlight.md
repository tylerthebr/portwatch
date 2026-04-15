# portwatch-spotlight

Highlights ports of interest by aggregating appearance frequency, associated processes, and time range across all recorded history snapshots.

## Functions

### `buildSpotlightIndex(history)`
Builds a full index of all ports seen across the provided history array. Returns an array of spotlight entries, each containing:
- `port` / `protocol`
- `seenCount` — number of snapshots the port appeared in
- `processes` — unique process names observed
- `firstSeen` / `lastSeen` — timestamps

### `spotlightPort(port, history)`
Looks up a single port's spotlight entry. Returns `null` if not found.

### `topSpotlightPorts(history, n = 10)`
Returns the top `n` ports sorted by `seenCount` descending.

### `formatSpotlight(entry)`
Formats a spotlight entry into a human-readable string. Incorporates well-known port labels and aliases if available.

## Usage

```js
const { loadHistory } = require('./history');
const { topSpotlightPorts, formatSpotlight } = require('./portwatch-spotlight');

const history = loadHistory();
const top = topSpotlightPorts(history, 5);
top.forEach(e => console.log(formatSpotlight(e)));
```

## Notes
- History entries are expected to have `{ timestamp, ports: [{ port, protocol, process }] }` shape.
- Integrates with `portlabel` and `portaliases` for enriched output.
