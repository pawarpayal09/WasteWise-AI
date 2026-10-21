/**
 * WasteWise AI — authentication utilities.
 *
 * Real password hashing with Node's built-in scrypt (no external service,
 * no cloud auth provider). Sessions are opaque random tokens stored in
 * SQLite and delivered via an httpOnly cookie.
 */

import crypto from 'node:crypto'
import { createUser, findUserByEmail, publicUser } from './db.mjs'

const SCRYPT_KEYLEN = 64
const SESSION_DAYS = 30
export const SESSION_COOKIE = 'ww_session'

/* ------------------------------------------------------------- passwords */

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(password, salt, SCRYPT_KEYLEN)
  const expected = Buffer.from(expectedHash, 'hex')
  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}

/* --------------------------------------------------------------- sessions */

export function newSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function sessionExpiryIso(days = SESSION_DAYS) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 19).replace('T', ' ')
}

export function sessionCookie(token, { maxAgeSeconds = SESSION_DAYS * 86400 } = {}) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function readSessionToken(cookieHeader) {
  if (!cookieHeader) return null
  const parts = String(cookieHeader).split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === SESSION_COOKIE) return decodeURIComponent(rest.join('=') || '')
  }
  return null
}

/* ------------------------------------------------------------ validation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateSignup({ name, email, password, confirm }) {
  const errors = {}
  const cleanName = String(name || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (cleanName.length < 2) errors.name = 'Please enter your name (at least 2 characters).'
  if (cleanName.length > 80) errors.name = 'Name is too long.'
  if (!EMAIL_RE.test(cleanEmail)) errors.email = 'Please enter a valid email address.'
  if (String(password || '').length < 8) errors.password = 'Password must be at least 8 characters.'
  if (String(password || '').length > 200) errors.password = 'Password is too long.'
  if (confirm !== undefined && password !== confirm) errors.confirm = 'Passwords do not match.'

  return {
    errors,
    ok: Object.keys(errors).length === 0,
    value: { name: cleanName, email: cleanEmail, password: String(password || '') },
  }
}

/* ------------------------------------------------------------- register */

export function registerUser({ name, email, password, confirm }) {
  const check = validateSignup({ name, email, password, confirm })
  if (!check.ok) return { ok: false, errors: check.errors }

  if (findUserByEmail(check.value.email)) {
    return { ok: false, errors: { email: 'An account with this email already exists. Try signing in.' } }
  }

  const { hash, salt } = hashPassword(check.value.password)
  const row = createUser({ name: check.value.name, email: check.value.email, passwordHash: hash, salt })
  return { ok: true, user: publicUser(row) }
}

export function loginUser({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const row = findUserByEmail(cleanEmail)

  // Deliberate constant-ish response: never reveal whether the email exists.
  if (!row) return { ok: false, error: 'Incorrect email or password.' }

  const good = verifyPassword(String(password || ''), row.salt, row.password_hash)
  if (!good) return { ok: false, error: 'Incorrect email or password.' }

  return { ok: true, user: publicUser(row) }
}
