const fs = require("fs");
const path = require("path");

class JsonStore {
  constructor(baseDir) {
    this.baseDir = path.join(__dirname, "..", "..", "..", "..", baseDir);
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  _filePath(name) {
    return path.join(this.baseDir, `${name}.json`);
  }

  _read(name) {
    const file = this._filePath(name);
    if (!fs.existsSync(file)) return null;
    try {
      const raw = fs.readFileSync(file, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  _write(name, data) {
    const file = this._filePath(name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  }

  get(name) {
    return this._read(name);
  }

  set(name, data) {
    this._write(name, data);
  }

  append(name, item) {
    let list = this._read(name);
    if (!Array.isArray(list)) list = [];
    list.push(item);
    this._write(name, list);
    return list.length;
  }

  query(name, filterFn) {
    const data = this._read(name);
    if (!Array.isArray(data)) return [];
    return filterFn ? data.filter(filterFn) : data;
  }

  update(name, filterFn, updateFn) {
    const data = this._read(name);
    if (!Array.isArray(data)) return 0;
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (filterFn(data[i])) {
        data[i] = updateFn(data[i]);
        count++;
      }
    }
    this._write(name, data);
    return count;
  }

  delete(name, filterFn) {
    const data = this._read(name);
    if (!Array.isArray(data)) return 0;
    const before = data.length;
    const filtered = data.filter((item) => !filterFn(item));
    this._write(name, filtered);
    return before - filtered.length;
  }
}

module.exports = JsonStore;
