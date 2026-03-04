# Coorda API — Frontend Integration Reference

**Base URL (local):** `http://localhost:5000/api/v1`  
**Base URL (production):** `https://coorda-api.onrender.com/api/v1`

---

## Authentication

All protected routes require a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

Get the token from Firebase Auth:
```js
const token = await firebase.auth().currentUser.getIdToken();
```

Routes marked **🔓 Public** do not require a token.  
Routes marked **🔒 Auth** require a valid Firebase token.

---

## Response Format

All responses are JSON. Errors follow this shape:

```json
{ "error": "Human-readable message", "details": [...] }
```

HTTP status codes used:
- `200` OK
- `201` Created
- `400` Bad Request / Validation error
- `401` Unauthenticated
- `402` Insufficient credits
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `500` Server Error

---

## 1. Users

### `POST /users` 🔒
Create or retrieve a user profile after Firebase sign-up.  
Call this immediately after the user signs up or logs in for the first time.

**Request body:**
```json
{
  "email": "user@example.com",
  "role": "developer",
  "displayName": "Alice",
  "flowAddress": "0xabc123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Valid email |
| `role` | string | ✅ | `"host"` or `"developer"` |
| `displayName` | string | ❌ | Display name |
| `flowAddress` | string | ❌ | User's Flow wallet address |

**Response `201`:**
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "role": "developer",
  "displayName": "Alice",
  "flowAddress": "0xabc123",
  "credits": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `GET /users/:id` 🔒
Get a user's profile. Returns full data (including credits) only when fetching your own profile.

**Response `200`:**
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "role": "developer",
  "displayName": "Alice",
  "credits": 25,
  "flowAddress": "0xabc123"
}
```

---

### `PUT /users/:id` 🔒
Update your own profile. Can only update your own account.

**Request body (all optional):**
```json
{
  "displayName": "Alice Updated",
  "flowAddress": "0xnewaddress",
  "role": "host"
}
```

---

### `GET /users/:id/balance` 🔒
Get your credit balance. Only accessible for your own account.

**Response `200`:**
```json
{
  "userId": "firebase-uid",
  "credits": 25
}
```

---

## 2. Buildathons

### `POST /buildathons` 🔒
Create a new buildathon (host only).

**Request body:**
```json
{
  "title": "Flow Summer Hackathon",
  "description": "Build the future of DeFi on Flow",
  "prizePool": 5000,
  "currency": "FLOW",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-21T00:00:00Z",
  "requirements": ["Must use Flow blockchain", "Open source repo"],
  "maxWaves": 3
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `description` | string | ✅ | |
| `prizePool` | number | ✅ | Total prize amount |
| `currency` | string | ❌ | Default: `"FLOW"` |
| `startDate` | ISO8601 | ✅ | |
| `endDate` | ISO8601 | ✅ | |
| `requirements` | string[] | ❌ | List of requirement strings |
| `maxWaves` | integer | ❌ | |

**Response `201`:**
```json
{
  "id": "buildathon-id",
  "title": "Flow Summer Hackathon",
  "hostId": "firebase-uid",
  "status": "draft",
  "prizePool": 5000,
  "currency": "FLOW",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-21T00:00:00Z",
  "requirements": ["Must use Flow blockchain", "Open source repo"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `GET /buildathons` 🔓
List all buildathons with optional filters.

**Query params:**
| Param | Type | Notes |
|---|---|---|
| `status` | string | `draft`, `active`, `completed`, `cancelled` |
| `hostId` | string | Filter by host |
| `limit` | integer | Default 20, max 100 |
| `offset` | integer | For pagination |

**Response `200`:**
```json
{
  "data": [ { ...buildathon }, ... ],
  "count": 10
}
```

---

### `GET /buildathons/:id` 🔓
Get a single buildathon by ID.

**Response `200`:** Same shape as the create response.

---

### `PUT /buildathons/:id` 🔒
Update a buildathon. Only the host can update.

**Request body (all optional):**
```json
{
  "title": "New Title",
  "description": "Updated description",
  "status": "active",
  "prizePool": 6000,
  "requirements": ["Updated requirement"]
}
```

`status` transitions: `draft` → `active` → `completed` | `cancelled`

---

### `GET /buildathons/:id/waves` 🔓
List all waves for a buildathon.

**Response `200`:**
```json
{
  "data": [ { ...wave }, ... ],
  "count": 2
}
```

---

## 3. Waves

### `POST /waves` 🔒
Create a wave within a buildathon. Only the buildathon host can create waves.

**Request body:**
```json
{
  "buildathonId": "buildathon-id",
  "name": "Wave 1 — DeFi Tools",
  "description": "Build DeFi tooling on Flow",
  "maxBuilders": 10,
  "requirements": ["Must integrate FlowToken", "Deployed on testnet"],
  "prizeAmount": 1000,
  "deadline": "2025-06-15T00:00:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `buildathonId` | string | ✅ | Parent buildathon ID |
| `name` | string | ✅ | |
| `description` | string | ❌ | |
| `maxBuilders` | integer | ✅ | Slot cap |
| `requirements` | string[] | ❌ | Used by AI verification |
| `prizeAmount` | number | ❌ | Per-wave prize |
| `deadline` | ISO8601 | ❌ | |

**Response `201`:**
```json
{
  "id": "wave-id",
  "buildathonId": "buildathon-id",
  "hostId": "firebase-uid",
  "name": "Wave 1 — DeFi Tools",
  "maxBuilders": 10,
  "builders": [],
  "status": "open",
  "prizeAmount": 1000,
  "requirements": ["Must integrate FlowToken"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `GET /waves/:id` 🔓
Get a wave by ID.

---

### `POST /waves/:id/join` 🔒
Join a wave as a developer. User must be authenticated. Checks capacity automatically.

**No request body required.**

**Response `200`:** Updated wave object with builder added.

**Error cases:**
- `400` — Wave is not open / at capacity
- `409` — Already joined

---

### `GET /waves/:id/builders` 🔒
Get list of builders who joined a wave.

**Response `200`:**
```json
{
  "waveId": "wave-id",
  "count": 3,
  "builders": [
    {
      "uid": "firebase-uid",
      "displayName": "Alice",
      "email": "alice@example.com",
      "flowAddress": "0xabc"
    }
  ]
}
```

---

### `GET /waves/:id/submissions` 🔒
Get all submissions for a wave.

**Response `200`:**
```json
{
  "data": [ { ...submission }, ... ],
  "count": 5
}
```

---

### `PUT /waves/:id` 🔒
Update a wave. Only the host can update.

**Request body (all optional):**
```json
{
  "name": "Updated wave name",
  "description": "...",
  "status": "closed",
  "maxBuilders": 15,
  "requirements": ["..."],
  "deadline": "2025-06-20T00:00:00Z"
}
```

`status` values: `open`, `closed`, `completed`

---

## 4. Submissions

### `POST /submissions` 🔒
Submit work to a wave. Accepts multipart/form-data for optional file upload. File is stored on Filecoin via Lighthouse.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `waveId` | string | ✅ | |
| `repoUrl` | string (URL) | ❌ | GitHub repo URL |
| `description` | string | ❌ | Project description |
| `projectName` | string | ❌ | Project name |
| `file` | File | ❌ | Any file, max 50MB |

**Example (fetch):**
```js
const form = new FormData();
form.append('waveId', 'wave-id');
form.append('repoUrl', 'https://github.com/user/repo');
form.append('description', 'My project does X');
form.append('file', fileInput.files[0]);

await fetch('/api/v1/submissions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

**Response `201`:**
```json
{
  "id": "submission-id",
  "waveId": "wave-id",
  "buildathonId": "buildathon-id",
  "devId": "firebase-uid",
  "repoUrl": "https://github.com/user/repo",
  "description": "My project does X",
  "ipfsHash": "bafybeig...",
  "ipfsUrl": "https://gateway.lighthouse.storage/ipfs/bafybeig...",
  "metadataCid": "bafybeig...",
  "status": "pending",
  "verificationStatus": "unverified",
  "verificationScore": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Notes:**
- Developer must have joined the wave before submitting (`POST /waves/:id/join`)

---

### `GET /submissions/:id` 🔒
Get a submission by ID.

**Response `200`:** Same shape as the create response, with verification fields populated after verification.

---

### `POST /submissions/:id/verify` 🔒
Trigger AI verification on a submission. Deducts credits from the caller.

**Request body:**
```json
{
  "model": "gemini"
}
```

| `model` value | Credits deducted | Notes |
|---|---|---|
| `gemini` | 0.5 | Gemini 1.5 Flash — fast basic analysis |
| `claude` | 1.0 | Claude 3 Haiku — detailed analysis |
| `openai` | 1.5 | GPT-4o Mini — comprehensive + suggestions |

**Response `200`:** Updated submission with verification result:
```json
{
  "id": "submission-id",
  "verificationStatus": "verified",
  "verificationScore": 87,
  "verificationModel": "gemini",
  "verificationCreditCost": 0.5,
  "verifiedAt": "2025-06-10T12:00:00Z",
  "verificationResult": {
    "score": 87,
    "requirementChecks": [
      { "requirement": "Must use Flow blockchain", "status": "YES", "reason": "Uses @onflow/fcl" },
      { "requirement": "Open source repo", "status": "YES", "reason": "Repo is public" }
    ],
    "redFlags": [],
    "summary": "Strong submission with good code quality and clear Flow integration.",
    "recommendation": "APPROVE"
  },
  "repoAnalysis": {
    "repoAgeInDays": 14,
    "info": { "language": "TypeScript", "stargazersCount": 2 },
    "commits": { "totalCommits": 28 },
    "flags": []
  }
}
```

**Error `402`** — Insufficient credits. Purchase more at `POST /credits/purchase`.

---

## 5. Escrow

The escrow routes record and validate Flow blockchain transactions. The actual fund movement happens on-chain via Cadence transactions — these API routes track state and verify the transaction was sealed.

### `POST /escrow/create` 🔒
Create an escrow record linked to a buildathon.

**Request body:**
```json
{
  "buildathonId": "buildathon-id",
  "amount": 5000,
  "currency": "FLOW",
  "flowTxId": "optional-tx-id-if-already-sent"
}
```

**Response `201`:**
```json
{
  "id": "escrow-id",
  "buildathonId": "buildathon-id",
  "hostId": "firebase-uid",
  "amount": 5000,
  "currency": "FLOW",
  "status": "pending",
  "flowTxId": null,
  "createdAt": "..."
}
```

---

### `POST /escrow/lock` 🔒
Lock escrow funds. Provide the Flow transaction ID of the on-chain `createEscrow` transaction. The API will wait for the tx to seal before updating status.

**Request body:**
```json
{
  "escrowId": "escrow-id",
  "flowTxId": "flow-transaction-id"
}
```

**Response `200`:** Updated escrow with `status: "locked"`.

---

### `POST /escrow/release` 🔒
Release locked funds to a recipient. Host only.

**Request body:**
```json
{
  "escrowId": "escrow-id",
  "recipientId": "developer-firebase-uid",
  "flowTxId": "flow-release-tx-id"
}
```

**Response `200`:** Updated escrow with `status: "released"`.

---

### `POST /escrow/dispute` 🔒
Raise a dispute on a locked escrow. Available to both host and recipient.

**Request body:**
```json
{
  "escrowId": "escrow-id",
  "reason": "Submission does not meet requirements X and Y"
}
```

**Response `200`:** Updated escrow with `status: "disputed"`.

---

### `GET /escrow/status/:id` 🔒
Get current escrow status.

**Response `200`:**
```json
{
  "id": "escrow-id",
  "buildathonId": "buildathon-id",
  "hostId": "firebase-uid",
  "amount": 5000,
  "currency": "FLOW",
  "status": "locked",
  "flowTxId": "abc123",
  "lockedAt": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

`status` values: `pending` → `locked` → `released` | `disputed` → `resolved` | `cancelled`

---

## 6. AI Verification

Standalone AI endpoints for on-demand analysis (not tied to a specific submission).

### `POST /ai/verify-repo` 🔒
Analyze a GitHub repo against a list of requirements.

**Request body:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "requirements": ["Must use Flow blockchain", "Open source repo"],
  "model": "gemini",
  "hackathonStartDate": "2025-06-01T00:00:00Z"
}
```

| Field | Required | Notes |
|---|---|---|
| `repoUrl` | ✅ | Full GitHub URL |
| `requirements` | ✅ | Array of requirement strings |
| `model` | ❌ | `gemini` (default), `claude`, `openai` |
| `hackathonStartDate` | ❌ | If set, only counts commits after this date |

**Response `200`:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "model": "gemini-1.5-flash",
  "creditCost": 0.5,
  "repoAnalysis": {
    "repoAgeInDays": 14,
    "info": { "language": "TypeScript", "isFork": false, "stargazersCount": 2 },
    "commits": { "totalCommits": 28, "latestCommit": { "date": "2025-06-10" } },
    "languages": { "TypeScript": { "bytes": 12000, "percentage": "82.4" } },
    "flags": []
  },
  "verification": {
    "score": 87,
    "requirementChecks": [...],
    "redFlags": [],
    "summary": "...",
    "recommendation": "APPROVE"
  }
}
```

---

### `POST /ai/check-requirements` 🔒
Check a plain text description against requirements (no GitHub analysis).

**Request body:**
```json
{
  "description": "My project is a decentralized escrow built on Flow using Cadence...",
  "requirements": ["Must use Flow blockchain", "Must have smart contract"],
  "model": "gemini"
}
```

**Response `200`:**
```json
{
  "model": "gemini-1.5-flash",
  "creditCost": 0.5,
  "verification": {
    "score": 90,
    "requirementChecks": [...],
    "redFlags": [],
    "summary": "...",
    "recommendation": "APPROVE"
  }
}
```

---

### `POST /ai/analyze-submission` 🔒
Full analysis of arbitrary submission data.

**Request body:**
```json
{
  "submissionData": {
    "repoUrl": "https://github.com/user/repo",
    "description": "My project...",
    "projectName": "EscrowFlow"
  },
  "requirements": ["Requirement 1", "Requirement 2"],
  "model": "openai"
}
```

**Response `200`:**
```json
{
  "model": "gpt-4o-mini",
  "creditCost": 1.5,
  "verification": { ... },
  "submissionData": { ..., "repoAnalysis": { ... } }
}
```

---

## 7. Credits

### `GET /credits/packages` 🔓
List available credit packages.

**Response `200`:**
```json
{
  "packages": [
    { "id": "starter",    "credits": 10,  "priceUsd": 5,   "label": "Starter" },
    { "id": "basic",      "credits": 50,  "priceUsd": 20,  "label": "Basic" },
    { "id": "pro",        "credits": 100, "priceUsd": 35,  "label": "Pro" },
    { "id": "enterprise", "credits": 500, "priceUsd": 150, "label": "Enterprise" }
  ]
}
```

---

### `GET /credits/balance` 🔒
Get current user's credit balance.

**Response `200`:**
```json
{ "userId": "firebase-uid", "credits": 47.5 }
```

---

### `POST /credits/purchase` 🔒
Purchase a credit package.

> ⚠️ **Note:** The backend grants credits immediately on a valid `paymentReference`. In production, integrate a payment processor (Stripe, etc.) and verify the payment server-side before granting credits.

**Request body:**
```json
{
  "packageId": "pro",
  "paymentReference": "stripe-payment-intent-id"
}
```

| `packageId` | Credits | Price |
|---|---|---|
| `starter` | 10 | $5 |
| `basic` | 50 | $20 |
| `pro` | 100 | $35 |
| `enterprise` | 500 | $150 |

**Response `200`:**
```json
{
  "success": true,
  "packagePurchased": { "id": "pro", "credits": 100, "priceUsd": 35, "label": "Pro" },
  "newBalance": 147.5,
  "paymentReference": "stripe-payment-intent-id"
}
```

---

### `POST /credits/use` 🔒
Manually deduct credits for a custom action.

**Request body:**
```json
{
  "amount": 1.5,
  "description": "Manual AI analysis"
}
```

**Response `200`:**
```json
{ "success": true, "deducted": 1.5, "newBalance": 46.0 }
```

---

### `GET /credits/history` 🔒
Get credit transaction history.

**Query params:**
| Param | Notes |
|---|---|
| `limit` | Default 20, max 100 |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "tx-id",
      "userId": "firebase-uid",
      "amount": -0.5,
      "type": "deduction",
      "description": "AI verification (gemini) for submission abc123",
      "createdAt": "..."
    },
    {
      "id": "tx-id-2",
      "amount": 100,
      "type": "purchase",
      "description": "Purchased 100 credits (Pro package) — ref: stripe-xxx",
      "createdAt": "..."
    }
  ],
  "count": 2
}
```

`type` values: `purchase`, `deduction`, `manual_deduction`

---

## 8. Health Check

### `GET /health` 🔓
Server liveness probe (used by Render).

**Response `200`:**
```json
{ "status": "ok", "timestamp": "2025-06-10T12:00:00.000Z" }
```

---

## Typical Frontend Flows

### Host creates a buildathon and locks funds

```
1. POST /buildathons           → get buildathonId
2. POST /waves                 → create wave(s) with maxBuilders + requirements
3. [Frontend] execute Cadence transaction createEscrow.cdc on-chain
4. POST /escrow/create         → register escrow record
5. POST /escrow/lock           → confirm with flowTxId after on-chain confirmation
6. PUT  /buildathons/:id       → set status to "active"
```

### Developer joins and submits

```
1. GET  /buildathons           → browse active buildathons
2. GET  /buildathons/:id/waves → see available waves
3. GET  /waves/:id/builders    → check remaining slots
4. POST /waves/:id/join        → join wave
5. POST /submissions           → upload file + repo URL (multipart)
6. POST /ai/verify-repo        → optional pre-check before submitting
```

### Host verifies and pays out

```
1. GET  /waves/:id/submissions → review submissions
2. POST /submissions/:id/verify → AI verify each submission
3. [Frontend] execute releaseFunds.cdc Cadence transaction on-chain
4. POST /escrow/release        → confirm release with flowTxId
```

---

## Error Handling Reference

```js
const res = await fetch('/api/v1/buildathons', {
  headers: { Authorization: `Bearer ${token}` },
});

if (!res.ok) {
  const err = await res.json();
  // err.error  — human-readable message
  // err.details — array of { field, message } for validation errors
  console.error(err.error);
}
```

---

## CORS

The API allows requests from `CORS_ORIGIN` (set on Render). During development this is `http://localhost:3000`. Update `CORS_ORIGIN` on Render to your production frontend URL when deploying.
