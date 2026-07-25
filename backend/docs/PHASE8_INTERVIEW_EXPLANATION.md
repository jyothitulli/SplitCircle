# Phase 8 — Fairness Score Engine: Interview Explanation

A walkthrough of what this phase does and why it's built this way, written as if
explaining it to an interviewer or a teammate doing code review.

## 1. What problem does this solve?

In a shared house, "fairness" is fuzzy — one person might pay for more groceries,
another might do more chores, and someone else might just be more responsive
(settling debts quickly, showing up to do their share). The Fairness Score
Engine turns that fuzziness into a single, explainable number per member per
circle, built from three independent sub-scores so a member can see *why* their
score is what it is, not just the final figure.

## 2. The data model

```prisma
model FairnessScore {
  id                 String   @id @default(uuid()) @db.Uuid
  circleId           String   @db.Uuid
  userId             String   @db.Uuid
  expenseScore       Decimal  @db.Decimal(5, 2)
  choreScore         Decimal  @db.Decimal(5, 2)
  participationScore Decimal  @db.Decimal(5, 2)
  overallScore       Decimal  @db.Decimal(5, 2)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  circle Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([circleId, userId])
  @@index([circleId])
  @@index([userId])
}
```

A few deliberate choices here:

- **`@@unique([circleId, userId])`** — one row per member per circle. Scores are
  *recalculated in place* (upsert), not appended as a history log. This keeps
  `GET /fairness` a single cheap indexed lookup instead of a "latest row per
  user" aggregation query.
- **`Decimal(5, 2)`** for every score — scores are percentages capped at 100.00,
  so 5 significant digits with 2 decimal places is exactly enough range and
  matches how money fields (`Decimal(10, 2)`) are handled elsewhere in this
  schema, for consistency.
- **`onDelete: Cascade`** on both relations — if a circle or user is deleted,
  their fairness rows disappear with them. There's no value in keeping a
  fairness score for a circle that no longer exists.
- Scores are **stored, not computed on every read**. `POST /calculate` is the
  expensive operation (reads every expense, chore, settlement for a circle);
  `GET /fairness` just reads the table. This is the classic
  "compute-then-cache" split — recalculation is triggered explicitly, or
  lazily the first time someone reads a circle with no scores yet.

## 3. The three sub-scores

### Expense Score — "did you cover your share?"

```
expenseScore = min(100, (amountPaid + settlementsSent) / (amountOwed + settlementsReceived) * 100)
```

- `amountOwed` is the sum of the user's `ExpenseParticipant.shareAmount` —
  their actual allocated share of every expense, regardless of split method
  (equal, percentage, or custom). This is the "expected contribution" the
  spec asks for.
- `amountPaid` is the sum of expenses they *fronted* as `paidById`. Someone
  who pays for the group's groceries is covering more than their own share,
  so this number can exceed their `amountOwed`.
- Settlements are folded in symmetrically: paying off a debt counts as
  covering your share even if you never paid for an expense directly; being
  *repaid* increases what you "owed" effectively, since that money is no
  longer yours to keep.
- The score is capped at 100 — fronting 5x the group's expenses doesn't make
  you "500% fair," it makes you fully covered. (The upside of paying more
  than your share shows up in the *balance*, which is a separate Settlement
  Engine concern — fairness is about meeting your obligation, not about who's
  owed money.)
- **Zero-division guard**: if a member has no allocated expense share at all
  (`amountOwed === 0`), they default to 100 rather than `NaN` or 0 — there's
  nothing to be unfair about yet, so they shouldn't be penalized for it.

### Chore Score — "did you do what was assigned?"

```
choreScore = completedChores / assignedChores * 100
```

This is exactly the spec's formula, with the same zero-division guard: a
member with zero assigned chores scores 100, not 0 — an empty to-do list isn't
a failed one.

### Participation Score — "how engaged are you, relative to the most active member?"

```
participationScore = thisUser'sActionCount / mostActiveUser'sActionCount * 100
```

"Activity frequency" is intentionally **relative to the circle**, not an
absolute count against a magic number. A 2-person circle and a 10-person
circle have very different baseline activity levels, so comparing everyone to
whoever is *most* active in their own circle keeps the score meaningful
regardless of circle size. An action is any of: paying an expense, being a
participant in an expense, being assigned a chore, completing a chore,
sending a settlement, or receiving a settlement — i.e., any touchpoint that
shows the member is actually engaged with the circle's shared life, not just
its money.

### Overall Score — the weighted blend

```
overallScore = expenseScore * 0.5 + choreScore * 0.3 + participationScore * 0.2
```

Exactly the weights from the spec. Expense fairness is weighted highest
because money is usually the most contentious axis of shared-living conflict;
chores next because they're the most visible day-to-day fairness signal;
participation last as a smaller modifier that rewards engagement without
letting it dominate the score (you can't out-"participate" your way to 100
while skipping chores and expenses — the math caps that contribution at 20
points).

## 4. Why cents-based integer math internally

Every dollar amount is converted to integer cents (`Math.round(amount * 100)`)
before being summed, and only converted back to a 2-decimal number at the very
end (`roundToTwo`). This avoids classic floating-point drift
(`0.1 + 0.2 !== 0.3`) when summing many small expense shares — the same
pattern already used in `settlement.service.js`, so this stays consistent
with how money is handled everywhere else in the codebase.

## 5. Request flow

```
POST /api/circles/:circleId/fairness/calculate
  -> authenticate (JWT)
  -> validateCircleIdParam (UUID shape check)
  -> fairnessService.calculateCircleFairness(userId, circleId)
       -> requireMembership(userId, circleId)   // 403 if not a member
       -> pull members, expenses, expense participants,
          completed settlements, chore assignments — 5 queries total,
          not N+1 per member
       -> aggregate into an in-memory map keyed by userId
       -> compute the 3 sub-scores + overall per member
       -> upsert all of them inside a single prisma.$transaction
       -> return the list sorted by overallScore desc

GET /api/circles/:circleId/fairness
  -> authenticate -> validateCircleIdParam -> requireMembership
  -> read FairnessScore rows for the circle, sorted desc
  -> if empty (never calculated), calculate on the fly and return that
```

Both endpoints reuse `requireMembership` from `utils/membership.js` and
`validateCircleIdParam` from `circle.validator.js` — the same pattern the
Chore and Settlement modules already use for circle-scoped routes. Fairness
has no resource of its own to validate beyond "is this a real circle and are
you in it," so it deliberately doesn't duplicate that logic into its own
validator file; it composes the existing ones, the same way
`chore.controller.js` and `settlement.controller.js` already do.

## 6. Why `calculate` is a separate endpoint from `get`

Two reasons:

1. **Cost control.** Calculating touches every expense, chore, and settlement
   in a circle. A circle with months of history shouldn't pay that cost on
   every dashboard refresh — only when someone explicitly asks for a
   recalculation (e.g., after a new settlement clears).
2. **Idempotent on-demand snapshots.** Because it's a stored upsert keyed on
   `(circleId, userId)`, calling `calculate` repeatedly with no new activity
   produces the exact same row values every time — it's safe to wire into a
   "Recalculate" button without worrying about duplicate rows or drifting
   numbers.

`GET` still auto-calculates once, the first time a circle has no scores yet,
so the leaderboard is never just an empty list for a brand-new circle.

## 7. What I'd improve with more time

- **Background recalculation** — trigger `calculate` automatically (via a
  queue/event) whenever an expense, chore completion, or settlement payment
  happens, instead of relying on a manual `POST /calculate` call, so the
  leaderboard never goes stale.
- **Score history** — currently only the latest score per member is kept. A
  `FairnessScoreSnapshot` table (one row per calculation, instead of an
  upsert) would let the frontend show a trend line over time.
- **Configurable weights** — the 50/30/20 split is currently hard-coded.
  Promoting it to circle-level settings would let households tune what
  "fair" means to them.
