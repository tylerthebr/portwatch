const {
  buildBadgeData,
  getPortCountBadge,
  getStaleBadge,
  formatBadgeJSON,
  formatBadgeSVG
} = require('./portwatch-badge');

describe('buildBadgeData', () => {
  it('returns correct shape', () => {
    const badge = buildBadgeData('portwatch', 'running', 'brightgreen');
    expect(badge).toEqual({ schemaVersion: 1, label: 'portwatch', message: 'running', color: 'brightgreen' });
  });
});

describe('getPortCountBadge', () => {
  it('returns inactive badge for empty snapshot', () => {
    const badge = getPortCountBadge([]);
    expect(badge.color).toBe('lightgrey');
    expect(badge.message).toBe('none');
  });

  it('returns info badge for small port count', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ port: 3000 + i }));
    const badge = getPortCountBadge(entries);
    expect(badge.color).toBe('blue');
    expect(badge.message).toBe('5');
  });

  it('returns warning badge for large port count', () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({ port: 3000 + i }));
    const badge = getPortCountBadge(entries);
    expect(badge.color).toBe('yellow');
    expect(badge.message).toBe('60');
  });
});

describe('getStaleBadge', () => {
  it('returns ok badge when no stale entries', () => {
    const now = Date.now();
    const entries = [{ port: 3000, lastSeen: now }];
    const badge = getStaleBadge(entries, 3600000);
    expect(badge.color).toBe('brightgreen');
    expect(badge.message).toBe('0');
  });

  it('returns warning badge when stale entries exist', () => {
    const old = Date.now() - 7200000;
    const entries = [{ port: 3000, lastSeen: old }];
    const badge = getStaleBadge(entries, 3600000);
    expect(badge.color).toBe('yellow');
    expect(badge.message).toBe('1');
  });

  it('returns ok badge for empty snapshot', () => {
    const badge = getStaleBadge([]);
    expect(badge.message).toBe('0');
  });
});

describe('formatBadgeJSON', () => {
  it('returns valid JSON string', () => {
    const badge = buildBadgeData('ports', '3', 'blue');
    const out = formatBadgeJSON(badge);
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out).message).toBe('3');
  });
});

describe('formatBadgeSVG', () => {
  it('returns SVG string containing label and message', () => {
    const badge = buildBadgeData('ports', '3', 'blue');
    const svg = formatBadgeSVG(badge);
    expect(svg).toContain('<svg');
    expect(svg).toContain('ports');
    expect(svg).toContain('3');
  });
});
