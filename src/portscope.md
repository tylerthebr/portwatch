# portscope

Scope port snapshots to named environments for easy comparison across dev, staging, CI, etc.

## Functions

### `listScopes() → string[]`
Returns all saved scope names from `~/.portwatch/scopes/`.

### `loadScope(name) → object | null`
Loads a named scope. Returns `null` if it doesn't exist.

### `saveScope(name, entries) → object`
Saves the given port entries under a named scope. Includes a `savedAt` timestamp.

### `removeScope(name) → boolean`
Deletes a scope by name. Returns `true` if deleted, `false` if not found.

### `diffScopes(nameA, nameB) → { added, removed, from, to }`
Compares two scopes and returns entries added or removed between them.

## Storage

Scopes are stored as JSON files in `~/.portwatch/scopes/<name>.json`.

## Example

```js
const { saveScope, diffScopes } = require('./portscope');

saveScope('dev', currentPorts);
// later...
const diff = diffScopes('dev', 'staging');
console.log('Added ports:', diff.added);
console.log('Removed ports:', diff.removed);
```

## Use Cases

- Compare what ports are open in dev vs staging
- Track environment-specific services
- Audit which ports appear only in CI
