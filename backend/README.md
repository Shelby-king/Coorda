# Coorda Backend API

Node.js/Express backend for the Coorda Buildathon Platform.

## Stack

- **Runtime**: Node.js ≥18
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Admin SDK (ID token verification)
- **Storage**: Web3.Storage (Filecoin/IPFS)
- **Blockchain**: Flow Network (Cadence smart contracts)
- **AI**: Gemini, Claude (Anthropic), OpenAI
- **GitHub**: REST API v3

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express app setup
│   ├── server.js               # Entry point
│   ├── config/
│   │   ├── firebase.js         # Firebase Admin init
│   │   └── flow.js             # Flow network config
│   ├── middleware/
│   │   ├── auth.js             # Firebase token verification
│   │   ├── validate.js         # express-validator helper
│   │   └── errorHandler.js     # Global error handler
│   ├── routes/
│   │   ├── users.js
│   │   ├── buildathons.js
│   │   ├── waves.js
│   │   ├── submissions.js
│   │   ├── escrow.js
│   │   ├── ai.js
│   │   └── credits.js
│   ├── services/
│   │   ├── firebaseService.js  # Firestore CRUD helpers
│   │   ├── ipfsService.js      # Web3.Storage upload/retrieve
│   │   ├── githubService.js    # GitHub API repo analysis
│   │   ├── aiService.js        # Gemini / Claude / OpenAI
│   │   └── flowService.js      # Flow REST API queries
│   └── tests/
│       ├── health.test.js
│       └── credits.test.js
├── cadence/
│   ├── contracts/
│   │   ├── EscrowVault.cdc     # Escrow vault contract
│   │   └── WaveManager.cdc     # Wave management contract
│   ├── transactions/
│   │   ├── createEscrow.cdc
│   │   ├── releaseFunds.cdc
│   │   ├── raiseDispute.cdc
│   │   ├── createWave.cdc
│   │   └── joinWave.cdc
│   └── scripts/
│       ├── getEscrowStatus.cdc
│       ├── getWaveInfo.cdc
│       └── getWaveBuilders.cdc
├── flow.json                   # Flow CLI deployment config
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Required environment variables

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `WEB3_STORAGE_TOKEN` | Web3.Storage API token (Filecoin/IPFS) |
| `GITHUB_TOKEN` | GitHub personal access token |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FLOW_ACCOUNT_ADDRESS` | Flow account address |
| `FLOW_ACCOUNT_PRIVATE_KEY` | Flow account private key |

### 4. Run development server

```bash
npm run dev
```

### 5. Run tests

```bash
npm test
```

---

## API Reference

### Base URL: `/api/v1`

### Authentication
All protected routes require a Firebase ID token:
```
Authorization: Bearer <firebase-id-token>
```

---

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | ✅ | Create user profile |
| GET | `/users/:id` | ✅ | Get user by ID |
| PUT | `/users/:id` | ✅ | Update user profile |
| GET | `/users/:id/balance` | ✅ | Get credit balance |

### Buildathons
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/buildathons` | ✅ | Create buildathon |
| GET | `/buildathons` | ❌ | List buildathons |
| GET | `/buildathons/:id` | ❌ | Get buildathon |
| PUT | `/buildathons/:id` | ✅ | Update buildathon (host only) |
| GET | `/buildathons/:id/waves` | ❌ | Get waves for buildathon |

### Waves
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/waves` | ✅ | Create wave (host only) |
| GET | `/waves/:id` | ❌ | Get wave |
| POST | `/waves/:id/join` | ✅ | Join wave |
| GET | `/waves/:id/builders` | ✅ | List builders |
| GET | `/waves/:id/submissions` | ✅ | List submissions |
| PUT | `/waves/:id` | ✅ | Update wave (host only) |

### Submissions
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | ✅ | Upload submission (multipart/form-data) |
| GET | `/submissions/:id` | ✅ | Get submission |
| POST | `/submissions/:id/verify` | ✅ | Trigger AI verification (costs credits) |

### Escrow
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/escrow/create` | ✅ | Create escrow record |
| POST | `/escrow/lock` | ✅ | Lock funds (requires Flow tx ID) |
| POST | `/escrow/release` | ✅ | Release funds to recipient |
| POST | `/escrow/dispute` | ✅ | Raise dispute |
| GET | `/escrow/status/:id` | ✅ | Get escrow status |

### AI Verification
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/verify-repo` | ✅ | Verify GitHub repo against requirements |
| POST | `/ai/check-requirements` | ✅ | Check description vs requirements |
| POST | `/ai/analyze-submission` | ✅ | Full submission analysis |

### Credits
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/credits/packages` | ❌ | List credit packages |
| GET | `/credits/balance` | ✅ | Get balance |
| POST | `/credits/purchase` | ✅ | Purchase credits |
| POST | `/credits/use` | ✅ | Manually deduct credits |
| GET | `/credits/history` | ✅ | Transaction history |

---

## Credit System

| Model | Cost per verification |
|---|---|
| Gemini 1.5 Flash | 0.5 credits |
| Claude 3 Haiku | 1.0 credit |
| GPT-4o Mini | 1.5 credits |

**Credit packages:**
- Starter: 10 credits — $5
- Basic: 50 credits — $20
- Pro: 100 credits — $35
- Enterprise: 500 credits — $150

---

## Smart Contracts (Cadence / Flow)

### Deploying to testnet

```bash
# Install Flow CLI
# https://docs.onflow.org/flow-cli/install/

flow accounts create --network testnet

# Update flow.json with your testnet address and private key

flow project deploy --network testnet
```

### After deployment
Replace `0xCOORDA_CONTRACT_ADDRESS` in all `.cdc` transaction/script files with your deployed contract address.

---

## Firebase Collections

| Collection | Fields |
|---|---|
| `users` | uid, email, role, credits, flowAddress, displayName |
| `buildathons` | id, hostId, title, description, prizePool, status, startDate, endDate |
| `waves` | id, buildathonId, hostId, name, maxBuilders, builders[], status, requirements[] |
| `submissions` | id, waveId, devId, repoUrl, ipfsHash, verificationStatus, verificationScore |
| `credits` | (embedded in users.credits) |
| `credit_transactions` | id, userId, amount, type, description, createdAt |
| `escrows` | id, buildathonId, hostId, amount, status, flowTxId |
