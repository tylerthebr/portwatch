# portping

TCP reachability checks for discovered ports.

## Overview

`portping` attempts a real TCP connection to verify whether a port is actually accepting connections — useful for filtering stale or zombie entries from scan results.

## API

### `pingPort(port, host?, timeout?)`

Pings a single port. Returns a result object:

```js
{ port: 3000, host: '127.0.0.1', open: true, latencyMs: 4 }
```

- `port` — TCP port number
- `host` — defaults to `127.0.0.1`
- `timeout` — ms before giving up, defaults to `2000`

### `pingPorts(ports, host?, timeout?)`

Pings multiple ports in parallel. Returns an array of result objects.

### `filterReachable(entries, host?, timeout?)`

Accepts an array of port entry objects (must have a `.port` field) and returns only those whose ports respond to a TCP connection.

## Usage

```js
const { filterReachable } = require('./portping');

const entries = await loadSnapshot();
const live = await filterReachable(entries);
console.log('Live ports:', live.map(e => e.port));
```

## Notes

- Uses Node's built-in `net` module — no extra dependencies.
- A port may appear in `ss`/`lsof` output but not yet be accepting connections; this catches that case.
- Timeout is per-port; all pings run concurrently via `Promise.all`.
