// portevents.js — simple event emitter wrapper for port change lifecycle events

const { EventEmitter } = require('events');

const emitter = new EventEmitter();

const EVENTS = {
  PORT_OPENED: 'port:opened',
  PORT_CLOSED: 'port:closed',
  PORT_CHANGED: 'port:changed',
  SCAN_COMPLETE: 'scan:complete',
  ALERT_TRIGGERED: 'alert:triggered',
};

/**
 * Emit a port lifecycle event.
 * @param {string} event - one of EVENTS values
 * @param {object} payload
 */
function emitEvent(event, payload = {}) {
  emitter.emit(event, { event, timestamp: Date.now(), ...payload });
}

/**
 * Register a listener for a port lifecycle event.
 * @param {string} event
 * @param {function} handler
 */
function onEvent(event, handler) {
  emitter.on(event, handler);
}

/**
 * Remove a specific listener.
 * @param {string} event
 * @param {function} handler
 */
function offEvent(event, handler) {
  emitter.off(event, handler);
}

/**
 * Register a one-time listener.
 * @param {string} event
 * @param {function} handler
 */
function onceEvent(event, handler) {
  emitter.once(event, handler);
}

/**
 * Remove all listeners, optionally scoped to an event.
 * @param {string} [event]
 */
function clearListeners(event) {
  if (event) {
    emitter.removeAllListeners(event);
  } else {
    emitter.removeAllListeners();
  }
}

/**
 * Emit diff results as individual port events.
 * @param {object} diff - { opened: [], closed: [], changed: [] }
 */
function emitDiffEvents(diff = {}) {
  const { opened = [], closed = [], changed = [] } = diff;
  opened.forEach(entry => emitEvent(EVENTS.PORT_OPENED, { entry }));
  closed.forEach(entry => emitEvent(EVENTS.PORT_CLOSED, { entry }));
  changed.forEach(entry => emitEvent(EVENTS.PORT_CHANGED, { entry }));
}

module.exports = {
  EVENTS,
  emitEvent,
  onEvent,
  offEvent,
  onceEvent,
  clearListeners,
  emitDiffEvents,
};
