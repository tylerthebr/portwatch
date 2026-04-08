# portwatch

A lightweight CLI tool to monitor and alert on port usage changes across local dev environments.

## Installation

```bash
npm install -g portwatch
```

## Usage

Start watching for port changes in your current environment:

```bash
portwatch start
```

Watch a specific port and get alerted when its status changes:

```bash
portwatch --port 3000
```

Watch multiple ports and log output to a file:

```bash
portwatch --port 3000,8080,5432 --log ./portwatch.log
```

**Example output:**

```
[portwatch] Monitoring ports: 3000, 8080, 5432
[portwatch] ✔ Port 3000 is now OPEN  (12:04:31)
[portwatch] ✖ Port 8080 is now CLOSED (12:05:10)
```

### Options

| Flag | Description |
|------|-------------|
| `--port` | Comma-separated list of ports to watch |
| `--interval` | Polling interval in milliseconds (default: `1000`) |
| `--log` | Path to write log output |
| `--quiet` | Suppress console output |

## Requirements

- Node.js v14 or higher

## License

[MIT](LICENSE)