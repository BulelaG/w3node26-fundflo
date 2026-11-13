# FundFlow 🌊
> **Every approved rand. Accounted for.**  
> *AI-Powered Student Funding Disbursement & Assurance Platform*  
> **W3Node Hackathon 2026 — Agentic Finance Track (Sponsored by Ripple)**

---

## 🎯 The Vision
FundFlow provides transparent, controlled disbursement and real-time ledger assurance for education funding in South Africa.

By combining an **autonomous AI disbursement agent**, an **independent out-of-agent policy engine**, and **XRPL Testnet settlement**, FundFlow eliminates predatory middleman fees, prevents duplicate disbursements, and ensures real-time cryptographic auditability for CFOs and funding bodies.

---

## 🏗️ Architecture at a Glance

```text
[ React Admin & Student Dashboards ]
               │
               ▼
     [ Express REST API ]
               ▲
               │
 [ AI Autonomous Disbursement Agent ]
               │ (Proposes Payment)
               ▼
  [ INDEPENDENT POLICY ENGINE ]  ◄── Zero-Trust Gatekeeper (Checks budget, whitelist, duplicate guard)
               │
               ├── IF APPROVED: Dispatches to XRPL Service
               └── IF REJECTED: Emits Audit Reason Code
                       │
                       ▼
         [ XRPL Transaction Service ]
                       │ (Signs & Submits to XRPL Testnet)
                       ▼
          [ XRPL Testnet Ledger ] ── (3-5s Final Settlement & tesSUCCESS Hash)
```

---

## 🚀 Quickstart

### Prerequisites
* **Node.js**: v18+ (Recommended v20 or v22)
* **npm**: v9+

### 1. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment
```bash
# In the server/ directory:
cp .env.example .env
```
*Zero-config mode works out of the box. For demos, set `XRPL_ADMIN_SEED` to a pre-funded Testnet wallet so the treasury survives restarts. There is deliberately no fallback seed in the source code.*

### 3. Run the Offline Test Suite (no network, ~200 ms)
```bash
cd server
npm test            # Policy engine + agent unit tests via node:test (XRPL stubbed)
npm run test:xrpl   # Optional: live XRPL Testnet end-to-end verification
```

### 4. Run the Development Servers
Open two terminal windows:
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend App (Port 5173)
cd client
npm run dev
```

Visit:
* Frontend App: `http://localhost:5173`
* Backend Healthcheck: `http://localhost:5000/api/health`

---

## ☁️ Deployment Notes
* **Client:** Vercel (Vite) via `vercel.json`.
* **API:** needs a long-lived process. The backend keeps budgets, schedules, the duplicate-payment lock and the audit trail in memory and holds a persistent WebSocket to XRPL. Serverless cold starts wipe that state. Use `render.yaml` (Render Blueprint) or any always-on Node host, then point `VITE_API_BASE_URL` at it.
* **Before the demo:** pre-fund the admin wallet at the Testnet faucet and set `XRPL_ADMIN_SEED` in the host's environment. Never commit it.
* **Currency:** the indicative XRP→ZAR rate is owned by the server (`XRP_TO_ZAR_RATE`, default 165) and exposed at `GET /api/config` and in `GET /api/analytics`.

---

## 🤝 Collaboration & Contribution
We follow **Trunk-Based Development (TBD)** with short-lived feature branches merging into `main`.  
👉 Read our complete collaboration manual: **[`CONTRIBUTING.md`](CONTRIBUTING.md)**

---

## 📚 Documentation & Reference
* 📄 **Architecture Brief (Markdown):** [`docs/TEAM_BRIEF_AND_ARCHITECTURE.md`](docs/TEAM_BRIEF_AND_ARCHITECTURE.md)
* 📋 **API Specifications:** [`docs/API_SPEC.md`](docs/API_SPEC.md)
* 📑 **Compiled Printable Team PDF:** [`docs/FundFlow_Team_Brief_and_Architecture.pdf`](docs/FundFlow_Team_Brief_and_Architecture.pdf)
