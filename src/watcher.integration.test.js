/**
 * Integration-style test: watcher reacts correctly across multiple ticks
 * using real snapshot/diff logic with mocked I/O.
 */
const { startWatcher, stopWatcher, onWatcherChange } = require('./watcher');
const scheduler = require('./scheduler');
const snapshot = require('./snapshot');
const history = require('./history');
const notifier = require('./notifier');
const reporter = require('./reporter');

jest.mock('./scheduler');
jest.mock('./history');
jest.mock('./notifier');
jest.mock('./reporter');
jest.mock('./config', () => ({ loadConfig: async () => ({ interval: 1000 }) }));

// Use real snapshot logic
jest.unmock('./snapshot');

describe('watcher integration', () => {
  let store = {};

  beforeEach(() => {
    jest.clearAllMocks();
    store = {};
    scheduler.isRunning.mockReturnValue(false);
    jest.spyOn(snapshot, 'saveSnapshot').mockImplementation(async (label, data) => { store[label] = data; });
    jest.spyOn(snapshot, 'loadSnapshot').mockImplementation(async (label) => store[label] || null);
    history.appendHistoryEntry.mockResolvedValue();
    notifier.notifyOnChanges.mockResolvedValue();
    reporter.printDiff.mockImplementation(() => {});
  });

  test('no callback fired on first tick (no previous snapshot)', async () => {
    const cb = jest.fn();
    onWatcherChange(cb);
    const scanFn = jest.fn().mockResolvedValue([{ port: 3000, protocol: 'tcp' }]);
    await startWatcher(scanFn, { interval: 1000 });
    const tick = scheduler.startScheduler.mock.calls[0][0];
    await tick();
    expect(cb).not.toHaveBeenCalled();
  });

  test('callback fired when port appears on second tick', async () => {
    const cb = jest.fn();
    onWatcherChange(cb);
    const portA = { port: 3000, protocol: 'tcp', process: 'node' };
    const portB = { port: 4000, protocol: 'tcp', process: 'python' };
    let tick = 0;
    const scanFn = jest.fn().mockImplementation(async () => tick++ === 0 ? [portA] : [portA, portB]);
    await startWatcher(scanFn, { interval: 1000 });
    const schedulerTick = scheduler.startScheduler.mock.calls[0][0];
    await schedulerTick(); // first tick — saves snapshot, no diff
    await schedulerTick(); // second tick — portB appears
    expect(cb).toHaveBeenCalledTimes(1);
    const diff = cb.mock.calls[0][0];
    expect(diff.added.some(p => p.port === 4000)).toBe(true);
    expect(diff.removed).toHaveLength(0);
  });

  test('history and notifier called on change', async () => {
    onWatcherChange(jest.fn());
    let tick = 0;
    const scanFn = jest.fn().mockImplementation(async () =>
      tick++ === 0 ? [{ port: 8080, protocol: 'tcp' }] : []
    );
    await startWatcher(scanFn, { interval: 1000 });
    const schedulerTick = scheduler.startScheduler.mock.calls[0][0];
    await schedulerTick();
    await schedulerTick();
    expect(history.appendHistoryEntry).toHaveBeenCalled();
    expect(notifier.notifyOnChanges).toHaveBeenCalled();
  });
});
