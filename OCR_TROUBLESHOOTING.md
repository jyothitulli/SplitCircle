# Receipt OCR — API Contract & Troubleshooting

## API contract

```
METHOD:         POST
PATH:           /api/ocr/receipt
AUTHENTICATION: required (Authorization: Bearer <JWT>)
BODY:           multipart/form-data
FIELD:          receipt   (single image file — jpeg/jpg/png/webp/gif, max 5MB)
RESPONSE:       200 { success: true, data: { draft: {...}, rawText, warnings } }
```

```
METHOD:         POST
PATH:           /api/ocr/create-expense
AUTHENTICATION: required (Authorization: Bearer <JWT>)
BODY:           application/json  { circleId, description, amount, ..., draft }
RESPONSE:       201 { success: true, data: { expense } }
```

A `GET /api/ocr/receipt` request will correctly return a `404` with
`"Route GET /api/ocr/receipt not found"` — only `POST` is registered on
purpose (uploading a file is not idempotent/cacheable, so `POST` is the
correct verb). Seeing this message from visiting the URL directly in a
browser, or from `curl` without `-X POST`, is expected, not a bug. The
frontend's actual call (`frontend/src/services/api.js` → `ocrAPI.scanReceipt`)
already sends `POST`.

## Root causes of the reported 401 / 502 errors

### 502 — the real bug

`backend/src/services/ocr.service.js` created its Tesseract worker with:

```js
await createWorker('eng', 1, { ... }); // no langPath
```

Without an explicit `langPath`, tesseract.js fetches `eng.traineddata` from a
remote CDN (`cdn.jsdelivr.net`) on **every worker start**. In a
network-restricted environment (proven by reproducing it locally) that fetch
fails, and — critically — **the failure is thrown as an uncaught exception
inside tesseract.js's worker thread**, which crashes the entire Node
process:

```
Error: Network error while fetching https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/...
Response code: 403
    at Worker.<anonymous> (tesseract.js/src/createWorker.js:247:15)
```

A crashed process is exactly what a platform like Render reports upstream as
a `502 Bad Gateway` — and it takes down *every other in-flight request*
(auth included), not just the OCR call, which is consistent with the mixed
401/502 errors reported together.

The project already ships `backend/eng.traineddata` (5MB) — unused by the
original code. **Fix:** point `createWorker` at it directly via `langPath`,
disable `gzip` (the bundled file isn't gzipped), and write the on-disk cache
to `os.tmpdir()` (always writable, unlike a project directory that may be
read-only on some platforms). This removes the network dependency from the
OCR path entirely — no CDN round-trip, no crash.

As defense-in-depth, `backend/src/server.js` now also installs
`process.on('uncaughtException', ...)` / `unhandledRejection` handlers so
that *any* future async error in a dependency logs instead of taking the
whole server down.

### A second, compounding bug — multipart boundary

`frontend/src/services/api.js` called:

```js
api.post('/api/ocr/receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
```

When you hand axios/the browser a `FormData` object, it normally generates
the `Content-Type` header itself, including a unique `boundary=...`
parameter the server needs to split the multipart body into parts.
Explicitly setting `Content-Type: multipart/form-data` **without** a
boundary overrides that and produces a malformed request body that
multer/busboy cannot reliably parse. **Fix:** removed the manual header;
axios now lets the browser set it (with the boundary) automatically.

### 401

The auth middleware and JWT flow themselves were correct (verified with
unit + integration smoke tests below). The most likely real-world causes of
a 401 specifically on OCR are environmental, not code bugs:
- `JWT_SECRET` differing between the token's origin (e.g. a local `.env`)
  and the Render deployment that verifies it — tokens are only valid against
  the exact secret that signed them.
- A genuinely expired token (default expiry: `JWT_EXPIRES_IN=7d`).
- Collateral damage from the 502 process crash above (a dyno restart mid-
  request can surface as a variety of client-side error states).

No code change was needed here beyond fixing the 502 root cause; the
contract itself (`Authorization: Bearer <token>`, checked in
`backend/src/middleware/auth.middleware.js`) is correct and unchanged.

## What changed (files)

- `backend/src/services/ocr.service.js` — local `langPath`, writable cache
  dir, OCR timeout guard, image preprocessing (`sharp`: auto-rotate,
  grayscale, upscale, normalize, sharpen), extended field extraction
  (`subtotal`, `tax`, `currency`, `items[]`), smarter total-amount detection
  that ignores "Sub Total"/"Total Items"/"Taxable Amount" traps.
- `backend/src/services/ocr.service.test.js` — new unit tests for the
  extraction functions using real OCR output from the bundled sample
  receipts.
- `backend/src/controllers/ocr.controller.js` — response now includes the
  new fields.
- `backend/src/config/env.js` — `CORS_ORIGIN` now accepts a comma-separated
  list (useful for prod + Vercel preview URLs).
- `backend/src/server.js` — request timeouts tuned for OCR's longer
  processing time; process-level crash guards.
- `backend/package.json` — added `sharp`.
- `frontend/src/services/api.js` — removed the header that broke the
  multipart boundary; added a 60s request timeout.
- `frontend/src/pages/OCRUpload.jsx` — surfaces subtotal, tax, currency, and
  detected line items in the review UI.

## Testing performed

- **Unit tests** (`cd backend && npm test`): 16/16 passing, including 9 for
  the OCR service (new field-extraction tests use real Tesseract output
  captured from three different Indian receipt layouts — D-Mart, Reliance
  Smart, and an HP Gas utility bill — to guard against regressions).
- **Reproduction of the original bug**: confirmed the default (no
  `langPath`) worker crashes the process with the exact CDN fetch error seen
  in production-style network-restricted conditions.
- **End-to-end OCR pipeline**: ran the real preprocessing + Tesseract +
  parsing pipeline against `dmart-bill.png`, `bill.png`, and `gasbill.jpeg`
  (bundled in this project). All three produced the correct final total
  (₹1,365.00 / ₹1,260.00 / ₹968.50) despite each using different final-total
  phrasing ("Grand Total", "Net Amount", "Net Payable").
- **HTTP contract / integration smoke test**: started the real Express app
  and exercised it with `curl`:
  - No `Authorization` header → `401` ✓
  - `GET /api/ocr/receipt` → `404` with the documented contract message ✓
  (expected/by design, see above)
  - Authenticated request with no file → `400 "No receipt image provided"` ✓
  - Authenticated request with a non-image file → `400` from image
    validation, not a crash ✓
  - Authenticated request with a real receipt, no Cloudinary configured →
    clean `503` with a setup instruction, not a crash ✓
  - Server remained responsive to unrelated routes after every one of the
    above ✓ (this specifically verifies the old crash-on-network-failure bug
    is gone)
- **Frontend build**: `npm run build` in `frontend/` completes with no
  errors.
- **Lint**: `eslint` clean on all changed files.

## Known limitation in *this* sandbox (not a project bug)

`prisma generate` could not be verified in the environment used to prepare
this fix, because it needs to download a query-engine binary from
`binaries.prisma.sh`, which this sandbox's network policy blocks (`403`).
This is specific to the tool used to prepare this fix, not to Render or your
own machine — both have normal outbound internet access and
`npm install`/`npm run build` will run `prisma generate` successfully there
exactly as `backend/package.json`'s `postinstall` script already does. All
other backend logic (routing, auth, multer, OCR, error handling) was
verified end-to-end as described above using a database-independent test
harness.

## Deployment checklist

### Render (backend)
- Build command: `npm install` (root) — runs `prisma generate` via
  `postinstall` in the `backend` workspace.
- Start command: `npm run start --workspace=backend` (or `node
  backend/src/server.js`).
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (your
  Vercel URL(s), comma-separated if more than one), `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. `GEMINI_API_KEY` is only
  needed for the voice/insights features, not OCR.
- Make sure `backend/eng.traineddata` is included in the deployed build —
  it's a plain file in the repo, not `.gitignore`d, so a normal deploy picks
  it up automatically.

### Vercel (frontend)
- Root directory: `frontend`.
- Build command: `npm run build`; output directory: `dist`.
- Required env var: `VITE_API_URL` = your Render backend URL (e.g.
  `https://splitcircle-1.onrender.com`) — **not** `http://localhost:4000`.
