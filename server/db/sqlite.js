const Database = require('better-sqlite3');
const path = require('path');
const { getTableDefinitions } = require('./schema');
const debug = require('debug')('habit-tracker:db:sqlite');

let db;

const init = () => {
  if (db) return db;

  const dbPath = path.resolve(__dirname, '..', 'habits.db');
  debug(`Opening SQLite database at ${dbPath}`);
  db = new Database(dbPath);

  // Initialize schema
  const queries = getTableDefinitions('sqlite');
  for (const query of queries) {
    db.exec(query);
  }
  debug('Database schema initialized');

  return db;
};

const query = async (sql, params = []) => {
  if (!db) init();
  debug(`Query: ${sql} Params: ${JSON.stringify(params)}`);
  const stmt = db.prepare(sql);
  if (sql.trim().toLowerCase().startsWith('select')) {
    return { rows: stmt.all(...params), rowCount: 0 }; // SQLite doesn't give rowCount for SELECT easily
  } else {
    const info = stmt.run(...params);
    return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
  }
};

// Async wrappers for synchronous SQLite methods to match Postgres interface
const get = async (sql, params = []) => {
  if (!db) init();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const all = async (sql, params = []) => {
  if (!db) init();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const run = async (sql, params = []) => {
  if (!db) init();
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return {
    changes: info.changes,
    lastInsertRowid: info.lastInsertRowid
  };
};

module.exports = {
  query,
  get,
  all,
  run,
  close: async () => {
    if (db) db.close();
  }
};
