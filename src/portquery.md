# portquery

A lightweight query interface for filtering and looking up port entries using simple expression strings.

## API

### `parseQuery(queryStr)`
Parses a space-separated query string into a filter options object.

Supported keys:
- `port=<number>` — exact port number
- `proto=<tcp|udp>` — protocol filter
- `process=<name>` — process name filter
- `range=<lo>-<hi>` — port range filter

```js
parseQuery('proto=tcp process=node')
// => { protocol: 'tcp', process: 'node' }
```

### `queryPorts(entries, queryStr)`
Filters an array of port entries using a query string.

```js
queryPorts(entries, 'proto=tcp range=3000-9000')
```

### `lookupPort(portMap, port)`
Returns a single entry from a portmap by port number, or `null`.

```js
const entry = lookupPort(portMap, 3000);
```

### `matchesQuery(entry, queryStr)`
Returns `true` if a single entry satisfies the query.

```js
matchesQuery(entry, 'process=node') // true or false
```

## Usage in CLI

```
portwatch query "proto=tcp range=3000-9000"
```
