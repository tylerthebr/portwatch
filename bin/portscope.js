#!/usr/bin/env node
// bin/portscope.js — CLI for managing port scopes

const { listScopes, loadScope, saveScope, removeScope, diffScopes } = require('../src/portscope');
const { scanPorts } = require('./portwatch');
const { printDiff } = require('../src/reporter');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
Usage: portscope <command> [options]

Commands:
  list                    List all saved scopes
  save <name>             Save current ports as a named scope
  show <name>             Show entries in a scope
  remove <name>           Remove a scope
  diff <scopeA> <scopeB>  Diff two scopes
`);
}

async function main() {
  switch (cmd) {
    case 'list': {
      const scopes = listScopes();
      if (scopes.length === 0) {
        console.log('No scopes saved yet.');
      } else {
        scopes.forEach(s => console.log(` • ${s}`));
      }
      break;
    }

    case 'save': {
      const name = args[0];
      if (!name) { console.error('Scope name required.'); process.exit(1); }
      const entries = await scanPorts();
      const result = saveScope(name, entries);
      console.log(`Saved scope "${name}" with ${result.entries.length} entries at ${result.savedAt}`);
      break;
    }

    case 'show': {
      const name = args[0];
      if (!name) { console.error('Scope name required.'); process.exit(1); }
      const scope = loadScope(name);
      if (!scope) { console.error(`Scope "${name}" not found.`); process.exit(1); }
      console.log(`Scope: ${scope.name} (saved ${scope.savedAt})`);
      scope.entries.forEach(e => console.log(`  ${e.port}/${e.protocol}  ${e.process || ''}`));
      break;
    }

    case 'remove': {
      const name = args[0];
      if (!name) { console.error('Scope name required.'); process.exit(1); }
      const ok = removeScope(name);
      console.log(ok ? `Removed scope "${name}".` : `Scope "${name}" not found.`);
      break;
    }

    case 'diff': {
      const [a, b] = args;
      if (!a || !b) { console.error('Two scope names required.'); process.exit(1); }
      try {
        const diff = diffScopes(a, b);
        console.log(`Diff: ${diff.from} → ${diff.to}`);
        printDiff(diff);
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }

    default:
      usage();
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
