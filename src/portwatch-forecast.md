# portwatch-forecast

Predicts future port activity based on historical appearance patterns.

## Overview

`portwatch-forecast` analyses the portwatch history log and computes an
appearance rate (occurrences per hour) for each observed port. Ports whose
rate exceeds a configurable threshold are marked as **predicted** — meaning
they are likely to be active in the next observation window.

## API

### `buildForecast(history, opts?)`

Builds a forecast map from a portwatch history array.

| Option | Default | Description |
|--------|---------|-------------|
| `windowMs` | `3600000` | Window size in ms (default: 1 hour) |
| `minRate` | `0.5` | Minimum appearances/window to be predicted |

Returns an object keyed by port number:

```json
{
  "3000": {
    "port": 3000,
    "rate": 1.4,
    "predicted": true,
    "confidence": 0.8,
    "lastSeen": "2024-06-01T12:00:00.000Z"
  }
}
```

### `predictedPorts(forecast)`

Returns the subset of forecast entries where `predicted === true`.

### `calcAppearanceRate(timestamps, windowMs?)`

Low-level helper — computes the average appearances per window given a sorted
array of Unix timestamps.

### `formatForecastReport(forecast)`

Returns a human-readable string report sorted by rate descending.

## Usage

```js
const { loadHistory } = require('./history');
const { buildForecast, formatForecastReport } = require('./portwatch-forecast');

const history = loadHistory();
const forecast = buildForecast(history, { minRate: 0.8 });
console.log(formatForecastReport(forecast));
```
