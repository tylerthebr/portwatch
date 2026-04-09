# exporter.js

Handles exporting port snapshot and diff data to various file formats.

## Functions

### `exportToJSON(snapshot, outputPath)`
Writes a full port snapshot object to a `.json` file with pretty formatting.

### `exportToCSV(snapshot, outputPath)`
Writes port entries from a snapshot to a `.csv` file. Columns: `port`, `protocol`, `process`, `pid`, `state`.

### `exportDiffReport(diff, outputPath, timestamp?)`
Writes a human-readable text report of port changes (added/removed) to a `.txt` file.

### `resolveFormat(outputPath, format?)`
Determines the export format. If an explicit `format` string is provided it takes precedence; otherwise the file extension is used. Defaults to `'json'`.

## Supported Formats

| Format | Extension | Function |
|--------|-----------|----------|
| JSON   | `.json`   | `exportToJSON` |
| CSV    | `.csv`    | `exportToCSV` |
| Text   | `.txt`    | `exportDiffReport` |

## Usage Example

```js
const { exportToCSV, resolveFormat } = require('./exporter');

const format = resolveFormat(outputPath, flags.format);
if (format === 'csv') {
  exportToCSV(snapshot, outputPath);
}
```

## Notes
- All functions write synchronously using `fs.writeFileSync`.
- The caller is responsible for ensuring the output directory exists.
