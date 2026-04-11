# portwatch — cycle orchestrator

`src/portwatch.js` ties together all portwatch subsystems into a single **scan cycle**.

## What it does

A single call to `runCycle()` will:

1. **Scan** active ports via `scanPorts()`
2. **Filter** results using the current config's filter rules
3. **Diff** against the last saved snapshot
4. **Persist** the new snapshot
5. **Alert** (desktop notification + console) when changes are detected
6. **Append** a history entry for changed cycles
7. **Emit** a lifecycle event (`cycle:initial`, `cycle:changed`, `cycle:unchanged`)
8. **Run plugin hooks** via `runAllPluginHooks('afterCycle', ...)`

## Usage

```js
const { runCycle } = require('./portwatch');

// called by the scheduler or watcher on each interval tick
await runCycle();

// pass option overrides (merged on top of loaded config)
await runCycle({ filters: { protocol: 'tcp' } });
```

## Return value

```ts
{ ports: PortEntry[], diff: DiffResult | null }
```

`diff` is `null` on the very first run (no previous snapshot exists).

## Integration points

| Module | Role |
|---|---|
| `bin/portwatch.js` | raw port scanning |
| `src/filter.js` | apply protocol / range / process filters |
| `src/snapshot.js` | load / save / diff snapshots |
| `src/reporter.js` | console output |
| `src/notifier.js` | desktop / webhook notifications |
| `src/history.js` | append change history |
| `src/portevents.js` | lifecycle event bus |
| `src/plugin.js` | post-cycle plugin hooks |
