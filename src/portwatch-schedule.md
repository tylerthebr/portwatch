# portwatch-schedule

Manages named scan schedules for portwatch. Each schedule defines how frequently
portwatch should run a scan, and whether notifications should fire on changes.

## API

### `addSchedule(name, intervalSeconds, opts?)`
Creates or overwrites a named schedule.
- `name` — unique identifier (e.g. `"dev"`, `"ci"`)
- `intervalSeconds` — must be >= 5
- `opts.enabled` — default `true`
- `opts.notify` — default `true`

### `removeSchedule(name)`
Deletes a schedule by name. Returns `false` if not found.

### `getSchedule(name)`
Returns the schedule object or `null`.

### `updateLastRun(name, timestamp?)`
Updates the `lastRun` field. Defaults to current ISO timestamp.

### `listSchedules()`
Returns all schedules as an array.

### `clearSchedules()`
Removes all schedules.

## Storage
Schedules are stored in `~/.portwatch/schedules.json`.

## Example
```js
addSchedule('dev', 30, { notify: true });
listSchedules();
// => [{ name: 'dev', intervalSeconds: 30, enabled: true, ... }]
```
