# portwatch-session

Session management for portwatch. A session groups multiple port snapshots taken over a period of time, allowing you to track port activity across a dev session.

## API

### `createSession(label?)`
Creates a new session with an optional human-readable label. Returns the session object.

### `loadSession(sessionId)`
Loads a session by ID. Returns `null` if not found.

### `saveSession(session)`
Persists a session object to disk.

### `endSession(sessionId)`
Marks a session as ended. Sets `endedAt` and `active: false`.

### `appendSnapshot(sessionId, snapshot)`
Appends a port snapshot array to the session's snapshot history.

### `listSessions()`
Returns all saved sessions as an array.

### `clearSession(sessionId)`
Deletes the session file from disk.

## Storage

Sessions are stored in `~/.portwatch/sessions/` as individual JSON files named by session ID.

## Session Object Shape

```json
{
  "id": "session_1713200000000",
  "label": "my-feature-branch",
  "startedAt": "2024-04-15T12:00:00.000Z",
  "endedAt": null,
  "active": true,
  "snapshots": [
    {
      "timestamp": "2024-04-15T12:01:00.000Z",
      "data": [{ "port": 3000, "process": "node" }]
    }
  ]
}
```

## Usage

```js
const { createSession, appendSnapshot, endSession } = require('./portwatch-session');

const session = createSession('my-feature');
appendSnapshot(session.id, currentPorts);
endSession(session.id);
```
