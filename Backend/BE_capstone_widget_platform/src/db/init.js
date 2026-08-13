// src/db/init.js
//
// Schema as migrations: this file *is* the migration, run idempotently
// (CREATE TABLE IF NOT EXISTS) on every boot. For a project this size that
// is the right amount of ceremony — a dedicated migration runner would be
// gold-plating past the "realistic scope" line in the brief (§7).

const db = require('./pool');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS widgets (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type             TEXT NOT NULL CHECK (type IN ('signup_form','cta_popover','contact_form')),
      title            TEXT NOT NULL,
      description      TEXT,
      fields           TEXT NOT NULL,              -- JSON array of {name,label,type,required}
      button_text      TEXT NOT NULL DEFAULT 'Submit',
      display_options  TEXT NOT NULL DEFAULT '{}',  -- JSON: {theme, position, allowedOrigins:[...]}
      version          INTEGER NOT NULL DEFAULT 1,  -- bumped on update -> busts the config cache
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_widgets_user ON widgets(user_id);

    CREATE TABLE IF NOT EXISTS submissions (
      id               TEXT PRIMARY KEY,
      widget_id        TEXT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
      user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- denormalized owner, for isolation
      data             TEXT NOT NULL,               -- JSON of submitted form fields
      ip               TEXT,
      country          TEXT,
      city             TEXT,
      geo_provider     TEXT,                        -- 'ip-api.com' | 'ipapi.co' | NULL (all down)
      is_spam          INTEGER NOT NULL DEFAULT 0,
      email_sent       INTEGER NOT NULL DEFAULT 0,
      idempotency_key  TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_widget ON submissions(widget_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_idem
      ON submissions(widget_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL;
  `);
}

module.exports = init;

if (require.main === module) {
  init();
  console.log('✅ Database schema ready.');
}
