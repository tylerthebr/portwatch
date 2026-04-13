# portwatch-annotate

Inline annotation layer for port entries. Combines data from tags, aliases, memos, and well-known port labels into a single `annotation` object attached to each entry.

## Functions

### `annotateEntry(entry) → entry`
Enriches a single port entry with an `annotation` object containing:
- `tag` — from `src/tags.js`
- `alias` — from `src/portaliases.js`
- `memo` — from `src/portmemo.js`
- `label` — from `src/portlabel.js` (well-known service names)

### `annotateEntries(entries) → entries`
Maps `annotateEntry` over an array of port entries.

### `formatAnnotation(annotation) → string`
Returns a compact human-readable string of all non-null annotation fields.

Example output:
```
[HTTPS] [alias: web-proxy] [tag: public] [memo: main ingress]
```

### `hasAnnotation(entry) → boolean`
Returns `true` if the entry has at least one non-null annotation field.

## Usage

```js
const { annotateEntries, formatAnnotation } = require('./portwatch-annotate');

const annotated = annotateEntries(ports);
for (const entry of annotated) {
  const note = formatAnnotation(entry.annotation);
  console.log(`${entry.port}\t${entry.process}\t${note}`);
}
```

## Notes
- All source lookups are synchronous.
- Missing values are represented as `null`, not `undefined`.
- Does not mutate the original entry — returns a shallow copy.
