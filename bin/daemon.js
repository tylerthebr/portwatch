#!/usr/bin/env node
'use strict';

const { writePid, isDaemonRunning, stopDaemon, getDaemonStatus } = require('../src/daemon');
const { startScheduler, stopScheduler } = require('../src/scheduler');
const { loadConfig } = require('../src/config');

const command = process.argv[2];

async function main() {
  const config = loadConfig();

  switch (command) {
    case 'start': {
      if (isDaemonRunning()) {
        console.log('portwatch daemon is already running.');
        process.exit(1);
      }
      writePid();
      console.log(`daemon started (pid ${process.pid})`);
      const interval = config.interval || 30000;
      startScheduler(interval);

      process.on('SIGTERM', () => {
        stopScheduler();
        process.exit(0);
      });
      process.on('SIGINT', () => {
        stopScheduler();
        process.exit(0);
      });
      break;
    }

    case 'stop': {
      const result = stopDaemon();
      if (result.stopped) {
        console.log(`daemon stopped (was pid ${result.pid})`);
      } else {
        console.log(`could not stop daemon: ${result.reason}`);
        process.exit(1);
      }
      break;
    }

    case 'status': {
      const status = getDaemonStatus();
      if (status.running) {
        console.log(`daemon running (pid ${status.pid})`);
      } else {
        console.log('daemon not running');
      }
      break;
    }

    default:
      console.log('usage: portwatch-daemon <start|stop|status>');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('daemon error:', err.message);
  process.exit(1);
});
