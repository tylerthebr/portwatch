# Scheduler Module

The `scheduler.js` module provides automatic, interval-based port scanning for `portwatch`.

## Overview

Instead of running a one-shot scan, the scheduler continuously monitors port usage at a configurable interval and reacts to changes automatically.

## API

### `startScheduler(intervalMs)`
Starts the background scan loop. Logs a message and sets up a `SIGINT` handler for clean exit.

- `intervalMs` — polling interval in milliseconds (e.g. `5000` for every 5 seconds)

### `stopScheduler()`
Clears the interval and resets internal state. Safe to call even if not running.

### `runScan(label?)`
Performs a single scan cycle:
1. Loads current config
2. Scans active ports
3. Loads previous snapshot
4. Diffs old vs new
5. If changes found: prints diff, sends notifications, appends to history
6. Saves new snapshot

Returns the `diff` object `{ added, removed }`.

### `isRunning()`
Returns `true` if the scheduler interval is currently active.

## Usage in CLI

```bash
# watch mode (configured in bin/portwatch.js)
portwatch watch --interval 10
```

The `--interval` flag is in seconds and defaults to `5`.
