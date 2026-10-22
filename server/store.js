/*
 * Tiny JSON-file store (orders, blog posts, email list). Writes are atomic
 * (write to a temp file, then rename) so a crash can't corrupt the data.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function createStore(file) {
  let rows = [];
  if (file && fs.existsSync(file)) rows = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  let timer = null;
  // Small key/value notes kept next to the data (e.g. "blog already seeded")
  const metaFile = file ? file.replace(/\.json$/, '') + '.meta.json' : null;
  let metaData = metaFile && fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8') || '{}') : {};
  function save() {
    if (!file) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 50);
  }
  function flush() {
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(rows));
    fs.renameSync(tmp, file);
  }
  return {
    all: () => rows.slice(),
    get: id => rows.find(r => r.id === id) || null,
    findBy: (k, v) => rows.find(r => r[k] === v) || null,
    insert(row) { rows.push(row); save(); return row; },
    update(id, patch) {
      const r = rows.find(x => x.id === id);
      if (!r) return null;
      Object.assign(r, typeof patch === 'function' ? patch(r) : patch);
      save();
      return r;
    },
    remove(id) {
      const i = rows.findIndex(x => x.id === id);
      if (i === -1) return false;
      rows.splice(i, 1); save(); return true;
    },
    meta(key, value) {
      if (value === undefined) return metaData[key];
      metaData[key] = value;
      if (metaFile) { fs.mkdirSync(path.dirname(metaFile), { recursive: true }); fs.writeFileSync(metaFile, JSON.stringify(metaData)); }
      return value;
    },
    flush
  };
}

module.exports = { createStore };
