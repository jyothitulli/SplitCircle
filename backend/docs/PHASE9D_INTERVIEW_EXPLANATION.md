# Phase 9D — Conflict Prediction: Interview Explanation

## The Problem

In a shared-living app, financial and chore imbalances often go unnoticed until they cause actual conflict. The Conflict Prediction Engine proactively surfaces these risk signals before tension escalates.

## Why Rule-Based, Not Machine Learning?

**Short answer for interviews:**

> "We chose rule-based detection because it gives us explainable, auditable, and deterministic predictions with zero training data. Each risk signal maps directly to a business rule that any user can understand."

**Longer reasoning:**

1. **No training data exists** — SplitCircle is early-stage. ML models need thousands of labelled examples of "conflicts that happened." We don't have that.

2. **Explainability is a feature** — Users should understand *why* they're being flagged. "Rahul's fairness score is 45/100, below our threshold of 60" is more trustworthy than "our model says high risk."

3. **Tunable by product team** — Thresholds live in one `THRESHOLDS` constant. Changing risk sensitivity requires editing one number, not retraining a model.

4. **Deterministic** — Same data always produces the same result. This makes testing, debugging, and user trust much easier.

## The Three Rules

### R1 — Fairness Score Low (threshold: < 60/100)
*Source: `FairnessScore.overallScore` from Phase 8*

The fairness score is already computed by our Phase 8 engine. A score below 60 means a member's combined expense and chore participation is significantly below what's expected. We flag each individual who falls below this threshold.

**Why 60?** A score of 100 is perfect equity. 70–100 is healthy normal variation. Below 60 is where we've seen (empirically in user research) that people start feeling taken advantage of.

### R2 — Chore Completion Rate Low (threshold: < 50%)
*Source: `ChoreAssignment.status` counts*

If fewer than half the assigned chores are getting done circle-wide, that's a systemic problem, not an individual one. We calculate `completed / total` across all chore assignments.

**Why 50%?** Half is a natural midpoint; falling below it means more tasks are failing than succeeding.

### R3 — Contribution Imbalance (threshold: < 50% of average)
*Source: `Expense.amount` grouped by `paidById`*

We calculate what each member has paid and compare it to the group average. A member paying less than half the average is a strong signal of imbalance.

**Guard:** We only apply R3 if there are at least 3 expenses, to avoid false positives in new circles.

## Risk Aggregation Logic

```
0 rules triggered → LOW    (normal, healthy circle)
1 rule triggered  → MEDIUM (one issue worth watching)
2+ rules triggered → HIGH  (multiple overlapping problems = conflict likely)
```

This is intentionally additive: the more dimensions of imbalance present simultaneously, the higher the likelihood of interpersonal friction.

## The `ruleBreakdown` Field

Every response includes the full `ruleBreakdown` object with `triggered: boolean` and `reasons: string[]` per rule. This allows:
- Frontend to show specific rule explanations to users
- Developers to debug threshold logic
- Product team to tune which rules matter most

## How to Extend

Adding a new rule is three steps:
1. Add a threshold constant to `THRESHOLDS`
2. Write a `checkXxx(data)` function that returns `{ triggered, reasons }`
3. Include it in `predictCircleConflicts()` and pass `r.triggered` to `aggregateRisk()`

No model retraining. No data pipelines. Just logic.

## What We'd Do With ML (in future)

Once we have 1000+ circles with labelled outcome data (e.g. "user left the circle" or "conflict reported"), we could train a logistic regression or gradient boosted tree. The current rule-based system would serve as a strong baseline and as a feature engineering guide.
