const { buildStatus, formatStatus, getDaemonStatus, getSchedulerStatus, getWatchStatus } = require('./portwatch-status');

jest.mock('./scheduler', () => ({ isRunning: jest.fn(() => false) }));
jest.mock('./watcher', () => ({ watcherStatus: jest.fn(() => ({ active: false, interval: null })) }));
jest.mock('./daemon', () => ({ isDaemonRunning: jest.fn(() => false), readPid: jest.fn(() => null) }));
jest.mock('./config', () => ({ loadConfig: jest.fn(() => ({ alerts: { enabled: true }, notifications: { enabled: false }, interval: 5000 })) }));
jest.mock('./snapshot', () => ({ loadSnapshot: jest.fn(() => ({ timestamp: '2024-01-01T00:00:00.000Z', ports: { 3000: {}, 8080: {} } })) }));
jest.mock('./formatter', () => ({ formatTimestamp: jest.fn((t) => t) }));

const { isRunning } = require('./scheduler');
const { watcherStatus } = require('./watcher');
const { isDaemonRunning, readPid } = require('./daemon');

describe('getDaemonStatus', () => {
  it('returns stopped when daemon not running', () => {
    isDaemonRunning.mockReturnValue(false);
    const s = getDaemonStatus();
    expect(s.running).toBe(false);
    expect(s.pid).toBeNull();
    expect(s.label).toBe('stopped');
  });

  it('returns active with pid when running', () => {
    isDaemonRunning.mockReturnValue(true);
    readPid.mockReturnValue(1234);
    const s = getDaemonStatus();
    expect(s.running).toBe(true);
    expect(s.pid).toBe(1234);
    expect(s.label).toContain('1234');
  });
});

describe('getSchedulerStatus', () => {
  it('reports stopped', () => {
    isRunning.mockReturnValue(false);
    expect(getSchedulerStatus().label).toBe('stopped');
  });

  it('reports active', () => {
    isRunning.mockReturnValue(true);
    expect(getSchedulerStatus().label).toBe('active');
  });
});

describe('getWatchStatus', () => {
  it('reports idle when not active', () => {
    watcherStatus.mockReturnValue({ active: false, interval: null });
    const s = getWatchStatus();
    expect(s.running).toBe(false);
    expect(s.label).toBe('idle');
  });

  it('includes interval when watching', () => {
    watcherStatus.mockReturnValue({ active: true, interval: 3000 });
    const s = getWatchStatus();
    expect(s.running).toBe(true);
    expect(s.label).toContain('3000');
  });
});

describe('buildStatus', () => {
  it('returns full status object', async () => {
    isDaemonRunning.mockReturnValue(false);
    isRunning.mockReturnValue(false);
    watcherStatus.mockReturnValue({ active: false, interval: null });
    const status = await buildStatus();
    expect(status).toHaveProperty('daemon');
    expect(status).toHaveProperty('scheduler');
    expect(status).toHaveProperty('watcher');
    expect(status).toHaveProperty('config');
    expect(status.snapshot.portCount).toBe(2);
    expect(status.config.alertsEnabled).toBe(true);
    expect(status.config.interval).toBe(5000);
  });
});

describe('formatStatus', () => {
  it('renders a readable string', async () => {
    isDaemonRunning.mockReturnValue(false);
    isRunning.mockReturnValue(false);
    watcherStatus.mockReturnValue({ active: false, interval: null });
    const status = await buildStatus();
    const output = formatStatus(status);
    expect(output).toContain('daemon');
    expect(output).toContain('scheduler');
    expect(output).toContain('snapshot');
    expect(output).toContain('2 ports');
  });
});
