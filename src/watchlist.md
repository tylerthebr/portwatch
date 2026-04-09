# Watchlist Module

The `watchlist` module lets users pin specific ports they care about. Watchlisted ports get priority in diff output and can trigger stricter alerting.

## API

### `loadWatchlist() → Entry[]`
Returns all currently watched ports.

### `addToWatchlist(port, label?) → boolean`
Adds a port to the watchlist. Returns `false` if already present.

### `removeFromWatchlist(port) → boolean`
Removes a port. Returns `false` if not found.

### `isWatched(port) → boolean`
Checks if a port is on the watchlist.

### `clearWatchlist() → void`
Removes all entries.

## Entry Shape
```json
{
  "port": 3000,
  "label": "dev server",
  "addedAt": "2024-01-01T00:00:00.000Z"
}
```

## Storage
Stored in `~/.portwatch/watchlist.json`.

## Usage
Watchlisted ports are highlighted in `portwatch diff` output and can be paired with the alert system to notify on any state change regardless of global thresholds.
