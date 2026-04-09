const { startWatcher, stopWatcher, onWatcherChange, watcherStatus } = require('./watcher');
const scheduler = require('./scheduler');
const snapshot = require('./snapshot');
const history = require('./history');
const notifier = require('./notifier');
const reporter = require('./reporter');

jest.mock('./scheduler');
jest.mock('./snapshot');
jest.mock('./history');
jest.mock('./notifier');
jest.mock('./reporter');
jest.mock('./config', () => ({ loadConfig: async () => ({ interval: 3000 }) }));

describe('watcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scheduler.isRunning.mockReturnValue(false);
  });

  test('startWatcher calls startScheduler with correct interval', async () => {
    snapshot.loadSnapshot.mockResolvedValue(null);
    const scanFn = jest.fn().mockResolvedValue([]);
    await startWatcher(scanFn, { interval: 4000 });
    expect(scheduler.startScheduler).toHaveBeenCalledWith(expect.any(Function), 4000);
  });

  test('startWatcher warns if already running', async () => {
    scheduler.isRunning.mockReturnValue(true);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await startWatcher(jest.fn());
    expect(scheduler.startScheduler).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('stopWatcher calls stopScheduler', () => {
    scheduler.isRunning.mockReturnValue(true);
    stopWatcher();
    expect(scheduler.stopScheduler).toHaveBeenCalled();
  });

  test('stopWatcher warns if not running', () => {
    scheduler.isRunning.mockReturnValue(false);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    stopWatcher();
    expect(scheduler.stopScheduler).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('watcherStatus returns running state', () => {
    scheduler.isRunning.mockReturnValue(true);
    expect(watcherStatus()).toEqual({ running: true });
  });

  test('onWatcherChange registers callback', async () => {
    const cb = jest.fn();
    onWatcherChange(cb);
    snapshot.loadSnapshot.mockResolvedValue([{ port: 3000 }]);
    const current = [{ port: 4000 }];
    const scanFn = jest.fn().mockResolvedValue(current);
    snapshot.saveSnapshot.mockResolvedValue();
    snapshot.diffSnapshots.mockReturnValue({ added: [{ port: 4000 }], removed: [{ port: 3000 }] });
    history.appendHistoryEntry.mockResolvedValue();
    notifier.notifyOnChanges.mockResolvedValue();
    reporter.printDiff.mockImplementation(() => {});
    await startWatcher(scanFn, { interval: 1000 });
    const schedulerCb = scheduler.startScheduler.mock.calls[0][0];
    await schedulerCb();
    expect(cb).toHaveBeenCalledWith({ added: [{ port: 4000 }], removed: [{ port: 3000 }] });
  });
});
