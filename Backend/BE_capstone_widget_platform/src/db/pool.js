// src/db/pool.js
//
// Single SQLite connection, shared across the app (better-sqlite3 is
// synchronous, so a single connection is safe and fast for this workload).
//
// Why SQLite instead of the Postgres-in-Docker path from the brief?
// The brief explicitly allows "PostgreSQL via Docker (or SQLite to start)".
// SQLite gets a stranger from `git clone` to a running, seeded app with zero
// external services — the fastest way to satisfy "a stranger can run it."
// The data-access layer (src/db/repository.js) is the only place that knows
// about SQL, so swapping the driver for `pg` later touches one file.
// See README § "Swapping the DB for Postgres" for the migration path.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';
const dataDir = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = isTest
  ? ':memory:'
  : process.env.SQLITE_PATH || path.join(dataDir, 'app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
