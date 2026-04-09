# tags

Assign human-readable labels to ports for easier identification in diffs and reports.

## API

### `setTag(port, tag)`
Associates a string label with a port number. Persists to config.

```js
setTag(3000, 'frontend');
```

### `getTag(port)`
Returns the tag for a port, or `null` if none set.

### `removeTag(port)`
Removes a tag. Returns `true` if removed, `false` if not found.

### `getTags()`
Returns all tags as a `{ [port]: tag }` map.

### `clearTags()`
Removes all tags from config.

### `applyTagsToEntries(entries)`
Enriches an array of port entries with a `tag` field.

```js
const tagged = applyTagsToEntries(snapshot);
// [{ port: 3000, pid: 123, tag: 'frontend' }, ...]
```

## Storage

Tags are stored in the portwatch config file under the `tags` key:

```json
{
  "tags": {
    "3000": "frontend",
    "8080": "api-gateway"
  }
}
```

## Notes
- Port must be a valid integer between 1–65535
- Tags are trimmed of whitespace on save
- Tags survive across scans and snapshots
