# portwatch-badge

Generates status badges for portwatch monitoring state, suitable for embedding in dashboards or README files.

## Functions

### `buildBadgeData(label, message, color)`
Returns a Shields.io-compatible badge data object.

### `getStatusBadge()`
Returns a badge reflecting whether the portwatch daemon is running.

### `getPortCountBadge(snapshot?)`
Returns a badge showing the number of currently active ports.
- `blue` for ≤50 ports
- `yellow` for >50 ports
- `lightgrey` if no snapshot data

### `getStaleBadge(snapshot?, maxAgeMs?)`
Returns a badge showing how many stale port entries exist.
- `brightgreen` if none
- `yellow` if any stale entries found
- Default max age: 1 hour

### `formatBadgeJSON(badgeData)`
Serializes badge data as a pretty-printed JSON string (Shields.io endpoint format).

### `formatBadgeSVG(badgeData)`
Renders badge data as a minimal inline SVG string.

## Usage

```js
const { getPortCountBadge, formatBadgeSVG } = require('./portwatch-badge');
const badge = getPortCountBadge(snapshot);
console.log(formatBadgeSVG(badge));
```

## Badge Colors

| State    | Color        |
|----------|--------------|
| ok       | brightgreen  |
| warning  | yellow       |
| error    | red          |
| inactive | lightgrey    |
| info     | blue         |
