# portwatch-pin

Pin specific ports for priority tracking. Pinned ports are highlighted in diffs and can trigger elevated alerts.

## API

### `pinPort(port, label?)`
Pin a port by number with an optional human-readable label. Returns the pin entry.

### `unpinPort(port)`
Remove a pin. Returns `true` if the pin existed, `false` otherwise.

### `isPinned(port)`
Returns `true` if the given port is currently pinned.

### `listPins()`
Returns an array of all pinned port entries `{ port, label, pinnedAt }`.

### `clearPins()`
Removes all pins.

### `filterPinned(entries)`
Filters an array of port entries to only those that are pinned.

## Storage

Pins are stored in `~/.portwatch/pins.json`.

## Example

```js
const { pinPort, listPins } = require('./portwatch-pin');

pinPort(3000, 'React dev server');
pinPort(5432, 'Postgres');

console.log(listPins());
// [ { port: 3000, label: 'React dev server', pinnedAt: '...' }, ... ]
```
