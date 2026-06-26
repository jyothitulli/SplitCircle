# Phase 8 — Fairness Score Engine

Computes and surfaces a per-member "fairness" leaderboard for each circle,
blending expense contribution, chore completion, and participation into a
single weighted score.

## Files added/touched in this phase

```
backend/
├── prisma/
│   ├── schema.prisma                                  # FairnessScore model
│   └── migrations/20260619165337_add_fairness_score/   # CreateTable migration
├── src/
│   ├── routes/fairness.routes.js                       # POST /calculate, GET /
│   ├── controllers/fairness.controller.js
│   ├── services/fairness.service.js                    # scoring logic
│   └── routes/circle.routes.js                         # mounts fairness router at /:circleId/fairness
├── docs/
│   ├── PHASE8_INTERVIEW_EXPLANATION.md
│   └── PHASE8_EDGE_CASES.md
├── postman/
│   ├── SplitCircle_Phase8_Fairness.postman_collection.json
│   └── build_collection.js                             # regenerates the collection above
└── test-fairness.js                                     # standalone Node integration script
```

## API Reference

All endpoints require `Authorization: Bearer <token>` and circle membership.

### `POST /api/circles/:circleId/fairness/calculate`

Recalculates and persists fairness scores for every member of the circle.

```json
// 200 OK
{
  "success": true,
  "message": "Fairness scores calculated successfully",
  "data": {
    "scores": [
      {
        "id": "...",
        "circleId": "...",
        "userId": "...",
        "expenseScore": "100.00",
        "choreScore": "100.00",
        "participationScore": "100.00",
        "overallScore": "100.00",
        "user": { "id": "...", "name": "...", "email": "...", "avatarUrl": null }
      }
    ]
  }
}
```

### `GET /api/circles/:circleId/fairness`

Returns the stored leaderboard, sorted by `overallScore` descending.
Auto-calculates on first read if the circle has no scores yet.

```json
// 200 OK
{
  "success": true,
  "data": { "leaderboard": [ /* same shape as scores[] above */ ] }
}
```

### Error responses

| Status | When |
|--------|------|
| 400 | `circleId` is not a valid UUID |
| 401 | Missing/invalid/expired JWT |
| 403 | Caller is not a member of the circle |

## Fairness Formula

```
expenseScore       = min(100, (amountPaid + settlementsSent) / (amountOwed + settlementsReceived) * 100)
choreScore         = completedChores / assignedChores * 100
participationScore = thisUser'sActions / mostActiveMember'sActions * 100

overallScore = expenseScore * 0.5 + choreScore * 0.3 + participationScore * 0.2
```

See `docs/PHASE8_INTERVIEW_EXPLANATION.md` for the full rationale, and
`docs/PHASE8_EDGE_CASES.md` for boundary behavior.

## Running the tests

### Option A — standalone integration script

```bash
cd backend
node test-fairness.js
```

Spins up two real users, a circle, an expense, two chores, and a settlement
against your local Postgres (`DATABASE_URL` in `.env`), then asserts the
exact score values at each stage.

### Option B — Postman collection

1. Open Postman → Import → `backend/postman/SplitCircle_Phase8_Fairness.postman_collection.json`.
2. Make sure the backend is running locally (`npm run dev:backend`, default `http://localhost:5000`).
3. Run the whole collection with the **Collection Runner**, top to bottom.
   It's self-contained: it registers its own throwaway users, creates its own
   circle, and chains every ID through collection variables — no manual setup
   needed, and it's safe to re-run (emails are timestamped).
4. The collection covers, in order:
   - **Setup** — register 3 users, create a circle, add a member.
   - **Happy path** — expense + chores → `calculate` → `GET` → settle up →
     recalculate → verify both members converge to 100.
   - **Edge cases** — missing auth (401), malformed circle ID (400),
     well-formed but non-member circle ID (403), outsider access (403), and
     an empty circle auto-calculating to a baseline 100 on first read.

To regenerate the collection file after editing `build_collection.js`:

```bash
cd backend/postman
node build_collection.js
```

## Validation performed while building this phase

- Applied all 5 Prisma migrations (including the Phase 8 one) against a real
  local PostgreSQL instance — schema is verified to create cleanly with no
  conflicts.
- `node --check` on every touched file (no syntax errors) and a full
  `eslint . --ext .js` run (zero warnings/errors).
- Manually traced the scoring formulas against the scenarios asserted in
  `test-fairness.js` — computed values match exactly at every stage
  (before settlement, after settlement, after both chores complete).
- Running the live server against Prisma's query engine requires a
  platform-matched binary (`prisma generate`), which downloads from
  Prisma's CDN — not reachable from this sandboxed build environment, so the
  full HTTP round-trip couldn't be executed here. It will work normally with
  `npm install` on a machine with normal internet access (`schema.prisma` now
  also requests the `debian-openssl-3.0.x` binary target alongside `native`,
  so this works the same on Linux servers/CI as it does locally on Windows).
