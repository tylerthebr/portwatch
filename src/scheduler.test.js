const { runScan, startScheduler, stopScheduler, isRunning } = require('./scheduler');

jest.mock('../bin/portwatch', () => ({
  scanPorts: jest.fn().mockResolvedValue([{ port: 3000, protocol: 'tcp', process: 'node' }])
}));

jest.mock('./snapshot', () => ({
  loadSnapshot: jest.fn().mockReturnValue([]),
  saveSnapshot: jest.fn(),
  diffSnapshots: jest.fn().mockReturnValue({
    added: [{ port: 3000, protocol: 'tcp', process: 'node' }],
    removed: []
  })
}));

jest.mock('./notifier', () => ({
  notifyOnChanges: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./reporter', () => ({
  printDiff: jest.fn()
}));

jest.mock('./config', () => ({
  loadConfig: jest.fn().mockReturnValue({ notifications: { desktop: false } })
}));

jest.mock('./history', () => ({
  appendHistoryEntry: jest.fn()
}));

describe('scheduler', () => {
  afterEach(() => {
    stopScheduler();
    jest.clearAllMocks();
  });

  test('runScan detects diff and calls notifier', async () => {
    const { notifyOnChanges } = require('./notifier');
    const diff = await runScan('test');
    expect(diff.added).toHaveLength(1);
    expect(notifyOnChanges).toHaveBeenCalledTimes(1);
  });

  test('runScan saves snapshot after scan', async () => {
    const { saveSnapshot } = require('./snapshot');
    await runScan();
    expect(saveSnapshot).toHaveBeenCalledTimes(1);
  });

  test('startScheduler sets running state', () => {
    jest.useFakeTimers();
    startScheduler(5000);
    expect(isRunning()).toBe(true);
    jest.useRealTimers();
  });

  test('stopScheduler clears running state', () => {
    jest.useFakeTimers();
    startScheduler(5000);
    stopScheduler();
    expect(isRunning()).toBe(false);
    jest.useRealTimers();
  });

  test('startScheduler warns if already running', () => {
    jest.useFakeTimers();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    startScheduler(5000);
    startScheduler(5000);
    expect(warn).toHaveBeenCalledWith('[portwatch] Scheduler already running.');
    jest.useRealTimers();
  });
});
