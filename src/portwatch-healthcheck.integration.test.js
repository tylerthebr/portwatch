const { runHealthCheck, buildHealthReport, formatHealthReport } =
  require('./portwatch-healthcheck');
const portping = require('./portping');
const portstat = require('./portstat');

jest.mock('./portping');
jest.mock('./portstat');
jest.mock('./watchlist', () => ({
  loadWatchlist: () => [
    { port: 3000, process: 'api' },
    { port: 5432, process: 'postgres' },
    { port: 6379, process: 'redis' }
  ]
}));

beforeEach(() => {
  portping.pingPort.mockImplementation(async (port) => port !== 6379);
  portstat.getPortStat.mockImplementation(async (port) => ({ connections: port === 5432 ? 10 : 1 }));
});

test('full watchlist health check produces correct summary', async () => {
  const { checkWatchlist } = require('./portwatch-healthcheck');
  const results = await checkWatchlist();
  const report = buildHealthReport(results);

  expect(report.total).toBe(3);
  expect(report.healthy).toBe(2);
  expect(report.unreachable).toBe(1);
  expect(report.score).toBe(67);
});

test('report contains checkedAt timestamps', async () => {
  const results = await runHealthCheck([{ port: 3000 }]);
  expect(results[0].checkedAt).toBeTruthy();
  expect(new Date(results[0].checkedAt).getTime()).not.toBeNaN();
});

test('formatHealthReport round-trip is non-empty', async () => {
  const results = await runHealthCheck([{ port: 3000, process: 'api' }]);
  const report = buildHealthReport(results);
  const text = formatHealthReport(report);
  expect(text.length).toBeGreaterThan(20);
  expect(text).toContain('api');
});

test('all-healthy report has score 100', async () => {
  portping.pingPort.mockResolvedValue(true);
  const results = await runHealthCheck([
    { port: 3000 }, { port: 4000 }, { port: 5000 }
  ]);
  const report = buildHealthReport(results);
  expect(report.score).toBe(100);
  expect(report.unreachable).toBe(0);
});

test('all-unreachable report has score 0', async () => {
  portping.pingPort.mockResolvedValue(false);
  const results = await runHealthCheck([{ port: 9999 }]);
  const report = buildHealthReport(results);
  expect(report.score).toBe(0);
});
