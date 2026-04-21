# portwatch-baseline-drift

Detects and scores drift between the current port snapshot and a saved baseline.

## Overview

This module compares a live or recent snapshot against a named baseline to quantify how much the port environment has changed. It produces a scored drift report with a severity classification.

## API

### `buildBaselineDriftReport(current, baselineName?)`

Compares `current` (array of port entries) against the stored baseline identified by `baselineName` (default: `'default'`).

Returns:
```js
{
  baselineName,
  score,       // numeric drift score
  level,       // 'none' | 'low' | 'moderate' | 'high'
  added,       // ports not in baseline
  removed,     // ports removed since baseline
  changed,     // ports that changed
  timestamp
}
```

### `formatBaselineDriftReport(report)`

Formats the drift report as a human-readable string for CLI output.

### `calcDriftScore(diff)`

Scores a diff object. Weights: added ×2, removed ×3, changed ×1.

### `classifyDrift(score)`

Returns `'none'`, `'low'`, `'moderate'`, or `'high'` based on score thresholds.

## Drift Levels

| Score | Level    |
|-------|----------|
| 0     | none     |
| 1–5   | low      |
| 6–15  | moderate |
| 16+   | high     |
