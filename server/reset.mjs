/**
 * WasteWise AI — reset the local database.
 *
 * Deletes ./data/wastewise.db so the next `npm start` recreates an empty
 * database (all accounts and history removed).
 *
 * Run with:  npm run reset-db
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', 'data')

const targets = ['wastewise.db', 'wastewise.db-wal', 'wastewise.db-shm']
let removed = 0

for (const file of targets) {
  const full = path.join(DATA_DIR, file)
  if (fs.existsSync(full)) {
    fs.rmSync(full)
    removed++
    console.log(`  removed  ${path.relative(process.cwd(), full)}`)
  }
}

if (removed === 0) {
  console.log('  Nothing to remove — no database file found.')
} else {
  console.log('\n  Database reset. Run `npm start` to create a fresh one.\n')
}
