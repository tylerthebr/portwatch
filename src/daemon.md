# Daemon Module

The `daemon.js` module manages the portwatch background process lifecycle using a PID file stored at `~/.portwatch/daemon.pid`.

## Functions

### `writePid()`
Writes the current process PID to the PID file. Creates the directory if it doesn't exist.

### `readPid() → number | null`
Reads and returns the PID from the PID file. Returns `null` if the file doesn't exist or is invalid.

### `clearPid()`
Deletes the PID file if it exists.

### `isDaemonRunning() → boolean`
Checks whether the process referenced by the PID file is still alive. Automatically clears stale PID files.

### `stopDaemon() → { stopped, pid?, reason? }`
Sends `SIGTERM` to the daemon process and removes the PID file.

### `getDaemonStatus() → { running, pid, pidFile }`
Returns a status object describing the current daemon state.

## PID File Location

```
~/.portwatch/daemon.pid
```

## Usage

```js
const { writePid, isDaemonRunning, stopDaemon } = require('./daemon');

if (isDaemonRunning()) {
  console.log('daemon already running');
} else {
  writePid();
  // start monitoring loop
}
```
