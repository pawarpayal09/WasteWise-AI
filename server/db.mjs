/**
 * WasteWise AI — local SQLite database layer (better-sqlite3).
 *
 * Creates ./data/wastewise.db automatically on first run and keeps it in
 * sync on every start. No external database server, no Cloudflare account,
 * no cloud credentials required — the whole app runs on your laptop.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const DB_FILE = path.join(DATA_DIR, 'wastewise.db')

fs.mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/* ------------------------------------------------------------------ schema */

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  salt          TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS waste_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  item_label TEXT    NOT NULL,
  category   TEXT,
  pathway    TEXT,
  action     TEXT,
  confidence INTEGER,
  mode       TEXT    DEFAULT 'demo',
  answers    TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_waste_user    ON waste_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waste_pathway ON waste_events(pathway);

CREATE TABLE IF NOT EXISTS challenge_signups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  org        TEXT    NOT NULL,
  contact    TEXT,
  goal       INTEGER,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`)

/* ------------------------------------------------------------------ users */

const insertUserStmt = db.prepare(
  `INSERT INTO users (name, email, password_hash, salt) VALUES (@name, @email, @password_hash, @salt)`
)
const userByEmailStmt = db.prepare(`SELECT * FROM users WHERE email = ?`)
const userByIdStmt = db.prepare(`SELECT * FROM users WHERE id = ?`)

export function createUser({ name, email, passwordHash, salt }) {
  const info = insertUserStmt.run({ name, email, password_hash: passwordHash, salt })
  return userByIdStmt.get(info.lastInsertRowid)
}

export function findUserByEmail(email) {
  return userByEmailStmt.get(email) || null
}

export function findUserById(id) {
  return userByIdStmt.get(id) || null
}

export function publicUser(row) {
  if (!row) return null
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at }
}

/* --------------------------------------------------------------- sessions */

const insertSessionStmt = db.prepare(
  `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
)
const sessionStmt = db.prepare(
  `SELECT s.token, s.user_id, s.expires_at, u.name, u.email
     FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?`
)
const deleteSessionStmt = db.prepare(`DELETE FROM sessions WHERE token = ?`)
const purgeSessionsStmt = db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`)

export function createSession(token, userId, expiresAtIso) {
  insertSessionStmt.run(token, userId, expiresAtIso)
}

export function getSession(token) {
  if (!token) return null
  const row = sessionStmt.get(token)
  if (!row) return null
  if (new Date(row.expires_at + 'Z').getTime() < Date.now()) {
    deleteSessionStmt.run(token)
    return null
  }
  return row
}

export function destroySession(token) {
  if (token) deleteSessionStmt.run(token)
}

export function purgeExpiredSessions() {
  purgeSessionsStmt.run()
}

/* ---------------------------------------------------------- waste events */

const listEventsStmt = db.prepare(
  `SELECT * FROM waste_events WHERE user_id = ? ORDER BY id DESC LIMIT 300`
)
const insertEventStmt = db.prepare(
  `INSERT INTO waste_events (user_id, item_label, category, pathway, action, confidence, mode, answers, created_at)
   VALUES (@user_id, @item_label, @category, @pathway, @action, @confidence, @mode, @answers, @created_at)`
)
const deleteEventStmt = db.prepare(`DELETE FROM waste_events WHERE id = ? AND user_id = ?`)
const clearEventsStmt = db.prepare(`DELETE FROM waste_events WHERE user_id = ?`)
const countEventsStmt = db.prepare(`SELECT COUNT(*) AS n FROM waste_events WHERE user_id = ?`)

export function listEvents(userId) {
  return listEventsStmt.all(userId)
}

export function addEvent(userId, ev) {
  const info = insertEventStmt.run({
    user_id: userId,
    item_label: ev.itemLabel || 'Unknown item',
    category: ev.category || 'Mixed/Unknown',
    pathway: ev.pathway || null,
    action: ev.action || 'Analysed',
    confidence: ev.confidence ?? null,
    mode: ev.mode || 'demo',
    answers: ev.answers ? JSON.stringify(ev.answers) : null,
    created_at: ev.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
  })
  return info.lastInsertRowid
}

export function deleteEvent(userId, id) {
  return deleteEventStmt.run(id, userId).changes
}

export function clearEvents(userId) {
  return clearEventsStmt.run(userId).changes
}

export function countEvents(userId) {
  return countEventsStmt.get(userId).n
}

/* -------------------------------------------------------------- challenges */

const insertChallengeStmt = db.prepare(
  `INSERT INTO challenge_signups (user_id, org, contact, goal) VALUES (?, ?, ?, ?)`
)

export function addChallenge(userId, { org, contact, goal }) {
  const info = insertChallengeStmt.run(userId ?? null, org, contact ?? null, goal ?? 500)
  return info.lastInsertRowid
}

export const DB_FILE_PATH = DB_FILE
