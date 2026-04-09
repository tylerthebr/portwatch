# Watcher Module

The `watcher` module ties together scanning, snapshotting, diffing, history, and notifications into a single continuous monitoring loop.

## API

### `startWatcher(scanFn, options)`
Starts the port watcher loop.
- `scanFn` — async function that returns the current list of open ports
- `options.interval` — polling interval in ms (falls back to config, then 5000)
- `options.label` — snapshot label key (default: `'watcher'`)

### `stopWatcher()`
Stops the running watcher loop.

### `onWatcherChange(callback)`
Registers a callback invoked whenever port changes are detected.
```js
onWatcherChange((diff) => {
  console.log('Ports changed:', diff);
});
```

### `watcherStatus()`
Returns `{ running: boolean }` reflecting the current watcher state.

## Flow

```
startWatcher()
  └─ scheduler tick
       ├─ loadSnapshot (previous)
       ├─ scanFn()     (current)
       ├─ saveSnapshot (current)
       └─ if diff:
            ├─ appendHistoryEntry
            ├─ notifyOnChanges
            ├─ printDiff
            └─ onChangeCb(diff)
```

## Notes
- Only one watcher instance can run at a time.
- Calling `startWatcher` while already running emits a warning and is a no-op.
