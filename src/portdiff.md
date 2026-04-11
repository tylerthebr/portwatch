# portdiff

Rich diff computation and rendering between two port snapshots.

## Overview

`portdiff` sits on top of `snapshot.diffSnapshots()` and adds structured categorization and human-readable rendering, making it easy to display or export what changed between two scans.

## API

### `categorizeDiff(diff)`

Splits a raw diff array (from `diffSnapshots`) into three buckets.

```js
const { added, removed, changed } = categorizeDiff(diff);
```

| Field     | Description                          |
|-----------|--------------------------------------|
| `added`   | Ports that appeared in the new scan  |
| `removed` | Ports that disappeared               |
| `changed` | Ports whose metadata changed         |

---

### `buildDiffReport(before, after, diff)`

Builds a structured report object suitable for display or export.

```js
const report = buildDiffReport(snapshotA, snapshotB, diff);
// report.summary.added / removed / changed / total
// report.added[], report.removed[], report.changed[]
// report.beforeTimestamp, report.afterTimestamp, report.generatedAt
```

---

### `renderDiffReport(report)`

Converts a report object into a printable string.

```js
console.log(renderDiffReport(report));
```

Example output:

```
Diff Report — 2024-01-01 10:05:00
  +1 added  -1 removed  ~1 changed

Added:
  [+] 8080/tcp  nginx

Removed:
  [-] 5432/tcp  postgres

Changed:
  [~] 3000/tcp  node
```

## Used By

- `bin/portwatch.js` — printed after each scan cycle
- `src/exporter.js` — `exportDiffReport` wraps this output
- `src/reporter.js` — `printDiff` delegates here
