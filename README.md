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
``