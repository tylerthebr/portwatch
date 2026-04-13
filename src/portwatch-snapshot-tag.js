// portwatch-snapshot-tag.js
// Tag snapshots for easy reference and retrieval

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getSnapshotTagPath() {
  return path.join(ensureConfigDir(), 'snapshot-tags.json');
}

function loadSnapshotTags() {
  const p = getSnapshotTagPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveSnapshotTags(tags) {
  fs.writeFileSync(getSnapshotTagPath(), JSON.stringify(tags, null, 2));
}

function tagSnapshot(tag, snapshotId) {
  if (!tag || !snapshotId) throw new Error('tag and snapshotId are required');
  const tags = loadSnapshotTags();
  tags[tag] = { snapshotId, taggedAt: new Date().toISOString() };
  saveSnapshotTags(tags);
  return tags[tag];
}

function untagSnapshot(tag) {
  const tags = loadSnapshotTags();
  if (!tags[tag]) return false;
  delete tags[tag];
  saveSnapshotTags(tags);
  return true;
}

function getSnapshotIdByTag(tag) {
  const tags = loadSnapshotTags();
  return tags[tag] ? tags[tag].snapshotId : null;
}

function listSnapshotTags() {
  return loadSnapshotTags();
}

function clearSnapshotTags() {
  saveSnapshotTags({});
}

module.exports = {
  getSnapshotTagPath,
  loadSnapshotTags,
  saveSnapshotTags,
  tagSnapshot,
  untagSnapshot,
  getSnapshotIdByTag,
  listSnapshotTags,
  clearSnapshotTags
};
