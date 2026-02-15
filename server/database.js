const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'habits.db');
const db = new Database(dbPath);

// Create tables
const createHabitsTable = `
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const createTrackingTable = `
  CREATE TABLE IF NOT EXISTS tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
  )
`;

const createSuggestionsTable = `
  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    suggestion TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
  )
`;

db.exec(createHabitsTable);
db.exec(createTrackingTable);
db.exec(createSuggestionsTable);

module.exports = db;
