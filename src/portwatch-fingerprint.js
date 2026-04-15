// portwatch-fingerprint.js
// Generates a stable fingerprint for a port snapshot to detect meaningful changes

const crypto = require('crypto');

/**
 * Normalize a single port entry to a canonical form for hashing.
 * @param {object} entry
 * @returns {string}
 */
function normalizeEntry(entry) {
  return [
    String(entry.port || ''),
    String(entry.protocol || 'tcp').toLowerCase(),
    String(entry.process || '').toLowerCase(),
    String(entry.state || '').toLowerCase()
  ].join('|');
}

/**
 * Build a deterministic fingerprint string from a list of port entries.
 * Entries are sorted before hashing so order doesn't matter.
 * @param {object[]} entries
 * @returns {string} hex fingerprint
 */
function buildFingerprint(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return crypto.createHash('sha1').update('empty').digest('hex');
  }
  const normalized = entries
    .map(normalizeEntry)
    .sort()
    .join('\n');
  return crypto.createHash('sha1').update(normalized).digest('hex');
}

/**
 * Compare two snapshots by fingerprint.
 * @param {object[]} snapshotA
 * @param {object[]} snapshotB
 * @returns {{ changed: boolean, fingerprintA: string, fingerprintB: string }}
 */
function compareFingerprints(snapshotA, snapshotB) {
  const fingerprintA = buildFingerprint(snapshotA);
  const fingerprintB = buildFingerprint(snapshotB);
  return {
    changed: fingerprintA !== fingerprintB,
    fingerprintA,
    fingerprintB
  };
}

/**
 * Annotate a snapshot object with a fingerprint field.
 * @param {object} snapshot - object with an `entries` array
 * @returns {object}
 */
function annotateSnapshotWithFingerprint(snapshot) {
  return {
    ...snapshot,
    fingerprint: buildFingerprint(snapshot.entries || [])
  };
}

module.exports = {
  normalizeEntry,
  buildFingerprint,
  compareFingerprints,
  annotateSnapshotWithFingerprint
};
