const { runCycle } = require('./portwatch');

jest.mock('../bin/portwatch', () => ({
  scanPorts: jest.fn(),
}));
jest.mock('./snapshot');
jest.mock('./reporter');
jest.mock('./notifier');
jest.mock('./history');
jest.mock('./filter');
jest.mock('./config');
jest.mock('./plugin');
jest.mock('./portevents');

const { scanPorts } = require('../bin/portwatch');
const { loadSnapshot, saveSnapshot, diffSnapshots } = require('./snapshot');
const { printDiff, printPortList } = require('./reporter');
const { notifyOnChanges } = require('./notifier');
const { appendHistoryEntry } = require('./history');
const { applyFilters } = require('./filter');
const { loadConfig } = require('./config');
const { runAllPluginHooks } = require('./plugin');
const { emitEvent } = require('./portevents');

const MOCK_PORTS = [
  { port: 3000, protocol: 'tcp', process: 'node' },
];

beforeEach(() => {
  jest.clearAllMocks();
  scanPorts.mockResolvedValue(MOCK_PORTS);
  applyFilters.mockReturnValue(MOCK_PORTS);
  loadConfig.mockResolvedValue({});
  saveSnapshot.mockResolvedValue();
  runAllPluginHooks.mockResolvedValue();
  notifyOnChanges.mockResolvedValue();
  appendHistoryEntry.mockResolvedValue();
  emitEvent.mockReturnValue();
});

test('initial cycle (no previous snapshot) prints port list and emits cycle:initial', async () => {
  loadSnapshot.mockResolvedValue(null);

  const result = await runCycle();

  expect(printPortList).toHaveBeenCalledWith(MOCK_PORTS);
  expect(emitEvent).toHaveBeenCalledWith('cycle:initial', expect.any(Object));
  expect(result.diff).toBeNull();
});

test('cycle with changes prints diff and notifies', async () => {
  const diff = { added: [{ port: 4000 }], removed: [], changed: [] };
  loadSnapshot.mockResolvedValue(MOCK_PORTS);
  diffSnapshots.mockReturnValue(diff);

  await runCycle();

  expect(printDiff).toHaveBeenCalledWith(diff);
  expect(notifyOnChanges).toHaveBeenCalled();
  expect(appendHistoryEntry).toHaveBeenCalled();
  expect(emitEvent).toHaveBeenCalledWith('cycle:changed', expect.any(Object));
});

test('cycle with no changes emits cycle:unchanged', async () => {
  const diff = { added: [], removed: [], changed: [] };
  loadSnapshot.mockResolvedValue(MOCK_PORTS);
  diffSnapshots.mockReturnValue(diff);

  await runCycle();

  expect(printDiff).not.toHaveBeenCalled();
  expect(emitEvent).toHaveBeenCalledWith('cycle:unchanged', expect.any(Object));
});

test('runAllPluginHooks is called after every cycle', async () => {
  loadSnapshot.mockResolvedValue(null);

  await runCycle();

  expect(runAllPluginHooks).toHaveBeenCalledWith('afterCycle', expect.any(Object));
});
