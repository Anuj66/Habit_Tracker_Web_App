const debug = require('debug')('habit-tracker:db');

const isPostgres = !!process.env.DATABASE_URL;

debug(`Using database driver: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

const db = isPostgres ? require('./postgres') : require('./sqlite');

module.exports = db;
