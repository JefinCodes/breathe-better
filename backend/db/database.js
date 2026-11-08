const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'india_cities.db');

let db;

/**
 * Returns a singleton read-only SQLite connection.
 * Opening in readonly mode prevents any accidental writes and is
 * safe for concurrent reads.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    // Enable WAL journal mode query for read performance (readonly connections
    // cannot set PRAGMA journal_mode, but they benefit from it if already set).
  }
  return db;
}

module.exports = { getDb };
