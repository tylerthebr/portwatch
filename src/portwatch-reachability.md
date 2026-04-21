# portwatch-reachability

TCP reachability probing for open ports discovered by portwatch.

## Overview

While `portwatch` tracks which ports are *listed* by the OS, a port may appear
open in `netstat`/`ss` output but not actually accept connections (e.g. in a
TIME_WAIT state or behind a firewall rule). This module performs live TCP
handshake probes to confirm real reachability.

## API

### `probePort(port, host?, timeout?)`

Opens a TCP socket to `host:port`. Returns a promise resolving to:

```js
{ port, host, reachable: boolean, latencyMs: number }
```

Default host is `127.0.0.1`, default timeout is `1500ms`.

### `checkReachability(entries, host?, timeout?)`

Runs `probePort` concurrently over an array of port-entry objects.
Returns the same array annotated with `reachable` and `latencyMs` fields.

### `buildReachabilityReport(entries)`

Builds a summary report object from annotated entries:

```js
{
  total, reachableCount, unreachableCount,
  avgLatencyMs,   // null if no reachable entries
  reachable: [...],
  unreachable: [...]
}
```

### `formatReachabilityReport(report)`

Returns a human-readable multi-line string suitable for CLI output.

## Usage

```js
const { checkReachability, buildReachabilityReport, formatReachabilityReport } =
  require('./portwatch-reachability');

const entries = await scanPorts();
const annotated = await checkReachability(entries);
const report = buildReachabilityReport(annotated);
console.log(formatReachabilityReport(report));
```

## Notes

- Probes are run concurrently — large port lists may briefly spike file-descriptor usage.
- Only TCP is supported; UDP reachability requires a different approach.
