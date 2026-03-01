const getTableDefinitions = (dialect) => {
  const isPg = dialect === 'postgres';

  const autoIncrement = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestamp = isPg ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const boolean = isPg ? 'BOOLEAN' : 'BOOLEAN'; // SQLite handles boolean as int/numeric but accepts BOOLEAN keyword
  const trueVal = isPg ? 'TRUE' : '1';
  const falseVal = isPg ? 'FALSE' : '0';

  const queries = [
    `CREATE TABLE IF NOT EXISTS habits (
      id ${autoIncrement},
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily',
      created_at ${timestamp}
    )`,
    `CREATE TABLE IF NOT EXISTS tracking (
      id ${autoIncrement},
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed ${boolean} DEFAULT ${falseVal},
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS suggestions (
      id ${autoIncrement},
      habit_id INTEGER NOT NULL,
      suggestion TEXT NOT NULL,
      created_at ${timestamp},
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id ${autoIncrement},
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT,
      email_verified ${boolean} DEFAULT ${falseVal},
      failed_login_attempts INTEGER DEFAULT 0,
      lockout_until ${isPg ? 'TIMESTAMP' : 'DATETIME'},
      last_login_at ${isPg ? 'TIMESTAMP' : 'DATETIME'},
      created_at ${timestamp},
      updated_at ${isPg ? 'TIMESTAMP' : 'DATETIME'}
    )`,
    `CREATE TABLE IF NOT EXISTS auth_identities (
      id ${autoIncrement},
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      created_at ${timestamp},
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(provider, provider_user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id ${autoIncrement},
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at ${isPg ? 'TIMESTAMP' : 'DATETIME'} NOT NULL,
      used ${boolean} DEFAULT ${falseVal},
      created_at ${timestamp},
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id ${autoIncrement},
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at ${isPg ? 'TIMESTAMP' : 'DATETIME'} NOT NULL,
      used ${boolean} DEFAULT ${falseVal},
      created_at ${timestamp},
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS error_events (
      id ${autoIncrement},
      timestamp ${timestamp},
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      status_code INTEGER,
      error_code TEXT,
      message TEXT,
      details TEXT,
      path TEXT,
      method TEXT,
      user_id INTEGER,
      request_id TEXT,
      ip TEXT,
      user_agent TEXT
    )`
  ];
  
  return queries;
};

module.exports = { getTableDefinitions };
