// src/db/repository.js
//
// Layered architecture, enforced: routes -> services -> repository -> db.
// Nothing outside this file writes raw SQL. Swapping SQLite for Postgres
// later means rewriting this file's internals, not touching business logic.

const db = require('./pool');
const { v4: uuid } = require('uuid');

const parseJSON = (s, fallback) => {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

// ── Users ──────────────────────────────────────────────────────────────
const Users = {
  create({ email, passwordHash }) {
    const id = uuid();
    db.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`
    ).run(id, email, passwordHash);
    return this.findById(id);
  },
  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  },
  findById(id) {
    return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  },
};

// ── Widgets ────────────────────────────────────────────────────────────
function hydrateWidget(row) {
  if (!row) return null;
  return {
    ...row,
    fields: parseJSON(row.fields, []),
    display_options: parseJSON(row.display_options, {}),
  };
}

const Widgets = {
  create({ userId, type, title, description, fields, buttonText, displayOptions }) {
    const id = uuid();
    db.prepare(
      `INSERT INTO widgets (id, user_id, type, title, description, fields, button_text, display_options)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, userId, type, title, description || null,
      JSON.stringify(fields || []),
      buttonText || 'Submit',
      JSON.stringify(displayOptions || {})
    );
    return this.findById(id);
  },

  findById(id) {
    return hydrateWidget(db.prepare(`SELECT * FROM widgets WHERE id = ?`).get(id));
  },

  // Tenant-scoped lookup — the isolation guarantee lives here, in one place.
  findByIdForUser(id, userId) {
    return hydrateWidget(
      db.prepare(`SELECT * FROM widgets WHERE id = ? AND user_id = ?`).get(id, userId)
    );
  },

  listForUser(userId) {
    return db.prepare(`SELECT * FROM widgets WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId).map(hydrateWidget);
  },

  update(id, userId, patch) {
    const existing = this.findByIdForUser(id, userId);
    if (!existing) return null;
    const merged = {
      type: patch.type ?? existing.type,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      fields: patch.fields ?? existing.fields,
      buttonText: patch.buttonText ?? existing.button_text,
      displayOptions: patch.displayOptions ?? existing.display_options,
    };
    db.prepare(
      `UPDATE widgets SET type=?, title=?, description=?, fields=?, button_text=?,
       display_options=?, version = version + 1, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(
      merged.type, merged.title, merged.description,
      JSON.stringify(merged.fields), merged.buttonText,
      JSON.stringify(merged.displayOptions), id, userId
    );
    return this.findByIdForUser(id, userId);
  },

  delete(id, userId) {
    const result = db.prepare(`DELETE FROM widgets WHERE id = ? AND user_id = ?`).run(id, userId);
    return result.changes > 0;
  },
};

// ── Submissions ────────────────────────────────────────────────────────
function hydrateSubmission(row) {
  if (!row) return null;
  return { ...row, data: parseJSON(row.data, {}), is_spam: !!row.is_spam, email_sent: !!row.email_sent };
}

const Submissions = {
  findByIdempotencyKey(widgetId, key) {
    if (!key) return null;
    return hydrateSubmission(
      db.prepare(`SELECT * FROM submissions WHERE widget_id = ? AND idempotency_key = ?`)
        .get(widgetId, key)
    );
  },

  create({ widgetId, userId, data, ip, country, city, geoProvider, isSpam, idempotencyKey }) {
    const id = uuid();
    db.prepare(
      `INSERT INTO submissions
        (id, widget_id, user_id, data, ip, country, city, geo_provider, is_spam, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, widgetId, userId, JSON.stringify(data || {}), ip || null,
      country || null, city || null, geoProvider || null,
      isSpam ? 1 : 0, idempotencyKey || null
    );
    return this.findById(id);
  },

  markEmailSent(id, sent) {
    db.prepare(`UPDATE submissions SET email_sent = ? WHERE id = ?`).run(sent ? 1 : 0, id);
  },

  findById(id) {
    return hydrateSubmission(db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(id));
  },

  listForWidget(widgetId, userId, { limit = 50, offset = 0 } = {}) {
    return db.prepare(
      `SELECT * FROM submissions WHERE widget_id = ? AND user_id = ? AND is_spam = 0
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(widgetId, userId, limit, offset).map(hydrateSubmission);
  },

  statsForWidget(widgetId, userId) {
    const totals = db.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN is_spam = 1 THEN 1 ELSE 0 END) AS spam,
              SUM(CASE WHEN geo_provider IS NOT NULL THEN 1 ELSE 0 END) AS enriched
       FROM submissions WHERE widget_id = ? AND user_id = ?`
    ).get(widgetId, userId);

    const byDay = db.prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS count
       FROM submissions WHERE widget_id = ? AND user_id = ? AND is_spam = 0
       GROUP BY day ORDER BY day DESC LIMIT 30`
    ).all(widgetId, userId);

    const byCountry = db.prepare(
      `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS count
       FROM submissions WHERE widget_id = ? AND user_id = ? AND is_spam = 0
       GROUP BY country ORDER BY count DESC`
    ).all(widgetId, userId);

    return { totals, byDay, byCountry };
  },

  overviewForUser(userId) {
    return db.prepare(
      `SELECT w.id AS widget_id, w.title,
              COUNT(s.id) AS submission_count,
              SUM(CASE WHEN s.is_spam = 1 THEN 1 ELSE 0 END) AS spam_count
       FROM widgets w
       LEFT JOIN submissions s ON s.widget_id = w.id
       WHERE w.user_id = ?
       GROUP BY w.id ORDER BY submission_count DESC`
    ).all(userId);
  },
};

module.exports = { Users, Widgets, Submissions };
