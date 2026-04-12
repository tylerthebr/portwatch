// portnotebook.js — attach timestamped notes to ports across sessions

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getNotebookPath() {
  return path.join(ensureConfigDir(), 'notebook.json');
}

function loadNotebook() {
  const p = getNotebookPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveNotebook(notebook) {
  fs.writeFileSync(getNotebookPath(), JSON.stringify(notebook, null, 2));
}

function addNote(port, text) {
  if (!port || !text) throw new Error('port and text are required');
  const notebook = loadNotebook();
  const key = String(port);
  if (!notebook[key]) notebook[key] = [];
  notebook[key].push({ text, createdAt: new Date().toISOString() });
  saveNotebook(notebook);
  return notebook[key];
}

function getNotes(port) {
  const notebook = loadNotebook();
  return notebook[String(port)] || [];
}

function removeNote(port, index) {
  const notebook = loadNotebook();
  const key = String(port);
  if (!notebook[key] || !notebook[key][index]) return false;
  notebook[key].splice(index, 1);
  if (notebook[key].length === 0) delete notebook[key];
  saveNotebook(notebook);
  return true;
}

function clearNotes(port) {
  const notebook = loadNotebook();
  delete notebook[String(port)];
  saveNotebook(notebook);
}

function allAnnotatedPorts() {
  return Object.keys(loadNotebook()).map(Number);
}

module.exports = {
  getNotebookPath,
  loadNotebook,
  saveNotebook,
  addNote,
  getNotes,
  removeNote,
  clearNotes,
  allAnnotatedPorts,
};
