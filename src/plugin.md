# Plugin System

Portwatch supports a simple plugin system that allows you to hook into scan and diff events.

## Plugin Directory

Plugins are loaded from `~/.portwatch/plugins/` by default. You can override this in your config:

```json
{ "pluginDir": "/path/to/your/plugins" }
```

## Writing a Plugin

A plugin is a plain Node.js module that exports hook functions:

```js
// ~/.portwatch/plugins/my-plugin.js
module.exports = {
  onScan(ports) {
    console.log(`Scanned ${ports.length} ports`);
  },
  onDiff(diff) {
    if (diff.added.length > 0) {
      console.log('New ports opened:', diff.added);
    }
  }
};
```

## Available Hooks

| Hook | Payload | Description |
|------|---------|-------------|
| `onScan` | `ports[]` | Fired after each port scan |
| `onDiff` | `{ added, removed }` | Fired when port changes are detected |
| `onAlert` | `alert` | Fired when an alert is triggered |

## API

- `listPlugins()` — returns names of all installed plugins
- `loadPlugin(name)` — loads and returns a plugin module
- `runPluginHook(name, hook, payload)` — runs a single hook on one plugin
- `runAllPluginHooks(hook, payload)` — runs a hook across all installed plugins
