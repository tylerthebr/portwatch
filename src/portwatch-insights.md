# portwatch-insights

Derives actionable insights from accumulated port history.

## Overview

`portwatch-insights` analyses historical snapshots and surfaces patterns that are hard to spot by looking at raw diffs — such as ports that are always running, services that appear only briefly, or brand-new ports that showed up in the last 24 hours.

## Exports

### `buildInsights(history, opts?)`

Accepts a history array (same shape as returned by `loadHistory`) and returns an array of insight objects.

**Options:**
| Option | Default | Description |
|---|---|---|
| `topN` | `5` | Maximum insights per category |
| `rareThreshold` | `0.1` | Uptime ratio below which a port is "rare" |
| `frequentThreshold` | `0.7` | Uptime ratio above which a port is "frequent" |

**Insight object shape:**
```js
{
  type: 'always_on' | 'frequently_open' | 'rarely_seen' | 'recently_new',
  port: 3000,
  label: 'node',
  ratio: 0.85   // fraction of snapshots where port was present
}
```

### `formatInsights(insights)`

Returns a human-readable multi-line string suitable for CLI output.

```
  [always-on]      :3000 (node) — up 100% of snapshots
  [frequent]       :8080 (python) — up 82% of snapshots
  [new (24h)]      :4321 (proc_4321) — first appeared in last 24h
```

### `INSIGHT_TYPES`

Enum of insight type string constants.

## Usage

```js
const { loadHistory } = require('./history');
const { buildInsights, formatInsights } = require('./portwatch-insights');

const history = await loadHistory();
const insights = buildInsights(history, { topN: 10 });
console.log(formatInsights(insights));
```
