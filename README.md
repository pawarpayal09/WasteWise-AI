# WasteWise AI

> **Don't Throw It. Ask AI.**

WasteWise AI is an AI-powered circular-economy assistant that answers one question for an unwanted item:

> **"What is the best next action for this item?"**

It does not stop at waste *classification*. Its **Second-Life Engine** recommends a pathway —
REUSE → REPAIR → DONATE → REPURPOSE → RECYCLE → SAFE DISPOSAL — and only falls back to disposal
when reuse, repair, donation and repurposing are genuinely unsuitable.

**Runs entirely on your own computer.** No cloud account, no API keys, no cloud services.
Just Node.js and a local SQLite file.

---

## Table of contents

1. [Features](#features)
2. [Getting started (run it in VS Code)](#getting-started-run-it-in-vs-code)
3. [Using the app](#using-the-app)
4. [Commands](#commands)
5. [Troubleshooting](#troubleshooting)
6. [Demo Mode & safety override](#demo-mode--safety-override)
7. [How the Second-Life Engine works](#how-the-second-life-engine-works)
8. [Responsible AI](#responsible-ai)
9. [Data & privacy](#data--privacy)
10. [API reference](#api-reference)
11. [Project structure](#project-structure)
12. [Tech stack](#tech-stack)
13. [Optional: real vision API](#optional-real-vision-api)
14. [Next steps](#next-steps)

---

## Features

### Real user accounts

- **Create account** — name, email, password (8+ chars, confirm field)
- **Sign in / Sign out** — sessions last 30 days
- Passwords hashed with **scrypt** + per-user salt (never stored in plain text)
- Sessions are opaque random tokens in an httpOnly cookie
- **Per-user data isolation** — each account only ever sees its own history
- No email verification or password reset — this is a hackathon demo, deliberately kept simple

### The 8 screens

| Screen | Purpose |
|---|---|
| **Home** | Hero, tagline, both CTAs, the second-life ladder, Problem → Solution → Innovation |
| **Scan Item** | Image upload, drag & drop, describe-by-text, 6 demo sample items |
| **AI Analysis** | Detected item, waste category, visible condition, confidence ring, safety warning, 4 action cards |
| **Second-Life Engine** | 2–4 contextual questions per category; recommended pathway updates **live** |
| **Action Plan** | "Your best next step" — why / next steps / safety / alternative + record the outcome |
| **My Impact** | Stat cards, doughnut + bar charts, waste journey timeline, behaviour-based impact |
| **Campus Challenge** | Participation metrics, team leaderboard, challenge sign-up form |
| **History** | Every analysed item and recorded decision, with delete |

### Waste categories supported

E-waste · Batteries · Plastic · Paper/Cardboard · Glass · Metal · Textile ·
Organic waste · Furniture · Appliances · Mixed/Unknown

---

## Getting started (run it in VS Code)

**Requirements:** Node.js 18 or newer (20 or 22 recommended). No other accounts or keys needed.

### Step 1 — Install Node.js (skip if you already have it)

Open a terminal in VS Code (**Terminal → New Terminal**) and run:

```bash
node -v
```

- Prints `v18.x`, `v20.x`, `v22.x` or higher → you're ready, go to Step 2.
- "command not found" → download the **LTS** installer from <https://nodejs.org>, install with default
  options, then **close and reopen VS Code** and run `node -v` again.

### Step 2 — Get the project and open it in VS Code

**Option A — clone from GitHub:**

```bash
git clone https://github.com/<your-username>/WasteWise-AI.git
cd WasteWise-AI
code .
```

**Option B — from a zip file:** unzip it, then in VS Code choose **File → Open Folder…** and select the
folder that directly contains `package.json`.

Then open a terminal inside it: **Terminal → New Terminal**.

### Step 3 — Install dependencies (one time only)

```bash
npm install
```

This installs `hono`, `@hono/node-server` and `better-sqlite3` and takes about 10–30 seconds.

> **Windows note:** `better-sqlite3` is a native module. If `npm install` shows build errors, install
> **Visual Studio Build Tools** ("Desktop development with C++") from
> <https://visualstudio.microsoft.com/visual-cpp-build-tools/> and run `npm install` again.
> Using Node LTS (20 or 22) usually avoids this.

### Step 4 — Start the app

```bash
npm start
```

You'll see:

```
  ▲ WasteWise AI is running

  Open in your browser:  http://localhost:3000
  Database file:         /path/to/wastewise-ai/data/wastewise.db
  Press Ctrl+C to stop.
```

For auto-restart whenever you save a file, use `npm run dev` instead.

### Step 5 — Open it in your browser

**Ctrl + click** the `http://localhost:3000` link in the VS Code terminal, or paste it into
Chrome / Edge / Firefox / Safari. You'll land on the **Create account** screen.

### Step 6 — Stop the app

Click the terminal and press **Ctrl + C**.

---

## Using the app

1. Enter your **name**, **email** and a **password** (8+ characters) → **Create my account**
2. Click **Scan Item** in the sidebar
3. Click the **Old Laptop** sample → **Analyze with AI**
4. Answer the 4 questions → **Generate my action plan**
5. Click **Mark as Reused** to save it
6. Open **My Impact** to see your dashboard

The database starts **empty**. Sign up with any email you like, for example:

| Name | Email | Password |
|---|---|---|
| Alex Kumar | `alex@example.com` | `supersecret123` |
| Priya Sharma | `priya@example.com` | `mypassword456` |

Every person who opens the app can create their own account, and each account only sees its own history.

---

## Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm start` | Run at <http://localhost:3000> |
| `npm run dev` | Run with auto-restart on file changes |
| `npm run reset-db` | Delete the database (wipes all accounts + history) |

Run on a different port:

```bash
# macOS / Linux / Git Bash
PORT=3001 npm start

# Windows PowerShell
$env:PORT=3001; npm start
```

**Share on your local network (optional):** the server listens on all interfaces, so a friend on the
same Wi‑Fi can open `http://<your-laptop-ip>:3000` (for example `http://192.168.1.20:3000`).

---

## Troubleshooting

**"Port 3000 is already in use"** — close whatever is using it, or start on another port (see above).

**"npm: command not found" / "npm is not recognized"** — Node.js isn't installed, or VS Code wasn't
restarted after installing it. Redo Step 1.

**"Cannot find package.json"** — your terminal is in the wrong folder. `cd` into the project folder
(the one containing `package.json`).

**"Cannot find module 'better-sqlite3'"** — run `npm install` again from inside the project folder.

**PowerShell: "running scripts is disabled"** — run once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or switch the terminal to Command Prompt using the
dropdown next to the **+** in the terminal panel.

**Page is blank or stuck on "Loading WasteWise AI…"** — open the browser console (`F12` → Console) and look
for errors. Make sure the terminal running `npm start` is still open and shows no red text.

**Database deleted or corrupted** — run `npm run reset-db`, then `npm start`. A fresh database is created
automatically (you'll need to sign up again).

---

## Demo Mode & safety override

Demo Mode uses curated sample analyses so a presentation can never fail on a network hiccup. Six demo
items, each producing a **different** intelligent result:

| Demo item | Category | Typical outcome |
|---|---|---|
| **Old Laptop** | E-waste | Full Second-Life Engine flow → reuse / repair |
| **Plastic Bottle** | Plastic | Repurpose or recycle |
| **Old Clothes** | Textile | Reuse / donate, or repurpose if unwearable |
| **Broken Chair** | Furniture | Repair (solid wood is highly repairable) |
| **Phone Battery** | Batteries | Safety-first → authorised collection |
| **Old Phone** | E-waste | Reuse / donate / repair |

### The safety override

A genuine hazard answer — **damaged battery, swelling, leaks, exposed wiring, burn marks, chemical
smell** — forces **SAFE DISPOSAL** to the top and caps every other pathway below it. The recommendation
card shows *"Safety override active"*.

Caution flags that are **not** disposal triggers (e.g. furniture splinters) are handled separately, so a
repairable chair is never sent to disposal.

---

## How the Second-Life Engine works

1. Each item has a **base signal profile** (how strong each pathway looks from the image).
2. Each category has its own **question bank** (electronics, textiles, furniture, batteries, plastic,
   glass, paper, organic, metal, generic).
3. Every answer applies **+/- weights** to the six pathways.
4. Scores are clamped 0–100, ranked, and the top pathway becomes the recommendation.
5. If a **hazard** answer was given, the safety override re-scores so disposal wins.
6. Confidence blends the item's detection confidence with the winning margin.

Because answers change the weights, the **same item gives different advice** depending on the user's
situation — which is the whole point.

---

## Responsible AI

- Every image-derived statement is labelled an **AI estimate**, never a physical inspection.
- The UI states plainly that hidden internal damage, exact material composition, true repairability and
  real-world recyclability **cannot** be determined from a photo.
- Impact is reported as **behaviour** ("You identified a second-life pathway for 11 of 12 items"),
  never invented kilograms or CO₂ figures.
- **No DIY instructions** for batteries, electrical wiring, chemicals, medicines, or hazardous
  materials — those route to authorised collection or professional guidance.
- Campus figures are explicitly labelled **demonstration data**.

---

## Data & privacy

Everything lives in one local file:

```
data/wastewise.db          # real SQLite database
```

Four tables: `users`, `sessions`, `waste_events`, `challenge_signups`.

- Passwords: **scrypt** hash + 16-byte random salt per user
- Login errors are deliberately vague ("Incorrect email or password") so the API never reveals whether
  an email is registered
- All history queries are scoped by `user_id` — enforced server-side, not in the UI
- Deleting a user cascades to their sessions and history
- `data/` is git-ignored, so databases never get committed
- Because it's a single file, you can copy the project to another laptop and your accounts + history
  come with it

---

## API reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Create account → sets session cookie |
| `POST` | `/api/auth/login` | — | Sign in → sets session cookie |
| `POST` | `/api/auth/logout` | — | Destroy session |
| `GET` | `/api/auth/me` | — | Current user, or `{ user: null }` |

### Analysis (public)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Service + mode status |
| `GET` | `/api/demo-items` | 6 demo items + 11 categories |
| `GET` | `/api/categories` | Waste category list |
| `POST` | `/api/analyze` | `{ itemId }` or `{ fileName }` → detection result |
| `POST` | `/api/recommend` | `{ itemId, answers }` → pathway + scores + reasoning |
| `GET` | `/api/items/:id` | Full analysis profile for one item |
| `GET` | `/api/campus` | Campus challenge metrics |

### User data (requires sign-in)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/history` | This account's waste history |
| `POST` | `/api/history` | Save an event |
| `DELETE` | `/api/history/:id` | Delete one event |
| `DELETE` | `/api/history` | Clear this account's history |
| `GET` | `/api/history/count` | Count for this account |
| `POST` | `/api/challenge` | Register a Campus Circularity Challenge |

**Example:**

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"itemId":"laptop","answers":{"power":"yes","repair_ok":"yes","other_user":"yes","hazard":"no"}}'
# → pathway: "reuse"
```

---

## Project structure

```
wastewise-ai/
├── server/
│   ├── index.mjs       # Hono app: auth, API routes, static + SPA serving
│   ├── db.mjs          # SQLite schema & queries (better-sqlite3)
│   ├── auth.mjs        # scrypt hashing, sessions, validation
│   ├── wastewise.mjs   # Categories, demo dataset, question banks, engines
│   └── reset.mjs       # `npm run reset-db`
├── public/
│   ├── index.html      # App shell + auth screen container
│   └── static/
│       ├── app.js      # SPA router, auth UI, screens, charts, engine
│       ├── styles.css  # Design system, light/dark themes
│       └── favicon.svg
├── data/               # SQLite database (auto-created, git-ignored)
├── README.md
└── package.json
```

---

## Tech stack

- **Node.js** + **Hono** (served via `@hono/node-server`)
- **better-sqlite3** — local SQLite, no database server needed
- **Node `crypto.scryptSync`** — password hashing, zero auth dependencies
- **Vanilla JavaScript** SPA (no framework, no build step)
- **Chart.js**, **Font Awesome**, **Plus Jakarta Sans / Inter** via CDN

No bundler, no transpiler. Edit a file, refresh the browser.

---

## Optional: real vision API

Demo Mode is the default so the app always works offline. The app does **not** read an API key out of the
box — to use a real vision model you must edit `POST /api/analyze` in `server/index.mjs` to call your
provider when a key is present, and fall back to `analyze()` when it isn't:

```js
// sketch — server-side only, never in the browser
const key = process.env.OPENAI_API_KEY
if (key && body.imageBase64) {
  const ai = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* vision request */ }),
  })
  // …map the response onto the same shape `analyze()` returns
}
return c.json(analyze({ itemId: body.itemId, fileName: body.fileName }))
```

Then start the server with the key set:

```bash
# macOS / Linux
OPENAI_API_KEY=sk-... npm start

# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."; npm start
```

Keep the key in `process.env` (or a git-ignored `.env` file) — never in `public/static/app.js`, which the
browser can read, and never commit it to GitHub.

---

## Next steps

- Real vision-API integration behind the existing `/api/analyze` contract
- Password reset / email verification
- Map integration for nearby repair cafés, donation centres, e-waste drop-offs
- True multi-tenant campus aggregation (leaderboard is demo data today)
- CSV / PDF export of personal impact and printable action plans
- Region-aware recycling rules from a verified database

---

**Platform:** Local Node.js (no cloud dependency) · **Last updated:** 2026-10-20

*Don't throw it — ask AI.* ♻️