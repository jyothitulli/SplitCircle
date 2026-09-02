# SplitCircle

> Premium shared expense splitting — fintech-grade web app with PWA, Electron, Capacitor, and full dark/light theming.

---

## Quick Start

### Database (required first)

SplitCircle's Prisma schema targets PostgreSQL only (it uses `@db.Uuid` and
`Decimal` column types that SQLite doesn't support) — you need a real
Postgres instance even for local development. The fastest way to get one:

```bash
docker run --name splitcircle-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=splitcircle -p 5432:5432 -d postgres
```

Then set `DATABASE_URL` in `backend/.env` to something like
`postgresql://postgres:postgres@localhost:5432/splitcircle`.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev
npm run dev        # Starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 (CSS variable design tokens, dark/light) |
| Routing | React Router v6 with lazy loading |
| State | TanStack React Query v5 |
| Forms | React Hook Form |
| Animation | Framer Motion throughout |
| Charts | Recharts (AreaChart, BarChart, RadarChart) |
| Backend | Node.js + Express + Prisma |
| DB | PostgreSQL (required for dev and prod — see Quick Start below) |
| AI | Google Gemini (insights + conflict prediction) |
| OCR | Tesseract.js + Cloudinary |

---

## Features

### Core
- ✅ Authentication (register, login, JWT)
- ✅ Circles — create groups, invite by email
- ✅ Expenses — add, edit, delete; EQUAL / PERCENTAGE / CUSTOM splits
- ✅ Balances — real-time per-circle balance tracking
- ✅ Settlements — optimized payment graph, mark as paid
- ✅ Chores — create tasks, assign, complete
- ✅ Fairness Score — composite score with radar chart
- ✅ OCR Receipt Upload — scan → editable draft → save as expense
- ✅ AI Insights — Gemini spending analysis + conflict prediction

### Design
- ✅ Premium design system: `#1F4D3A` / `#B87333` / `#E8D8C4` / `#FAF7F2`
- ✅ Light and dark mode (CSS variables, `localStorage`, OS preference)
- ✅ Fraunces display serif + Inter + JetBrains Mono
- ✅ Framer Motion: page transitions, staggered lists, modal springs, hover lift
- ✅ Skeleton loading on every data-fetching screen
- ✅ Empty states with the SplitCircle orbit mark

### PWA
- ✅ `manifest.json` with shortcuts and icons
- ✅ Service Worker with cache-first shell / network-only API strategy
- ✅ Offline fallback page
- ✅ Install banner (appears on supported browsers automatically)
- ✅ iOS, Android, Windows, macOS, Linux installable

### Desktop (Electron)
- ✅ `electron/` with full `electron-builder` config
- ✅ `.exe` (Windows), `.dmg` (macOS), `AppImage + .deb + .rpm` (Linux)
- ✅ Native menu with keyboard shortcuts (⌘N for expense, ⌘Shift+O for OCR)
- See **DESKTOP_BUILD.md**

### Mobile (Capacitor)
- ✅ `capacitor.config.json` for Android + iOS
- ✅ Camera support for receipt scanning
- ✅ Push and local notifications configured
- See **MOBILE_BUILD.md**

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=4000
GEMINI_API_KEY="your-gemini-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:4000
```

> **Note on OCR:** the receipt-scanning endpoint (`POST /api/ocr/receipt`) uses
> the English trained-data file bundled at `backend/eng.traineddata` — it does
> **not** call any external OCR API and needs no OCR-specific API key. It
> does still need Cloudinary configured (above) to store the uploaded receipt
> image. See `OCR_TROUBLESHOOTING.md` for the full contract and common
> deployment pitfalls (Render/Vercel).

---

## Pages

| Route | Page |
|-------|------|
| `/dashboard` | Overview: trend, categories, balances, recent expenses |
| `/circles` | Manage groups and members |
| `/expenses` | Add / edit / delete expenses with split methods |
| `/balances` | Per-circle balance breakdown |
| `/settlements` | Optimized settlement graph + mark paid |
| `/chores` | Task creation, assignment, completion |
| `/fairness` | Leaderboard + radar chart |
| `/ocr` | Receipt upload → editable draft → save |
| `/voice` | Coming Soon — AI voice entry placeholder |
| `/insights` | Gemini insights + conflict risk prediction |
| `*` | 404 page with brand styling |

---

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Preview
cd frontend && npm run preview

# Backend in production mode
NODE_ENV=production node backend/src/server.js
```
