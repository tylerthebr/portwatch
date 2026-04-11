const {
  EVENTS,
  emitEvent,
  onEvent,
  offEvent,
  onceEvent,
  clearListeners,
  emitDiffEvents,
} = require('./portevents');

beforeEach(() => {
  clearListeners();
});

describe('emitEvent / onEvent', () => {
  test('delivers payload to listener', done => {
    onEvent(EVENTS.PORT_OPENED, payload => {
      expect(payload.event).toBe(EVENTS.PORT_OPENED);
      expect(payload.port).toBe(3000);
      expect(typeof payload.timestamp).toBe('number');
      done();
    });
    emitEvent(EVENTS.PORT_OPENED, { port: 3000 });
  });

  test('supports multiple listeners for the same event', () => {
    const calls = [];
    onEvent(EVENTS.SCAN_COMPLETE, () => calls.push(1));
    onEvent(EVENTS.SCAN_COMPLETE, () => calls.push(2));
    emitEvent(EVENTS.SCAN_COMPLETE);
    expect(calls).toEqual([1, 2]);
  });
});

describe('offEvent', () => {
  test('removes a specific listener', () => {
    const handler = jest.fn();
    onEvent(EVENTS.PORT_CLOSED, handler);
    offEvent(EVENTS.PORT_CLOSED, handler);
    emitEvent(EVENTS.PORT_CLOSED);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('onceEvent', () => {
  test('fires only once', () => {
    const handler = jest.fn();
    onceEvent(EVENTS.ALERT_TRIGGERED, handler);
    emitEvent(EVENTS.ALERT_TRIGGERED);
    emitEvent(EVENTS.ALERT_TRIGGERED);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('clearListeners', () => {
  test('clears all listeners when no event specified', () => {
    const handler = jest.fn();
    onEvent(EVENTS.PORT_OPENED, handler);
    onEvent(EVENTS.PORT_CLOSED, handler);
    clearListeners();
    emitEvent(EVENTS.PORT_OPENED);
    emitEvent(EVENTS.PORT_CLOSED);
    expect(handler).not.toHaveBeenCalled();
  });

  test('clears listeners for a specific event only', () => {
    const handler = jest.fn();
    onEvent(EVENTS.PORT_OPENED, handler);
    onEvent(EVENTS.PORT_CLOSED, handler);
    clearListeners(EVENTS.PORT_OPENED);
    emitEvent(EVENTS.PORT_OPENED);
    emitEvent(EVENTS.PORT_CLOSED);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('emitDiffEvents', () => {
  test('emits opened/closed/changed events from diff', () => {
    const opened = jest.fn();
    const closed = jest.fn();
    const changed = jest.fn();
    onEvent(EVENTS.PORT_OPENED, opened);
    onEvent(EVENTS.PORT_CLOSED, closed);
    onEvent(EVENTS.PORT_CHANGED, changed);

    emitDiffEvents({
      opened: [{ port: 3000 }],
      closed: [{ port: 4000 }, { port: 5000 }],
      changed: [{ port: 8080 }],
    });

    expect(opened).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(2);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  test('handles empty diff gracefully', () => {
    expect(() => emitDiffEvents({})).not.toThrow();
  });
});
