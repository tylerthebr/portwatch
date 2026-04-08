import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Parses raw `ss` or `netstat` output into a list of port entries.
 * @param {string} raw
 * @returns {{ port: number, protocol: string, state: string, pid: string | null }[]}
 */
export function parsePortOutput(raw) {
  const lines = raw.trim().split('\n').slice(1); // skip header
  const results = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const protocol = parts[0];
    const state = parts[1];
    const localAddr = parts[4];

    const portMatch = localAddr.match(/:([\d]+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    const pidRaw = parts[6] || null;
    const pidMatch = pidRaw && pidRaw.match(/pid=(\d+)/);
    const pid = pidMatch ? pidMatch[1] : null;

    results.push({ port, protocol, state, pid });
  }

  return results;
}

/**
 * Scans currently open ports on the system.
 * @returns {Promise<{ port: number, protocol: string, state: string, pid: string | null }[]>}
 */
export async function scanPorts() {
  try {
    const { stdout } = await execAsync('ss -tulnp');
    return parsePortOutput(stdout);
  } catch (err) {
    throw new Error(`Failed to scan ports: ${err.message}`);
  }
}
