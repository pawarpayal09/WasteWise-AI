/**
 * WasteWise AI — standalone Node.js server.
 *
 * Run with:   npm start
 * Then open:  http://localhost:3000
 *
 * No Cloudflare account, no API keys, no build step. Data is stored in a
 * local SQLite file at ./data/wastewise.db.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

import { analyze, recommend, DEMO_ITEMS, CATEGORIES, campusData, findItem } from './wastewise.mjs'
import {
  db,
  listEvents,
  addEvent,
  deleteEvent,
  clearEvents,
  countEvents,
  addChallenge,
  findUserById,
  purgeExpiredSessions,
  DB_FILE_PATH,
} from './db.mjs'
import {
  registerUser,
  loginUser,
  newSessionToken,
  sessionExpiryIso,
  readSessionToken,
  SESSION_COOKIE,
} from './auth.mjs'
import { createSession, getSession, destroySession, publicUser } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

const app = new Hono()

app.use('*', logger())

/* ---------------------------------------------------------- auth helpers */

/** Resolve the signed-in user for a request, or null. */
function currentUser(c) {
  const token = getCookie(c, SESSION_COOKIE) || readSessionToken(c.req.header('cookie'))
  const session = getSession(token)
  if (!session) return null
  return { id: session.user_id, name: session.name, email: session.email, token }
}

/** Middleware: require a signed-in user for private API routes. */
async function requireAuth(c, next) {
  const user = currentUser(c)
  if (!user) {
    return c.json({ ok: false, error: 'Not signed in', code: 'UNAUTHORIZED' }, 401)
  }
  c.set('user', user)
  await next()
}

function startSession(c, userId) {
  const token = newSessionToken()
  createSession(token, userId, sessionExpiryIso())
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 30 * 86400,
  })
  return token
}

/* ============================================================== AUTH API */

app.post('/api/auth/signup', async (c) => {
  let body = {}
  try { body = await c.req.json() } catch { /* empty */ }

  const result = registerUser({
    name: body.name,
    email: body.email,
    password: body.password,
    confirm: body.confirm,
  })

  if (!result.ok) return c.json({ ok: false, errors: result.errors }, 400)

  startSession(c, result.user.id)
  return c.json({ ok: true, user: result.user })
})

app.post('/api/auth/login', async (c) => {
  let body = {}
  try { body = await c.req.json() } catch { /* empty */ }

  const result = loginUser({ email: body.email, password: body.password })
  if (!result.ok) return c.json({ ok: false, error: result.error }, 401)

  startSession(c, result.user.id)
  return c.json({ ok: true, user: result.user })
})

app.post('/api/auth/logout', (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  destroySession(token)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/auth/me', (c) => {
  const user = currentUser(c)
  if (!user) return c.json({ ok: true, user: null })
  return c.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
})

/* ========================================================== PUBLIC API */

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'wastewise-ai', mode: 'demo', items: DEMO_ITEMS.length, db: path.basename(DB_FILE_PATH) })
)

app.get('/api/demo-items', (c) =>
  c.json({
    ok: true,
    mode: 'demo',
    items: DEMO_ITEMS.map((i) => ({
      id: i.id,
      label: i.label,
      sampleIcon: i.sampleIcon,
      category: i.category,
      detectedItem: i.detectedItem,
    })),
    categories: CATEGORIES,
    notice: 'Demo Mode uses curated sample analyses so the product always works without an external vision API.',
  })
)

app.get('/api/categories', (c) => c.json({ ok: true, categories: CATEGORIES }))

app.post('/api/analyze', async (c) => {
  let body = {}
  try { body = await c.req.json() } catch { /* empty */ }
  return c.json(analyze({ itemId: body.itemId, fileName: body.fileName, source: body.source }))
})

app.post('/api/recommend', async (c) => {
  let body = {}
  try { body = await c.req.json() } catch { /* empty */ }
  return c.json(recommend({ itemId: body.itemId, answers: body.answers || {}, signals: body.signals }))
})

app.get('/api/campus', (c) => c.json({ ok: true, data: campusData() }))

app.get('/api/items/:id', (c) => {
  const item = findItem(c.req.param('id'))
  if (!item) return c.json({ ok: false, error: 'not found' }, 404)
  return c.json({ ok: true, item: analyze({ itemId: item.id }) })
})

/* =================================================== PRIVATE (USER) API */

app.get('/api/history', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ ok: true, events: listEvents(user.id) })
})

app.post('/api/history', requireAuth, (c) => {
  const user = c.get('user')
  return (async () => {
    let body = {}
    try { body = await c.req.json() } catch { /* empty */ }
    const id = addEvent(user.id, body)
    return c.json({ ok: true, id })
  })()
})

app.delete('/api/history/:id', requireAuth, (c) => {
  const user = c.get('user')
  const changes = deleteEvent(user.id, Number(c.req.param('id')))
  return c.json({ ok: true, deleted: changes })
})

app.delete('/api/history', requireAuth, (c) => {
  const user = c.get('user')
  const changes = clearEvents(user.id)
  return c.json({ ok: true, deleted: changes })
})

app.get('/api/history/count', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ ok: true, count: countEvents(user.id) })
})

app.post('/api/challenge', requireAuth, async (c) => {
  const user = c.get('user')
  let body = {}
  try { body = await c.req.json() } catch { /* empty */ }
  const id = addChallenge(user.id, {
    org: body.org || 'WasteWise Campus',
    contact: body.contact || user.email,
    goal: Number(body.goal) || 500,
  })
  return c.json({ ok: true, id })
})

/* ------------------------------------------------------------ static */

app.use('/static/*', serveStatic({ root: './public' }))
app.get('/favicon.ico', (c) => c.redirect('/static/favicon.svg', 302))

/* ------------------------------------------- SPA fallback (all routes) */

function readIndexHtml() {
  return fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8')
}

app.get('*', (c) => c.html(readIndexHtml()))

/* ------------------------------------------------------------- startup */

purgeExpiredSessions()

const server = serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST
  console.log('')
  console.log('  \x1b[32m▲ WasteWise AI is running\x1b[0m')
  console.log('')
  console.log(`  \x1b[1mOpen in your browser:\x1b[0m  \x1b[36mhttp://${shown}:${info.port}\x1b[0m`)
  console.log(`  \x1b[2mDatabase file:\x1b[0m        ${DB_FILE_PATH}`)
  console.log('  \x1b[2mPress Ctrl+C to stop.\x1b[0m')
  console.log('')
})

process.on('SIGINT', () => {
  console.log('\n  Stopping WasteWise AI…')
  server.close(() => {
    try { db.close() } catch { /* ignore */ }
    process.exit(0)
  })
})

export default app
