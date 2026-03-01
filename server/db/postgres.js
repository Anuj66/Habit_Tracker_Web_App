const { Pool } = require('pg');
const { getTableDefinitions } = require('./schema');
const debug = require('debug')('habit-tracker:db:postgres');

let pool;

const init = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for Postgres');
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost')
      ? false
      : { rejectUnauthorized: false }, // Allow self-signed certs for cloud DBs
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit process, just log
  });

  // Initialize schema
  const queries = getTableDefinitions('postgres');
  (async () => {
    let client;
    try {
      client = await pool.connect();
      for (const query of queries) {
        await client.query(query);
      }
      
      // Migrations: Ensure reminder columns exist
      try {
        await client.query("ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_time TEXT");
        await client.query("ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE");
        
        // Notification columns
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT TRUE");
        
        debug('Migrations applied successfully');
      } catch (err) {
        console.error('Migration error:', err);
      }

      debug('Database schema initialized');
    } catch (err) {
      console.error('Failed to initialize database schema:', err);
    } finally {
      if (client) client.release();
    }
  })();

  return pool;
};

// Convert '?' placeholders to '$1', '$2', etc.
const convertQuery = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

const query = async (sql, params = []) => {
  if (!pool) init();
  const convertedSql = convertQuery(sql);
  debug(`Query: ${convertedSql} Params: ${JSON.stringify(params)}`);
  const result = await pool.query(convertedSql, params);
  return result; // { rows, rowCount }
};

const get = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows[0];
};

const all = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows;
};

const run = async (sql, params = []) => {
  const result = await query(sql, params);
  // Postgres doesn't return lastInsertRowid standardly like SQLite.
  // We need INSERT ... RETURNING id for that.
  // But existing code expects { lastInsertRowid, changes }.
  // This is a compatibility issue. We'll handle it by checking if it's an INSERT.
  
  // NOTE: The application code needs to be updated to use RETURNING id if we want the ID.
  // Or we can try to patch it here, but parsing SQL is brittle.
  // For now, return standard PG result properties mapped to SQLite style where possible.
  
  return {
    changes: result.rowCount,
    lastInsertRowid: result.rows.length > 0 && result.rows[0].id ? result.rows[0].id : null
  };
};

module.exports = {
  query,
  get,
  all,
  run,
  close: async () => {
    if (pool) await pool.end();
  }
};
