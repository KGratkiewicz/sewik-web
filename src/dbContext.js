// dbContext.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const isPkg = typeof process.pkg !== "undefined";
// gdy jest exe – bierzemy katalog, w którym leży plik wykonywalny
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

// baza leży obok exe:  <katalog>/sewik.db
const dbPath = path.join(baseDir, "sewik.db");
const db = new sqlite3.Database(dbPath);

module.exports = db;
