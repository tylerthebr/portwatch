const {
  buildCoverageMap,
  calcCoverageRatio,
  getMissingPorts,
  buildCoverageReport,
  formatCoverageReport
} = require('./portwatch-coverage');

const watchlist = [
  { port: 3000 },
  { port: 4000 },
  { port: 5000 }
];

const snapshots = [
  { ports: [{ port: 3000 }, { port: 4000 }] },
  { ports: [{ port: 3000 }] }
];

test('buildCoverageMap marks seen ports', () => {
  const map = buildCoverageMap(watchlist, snapshots);
  expect(map.get(3000)).toBe(true);
  expect(map.get(4000)).toBe(true);
  expect(map.get(5000)).toBe(false);
});

test('buildCoverageMap returns false for all if no snapshots', () => {
  const map = buildCoverageMap(watchlist, []);
  for (const v of map.values()) expect(v).toBe(false);
});

test('calcCoverageRatio returns correct fraction', () => {
  const map = buildCoverageMap(watchlist, snapshots);
  expect(calcCoverageRatio(map)).toBeCloseTo(2 / 3);
});

test('calcCoverageRatio returns 1 for empty watchlist', () => {
  expect(calcCoverageRatio(new Map())).toBe(1);
});

test('getMissingPorts returns unseen ports sorted', () => {
  const map = buildCoverageMap(watchlist, snapshots);
  expect(getMissingPorts(map)).toEqual([5000]);
});

test('getMissingPorts returns empty if all seen', () => {
  const fullSnaps = [{ ports: [{ port: 3000 }, { port: 4000 }, { port: 5000 }] }];
  const map = buildCoverageMap(watchlist, fullSnaps);
  expect(getMissingPorts(map)).toEqual([]);
});

test('buildCoverageReport returns correct report shape', () => {
  const report = buildCoverageReport(watchlist, snapshots);
  expect(report.total).toBe(3);
  expect(report.seen).toBe(2);
  expect(report.missing).toEqual([5000]);
  expect(report.percent).toBe(67);
});

test('formatCoverageReport includes missing ports', () => {
  const report = buildCoverageReport(watchlist, snapshots);
  const out = formatCoverageReport(report);
  expect(out).toMatch('5000');
  expect(out).toMatch('2/3');
});

test('formatCoverageReport shows all-seen message', () => {
  const fullSnaps = [{ ports: [{ port: 3000 }, { port: 4000 }, { port: 5000 }] }];
  const report = buildCoverageReport(watchlist, fullSnaps);
  const out = formatCoverageReport(report);
  expect(out).toMatch('All watched ports');
});
