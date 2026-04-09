# Baseline Module

The `baseline` module lets you capture a snapshot of current port usage as a **named reference point**, then compare future scans against it.

This is different from the rolling snapshot/diff workflow — a baseline persists until explicitly cleared.

## API

### `saveBaseline(ports)`
Saves the given port list as the current baseline. Overwrites any existing baseline.

```js
const { saveBaseline } = require('./baseline');
saveBaseline(currentPorts);
```

### `loadBaseline()`
Loads the saved baseline. Returns `null` if none exists.

### `clearBaseline()`
Deletes the baseline file. Returns `true` if deleted, `false` if it didn't exist.

### `diffFromBaseline(currentPorts)`
Compares `currentPorts` against the saved baseline using `diffSnapshots`.

Returns:
```js
{
  hasBaseline: true,
  baselineTimestamp: '2024-01-01T00:00:00.000Z',
  added: [...],
  removed: [...]
}
```

If no baseline exists:
```js
{ hasBaseline: false, added: [], removed: [], unchanged: currentPorts }
```

## Storage

Baseline is stored as `baseline.json` in the portwatch config directory (default: `~/.portwatch/`).

## CLI Usage

```bash
portwatch baseline set     # save current ports as baseline
portwatch baseline diff    # compare current ports to baseline
portwatch baseline clear   # remove the baseline
```
