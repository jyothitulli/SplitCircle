# Phase 8 — Fairness Score Engine: Edge Cases

How the engine behaves at the boundaries, and where each behavior is
implemented.

| # | Scenario | Behavior | Where it's handled |
|---|----------|----------|---------------------|
| 1 | Circle has zero members (shouldn't normally happen — creator is always added) | `calculate` returns an empty array; `GET` returns an empty leaderboard | `members` query returns `[]`, the aggregation loop and upsert loop simply do nothing |
| 2 | A member has no expense shares at all (`amountOwed === 0`) | `expenseScore` defaults to **100**, not 0 or `NaN` | `effectiveOwed > 0 ? ... : 100` guard in `fairness.service.js` |
| 3 | A member has zero assigned chores | `choreScore` defaults to **100**, not 0 or `NaN` | `s.choreAssignedCount > 0 ? ... : 100` guard |
| 4 | No member in the circle has any activity at all (brand-new circle) | Every member scores `expenseScore=100, choreScore=100, participationScore=100, overallScore=100` — `maxActions` is 0, so the participation guard also defaults to 100 | `maxActions > 0 ? ... : 100` guard |
| 5 | `GET /fairness` called before `POST /calculate` has ever run | The GET endpoint transparently calculates and persists scores instead of returning an empty list | `getCircleFairness` checks `scores.length === 0` and falls back to `calculateCircleFairness` |
| 6 | `POST /calculate` called repeatedly with no new activity in between | Identical scores every time — same `(circleId, userId)` row is upserted, not duplicated | `@@unique([circleId, userId])` + `prisma.fairnessScore.upsert` |
| 7 | A user pays for an expense but isn't one of its participants (e.g., paid for a guest's share) | Their `expensePaidCents` still counts toward `effectivePaid`, even though they have no corresponding `shareAmount` for that expense — this can push their score toward (or past) the 100 cap, which is correct: they covered more than their own obligation | Paid and owed are accumulated from two independent queries (`expenses` vs `expenseParticipants`), not assumed to be 1:1 |
| 8 | A user is removed from a circle (`DELETE /members/me`) after scores were calculated | Their `FairnessScore` row is **not** automatically deleted (membership removal doesn't cascade to fairness scores) — it remains until the next `calculate` run, which only **upserts** for currently-fetched members and never deletes stale rows | Known limitation — see "Not handled" below |
| 9 | Circle ID is not a valid UUID (e.g., `/circles/abc/fairness`) | `400 Invalid circle ID` before any DB query runs | `validateCircleIdParam` regex check |
| 10 | Circle ID is a syntactically valid UUID but doesn't exist, or the caller isn't a member of it | `403 You are not a member of this circle` — the API never distinguishes "circle doesn't exist" from "you're not in it," so it can't be used to enumerate real circle IDs | `requireMembership` — a `findUnique` on the membership join row returns `null` either way |
| 11 | No `Authorization` header, or an expired/invalid JWT | `401 Authentication required` (or the token-specific error from `verifyToken`) before the route handler runs at all | `authenticate` middleware, applied to the whole `fairness.routes.js` router |
| 12 | A user with multiple roles in different circles requests fairness for Circle A while only being a member of Circle B | `403`, scoped per-circle — membership is checked against the exact `circleId` in the URL, not "is this user a member of *any* circle" | `requireMembership(userId, circleId)` |
| 13 | An expense uses `PERCENTAGE` or `CUSTOM` split instead of `EQUAL` | No special-casing needed — the engine reads the final `ExpenseParticipant.shareAmount`, which the Expense Engine has already resolved to a concrete amount regardless of split method | `expense.service.js` is the single source of truth for `shareAmount`; fairness just consumes it |
| 14 | A chore assignment is `MISSED` (recurring chore whose due date passed uncompleted) rather than `PENDING` | Counts toward `choreAssignedCount` but not `choreCompletedCount` — same as a `PENDING` one. The chore score doesn't currently distinguish "still has time" from "missed the deadline" | By design for this phase — see "Not handled" below |
| 15 | Settlements that are still `PENDING` (optimized but not yet paid) | Excluded entirely — only `status: 'COMPLETED'` settlements affect `expenseScore` and the participation action count. A pending settlement doesn't change anyone's fairness yet because no money has actually moved | `where: { circleId, status: 'COMPLETED' }` filter |
| 16 | Very large numbers of expenses/chores in a long-lived circle | `calculate` issues a fixed 5 queries total (members, expenses, expense-participants, completed settlements, chore assignments) regardless of member count — no N+1 query pattern — but it does pull full result sets into memory to aggregate, so extremely large circles (thousands of expenses) would benefit from a future paginated/streaming aggregation | Current implementation trades memory for query-count simplicity |
| 17 | Two users calculating concurrently for the same circle (race condition) | Each `calculate` call recomputes from a fresh read and **upserts** — the last write wins per user row. There's a small window where two concurrent calculations could interleave their upserts, but since they're computing from the same underlying data the resulting values converge to the same numbers either way | `prisma.$transaction` wraps the upserts for atomicity within one call, not across concurrent calls |
| 18 | Floating-point rounding on shared amounts (e.g., splitting ₹100 three ways) | All sums are done in integer cents before any division, and the final score is rounded to 2 decimal places only once at the end | `Math.round(amount * 100)` accumulation, `roundToTwo()` on output only |

## Not handled in this phase (explicitly out of scope)

- **Stale rows after a member leaves the circle.** `FairnessScore` rows
  aren't cleaned up when a member leaves — a future improvement would be to
  delete the row in `leaveCircle()`, or filter `GET /fairness` results to
  current members only.
- **Time-decay / recency weighting.** A chore completed a year ago counts the
  same as one completed yesterday. The Participation Score's "activity
  frequency" is a lifetime count, not a recent-activity window.
- **MISSED vs PENDING distinction in the chore score.** Both currently count
  identically as "not completed." Penalizing `MISSED` more heavily than
  `PENDING` (still has time) would be a reasonable follow-up.
- **Negative/refund expenses.** The schema's `amount` field has no documented
  negative-value handling (e.g., a refund or correction), and the fairness
  engine inherits whatever the Expense Engine allows — this phase assumes all
  expense amounts are positive, matching `requirePositiveAmount` in
  `expense.validator.js`.
