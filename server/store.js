/*
 * Tiny JSON-file store for biodata orders. Writes are atomic
 * (write to a temp file, then rename) so a crash can't corrupt the data.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function createStore(file) {
  let rows = [];
  if (file && fs.existsSync(file)) rows = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  let timer = null;
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
    flush
  };
}

module.exports = { createStore };
