// portwatch-annotate.js — attach inline annotations to port entries

const { getTag } = require('./tags');
const { getAlias } = require('./portaliases');
const { getMemo } = require('./portmemo');
const { getLabelForPort } = require('./portlabel');

/**
 * Build a full annotation object for a single port entry.
 * Pulls from tags, aliases, memos, and well-known labels.
 */
function annotateEntry(entry) {
  const port = entry.port;
  return {
    ...entry,
    annotation: {
      tag: getTag(port) || null,
      alias: getAlias(port) || null,
      memo: getMemo(port) || null,
      label: getLabelForPort(port) || null,
    },
  };
}

/**
 * Annotate an array of port entries.
 */
function annotateEntries(entries) {
  return entries.map(annotateEntry);
}

/**
 * Format a single annotation for display.
 * Returns a compact string like: [alias: dev-api] [memo: keep alive] [tag: backend]
 */
function formatAnnotation(annotation) {
  const parts = [];
  if (annotation.label) parts.push(`[${annotation.label}]`);
  if (annotation.alias) parts.push(`[alias: ${annotation.alias}]`);
  if (annotation.tag) parts.push(`[tag: ${annotation.tag}]`);
  if (annotation.memo) parts.push(`[memo: ${annotation.memo}]`);
  return parts.join(' ');
}

/**
 * Return true if the entry has any annotation data.
 */
function hasAnnotation(entry) {
  if (!entry.annotation) return false;
  const { tag, alias, memo, label } = entry.annotation;
  return !!(tag || alias || memo || label);
}

module.exports = { annotateEntry, annotateEntries, formatAnnotation, hasAnnotation };
