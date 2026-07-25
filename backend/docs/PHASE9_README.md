# SplitCircle — Phase 9: AI-Powered Features

## Overview

Phase 9 adds four AI/ML-powered capabilities to SplitCircle:

| Sub-Phase | Feature                  | Endpoint                                    | AI Used        |
|-----------|--------------------------|---------------------------------------------|----------------|
| 9A        | OCR Receipt Scanning     | `POST /api/ocr/receipt`                     | Tesseract.js   |
| 9B        | Voice Expense Logging    | `POST /api/voice/expense`                   | Gemini Flash   |
| 9C        | AI Insights              | `GET /api/circles/:circleId/insights`       | Gemini Flash   |
| 9D        | Conflict Prediction      | `GET /api/circles/:circleId/conflicts`      | Rule-based     |

---

## Prerequisites

Add these to your `.env` (see `.env.example`):

```env
# Phase 9A — Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Phase 9B + 9C
GEMINI_API_KEY=your_gemini_api_key
```

### Install new dependencies

```bash
npm install
```

New packages added:
- `tesseract.js` — in-process OCR
- `cloudinary` — image hosting
- `multer` — multipart form parsing
- `@google/generative-ai` — Gemini SDK

---

## Phase 9A — OCR Receipt Scanning

### `POST /api/ocr/receipt`

**Auth:** Bearer token required  
**Content-Type:** `multipart/form-data`  
**Field:** `receipt` (JPEG / PNG / WEBP / GIF, max 5 MB)

**Pipeline:**
1. Multer parses the upload into memory (no temp files)
2. Image is streamed to Cloudinary → returns `imageUrl` + `publicId`
3. Tesseract.js runs OCR on the raw buffer
4. Parsers extract merchant, amount, date from the OCR text
5. Returns a **draft** object — no Expense is created in the DB

**Response (200):**
```json
{
  "success": true,
  "message": "Receipt scanned successfully. Review the draft before creating an expense.",
  "data": {
    "draft": {
      "merchant": "Big Bazaar",
      "totalAmount": 1249.00,
      "date": "2024-01-15",
      "imageUrl": "https://res.cloudinary.com/...",
      "publicId": "splitcircle/receipts/abc123",
      "confidence": 0.67
    },
    "rawText": "BIG BAZAAR\n15/01/2024\n...",
    "warnings": []
  }
}
```

**Confidence** ranges 0–1 based on how many fields (merchant, amount, date) were successfully extracted.

**Parsers:**
- **Merchant** — First non-empty, non-address line in the first 6 lines of OCR output
- **Amount** — Looks for lines with "total"/"amount"/"payable"; falls back to the largest decimal number
- **Date** — Supports ISO, DD/MM/YYYY, MM/DD/YYYY, and textual month formats (e.g. "15 Jan 2024")

---

## Phase 9B — Voice Expense Logging

### `POST /api/voice/expense`

**Auth:** Bearer token required  
**Content-Type:** `application/json`

**Body:**
```json
{
  "transcript": "I paid 420 rupees for groceries yesterday"
}
```

**Pipeline:**
1. Validates transcript (non-empty string, max 1000 chars)
2. Sends to Gemini 1.5 Flash with a structured prompt
3. Normalises and validates the JSON response
4. Returns a **draft** — no Expense is created in the DB

**Response (200):**
```json
{
  "success": true,
  "data": {
    "draft": {
      "amount": 420,
      "currency": "INR",
      "category": "groceries",
      "description": "Groceries",
      "date": "2024-01-14",
      "confidence": 0.95
    },
    "originalTranscript": "I paid 420 rupees for groceries yesterday",
    "warnings": []
  }
}
```

**Categories** (standardised):
`groceries`, `food & dining`, `transport`, `utilities`, `rent`, `entertainment`, `healthcare`, `shopping`, `household`, `subscriptions`, `travel`, `education`, `personal care`, `other`

**Prompt engineering features:**
- Uses today's date so Gemini can resolve relative terms ("yesterday", "last Monday")
- Requests `responseMimeType: 'application/json'` for structured output
- Low temperature (0.2) for deterministic results
- Instructs the model not to invent information not in the transcript

---

## Phase 9C — AI Insights

### `GET /api/circles/:circleId/insights`

**Auth:** Bearer token (must be circle member)  
**Query:** `?refresh=true` — bypass 5-minute cache

**Pipeline:**
1. Checks membership
2. Fetches last 50 expenses, chore assignments, fairness scores, recent settlements
3. Builds a data-rich prompt and calls Gemini 1.5 Flash
4. Returns 3–10 natural-language insights
5. Caches result for 5 minutes per circle

**Response (200):**
```json
{
  "success": true,
  "data": {
    "circleId": "uuid",
    "insights": [
      "Priya has paid for 65% of all shared expenses this month — consider settling up soon.",
      "Chore completion is at 80%, which is healthy. Rahul has the best streak this week.",
      "There are 3 pending settlements totalling ₹2,400. Clearing them would improve fairness scores."
    ],
    "count": 3,
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "cached": false
  }
}
```

**Caching:** In-memory, TTL 5 minutes per `circleId`. For production, replace with Redis using the same `getCached / setCache / invalidateInsightsCache` interface.

---

## Phase 9D — Conflict Prediction Engine

### `GET /api/circles/:circleId/conflicts`

**Auth:** Bearer token (must be circle member)  
**No ML — pure rule-based, fully explainable.**

### Rules

| Rule | Trigger | Threshold |
|------|---------|-----------|
| R1 — Fairness Score Low | Any member's `overallScore` < 60 | 60/100 |
| R2 — Chore Completion Low | Circle-wide completion rate < 50% | 50% |
| R3 — Contribution Imbalance | Any member paid < 50% of the group average | 0.5× average |

### Risk Aggregation

| Triggered Rules | Risk Level |
|----------------|-----------|
| 0              | `LOW`      |
| 1              | `MEDIUM`   |
| 2+             | `HIGH`     |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "riskLevel": "HIGH",
    "reasons": [
      "Rahul's fairness score is 45.0/100, which is below the healthy threshold of 60.",
      "Only 35.0% of chores have been completed (7/20). This is below the expected 50% completion rate.",
      "Neha has contributed ₹200.00, which is only 15.4% of the group average (₹1300.00). This significant imbalance may cause tension."
    ],
    "ruleBreakdown": {
      "fairnessScoreLow": {
        "triggered": true,
        "reasons": ["Rahul's fairness score is 45.0/100..."]
      },
      "choreCompletionLow": {
        "triggered": true,
        "reasons": ["Only 35.0% of chores have been completed..."]
      },
      "contributionImbalance": {
        "triggered": true,
        "reasons": ["Neha has contributed ₹200.00..."]
      }
    },
    "memberCount": 4,
    "evaluatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Why rule-based and not ML?**
- Fully explainable: every reason maps to a specific threshold
- No training data required
- Deterministic: same data → same result
- Thresholds are tunable in one place (`THRESHOLDS` constant in `conflict.service.js`)
- Interview-ready: can walk through each rule clearly

---

## Error Handling

All Phase 9 endpoints use the shared `AppError` → `errorHandler` pipeline:

| Scenario | Status |
|----------|--------|
| No auth token | 401 |
| Not a circle member | 403 |
| Circle not found | 404 |
| Invalid file type | 400 |
| File too large (>5MB) | 400 |
| No file attached | 400 |
| Empty transcript | 400 |
| Transcript too long | 400 |
| Cloudinary upload failure | 502 |
| Gemini API failure | 502 |
| No text extracted from image | 422 |
| AI returns malformed JSON | 422/502 |

---

## Running Postman Tests

1. Import `postman/SplitCircle_Phase9_AI.postman_collection.json`
2. Set collection variables: `baseUrl`, `authToken`, `circleId`
3. Run "Auth — Login" first to auto-populate `authToken`
4. For 9A tests, set `receipt` field to a local receipt image path
5. Run individual folders or the entire collection

---

## File Structure

```
backend/src/
├── config/
│   ├── cloudinary.js       # Cloudinary SDK setup (9A)
│   ├── gemini.js           # Google Generative AI client (9B, 9C)
│   ├── multer.js           # File upload config (9A)
│   └── env.js              # Updated with new env vars
├── controllers/
│   ├── ocr.controller.js   # 9A
│   ├── voice.controller.js # 9B
│   ├── insights.controller.js # 9C
│   └── conflict.controller.js # 9D
├── services/
│   ├── ocr.service.js      # Cloudinary + Tesseract + parsers (9A)
│   ├── voice.service.js    # Gemini prompt + extraction (9B)
│   ├── insights.service.js # Data gathering + Gemini + cache (9C)
│   └── conflict.service.js # Rule engine (9D)
├── routes/
│   ├── ocr.routes.js       # 9A
│   ├── voice.routes.js     # 9B
│   └── circle.phase9.routes.js # 9C + 9D
└── validators/
    └── voice.validator.js  # 9B
```
