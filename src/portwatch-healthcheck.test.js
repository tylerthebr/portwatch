const { runHealthCheck, buildHealthReport, formatHealthReport } = require('./portwatch-healthcheck');
const portping = require('./portping');
const portstat = require('./portstat');

jest.mock('./portping');
jest.mock('./portstat');
jest.mock('./watchlist', () => ({
  loadWatchlist: () => [{ port: 3000 }, { port: 4000 }]
}));

const makeEntry = (port, reachable, connections = 2) => ({ port, reachable, connections });

beforeEach(() => {
  portping.pingPort.mockResolvedValue(true);
  portstat.getPortStat.mockResolvedValue({ connections: 3 });
});

test('runHealthCheck marks reachable ports as healthy', async () => {
  const results = await runHealthCheck([{ port: 3000 }, { port: 4000 }]);
  expect(results).toHaveLength(2);
  expect(results[0].status).toBe('healthy');
  expect(results[1].status).toBe('healthy');
});

test('runHealthCheck marks unreachable ports correctly', async () => {
  portping.pingPort.mockResolvedValueOnce(false);
  const results = await runHealthCheck([{ port: 3000 }]);
  expect(results[0].status).toBe('unreachable');
  expect(results[0].reachable).toBe(false);
});

test('runHealthCheck tolerates getPortStat failure', async () => {
  portstat.getPortStat.mockRejectedValue(new Error('fail'));
  const results = await runHealthCheck([{ port: 9999 }]);
  expect(results[0].connections).toBe(0);
});

test('buildHealthReport calculates score correctly', () => {
  const results = [
    { port: 3000, status: 'healthy', connections: 1, checkedAt: '' },
    { port: 4000, status: 'unreachable', connections: 0, checkedAt: '' }
  ];
  const report = buildHealthReport(results);
  expect(report.total).toBe(2);
  expect(report.healthy).toBe(1);
  expect(report.unreachable).toBe(1);
  expect(report.score).toBe(50);
});

test('buildHealthReport score is 100 when no entries', () => {
  const report = buildHealthReport([]);
  expect(report.score).toBe(100);
});

test('formatHealthReport includes score and port lines', () => {
  const results = [
    { port: 3000, process: 'node', status: 'healthy', connections: 2, checkedAt: '' }
  ];
  const report = buildHealthReport(results);
  const text = formatHealthReport(report);
  expect(text).toContain('Score');
  expect(text).toContain(':3000');
  expect(text).toContain('node');
  expect(text).toContain('healthy');
});

test('formatHealthReport shows ✗ for unreachable', () => {
  const results = [
    { port: 5000, process: null, status: 'unreachable', connections: 0, checkedAt: '' }
  ];
  const report = buildHealthReport(results);
  const text = formatHealthReport(report);
  expect(text).toContain('✗');
});
