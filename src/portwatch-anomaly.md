# portwatch-anomaly

Detects anomalous ports in the current snapshot by comparing against historical frequency data.

## Overview

A port is considered anomalous if it has rarely or never appeared in previous snapshots. The anomaly score ranges from `0` (seen in every snapshot) to `1` (never seen before).

## API

### `scoreAnomaly(port, freqMap, totalSnapshots) → number`

Returns a normalized anomaly score `[0, 1]` for a port given a frequency map and total snapshot count.

### `detectAnomalies(currentEntries, history, threshold?) → entry[]`

Filters `currentEntries` to those whose anomaly score meets or exceeds `threshold` (default `0.8`). Each returned entry includes an `anomalyScore` field.

### `buildAnomalyReport(currentEntries, history, threshold?) → object`

Returns a structured report:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "threshold": 0.8,
  "total": 10,
  "anomalyCount": 2,
  "anomalies": [ ... ]
}
```

### `formatAnomalyReport(report) → string`

Formats the report as a human-readable string suitable for CLI output.

## Usage

```js
const { buildAnomalyReport, formatAnomalyReport } = require('./portwatch-anomaly');
const { loadHistory } = require('./history');
const { scanPorts } = require('../bin/portwatch');

const history = loadHistory();
const current = await scanPorts();
const report = buildAnomalyReport(current, history, 0.75);
console.log(formatAnomalyReport(report));
```

## Threshold Guide

| Threshold | Meaning |
|-----------|------------------------------------------|
| `1.0`     | Only ports never seen before |
| `0.8`     | Ports seen in fewer than 20% of snapshots |
| `0.5`     | Ports seen in fewer than half of snapshots |
