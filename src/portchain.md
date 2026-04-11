# portchain

Chain multiple port processing operations into a sequential pipeline.

## Overview

`portchain` lets you compose filter, resolve, label, and stats enrichment steps into a single pipeline that runs against a list of port entries.

## API

### `buildChain(steps)`
Accepts an array of `{ name, fn }` step objects (falsy values are stripped).
Returns a clean chain array.

### `runChain(entries, chain, opts?)`
Runs each step in order against `entries`. Async-safe — each step may return a Promise.

- `opts.strict` — if `true`, throws on any step failure. Default: `false` (skips bad steps).

### `defaultChain(opts)`
Builds a standard chain from boolean/config flags:

| opt | step added |
|---|---|
| `filter` | `applyFilters` |
| `resolve` | `enrichEntries` |
| `label` | `annotateEntries` |
| `stats` | `enrichWithStats` |

### `processEntries(entries, opts?)`
Convenience wrapper — builds default chain and runs it in one call.

## Example

```js
const { processEntries } = require('./portchain');

const enriched = await processEntries(rawEntries, {
  filter: { protocol: 'tcp' },
  resolve: true,
  label: true,
});
```
