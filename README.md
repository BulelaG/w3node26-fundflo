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
*(No initial edits needed; runs in zero-config development mode by default).*

### 3. Run the Development Servers
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

## 🤝 Collaboration & Contribution
We follow **Trunk-Based Development (TBD)** with short-lived feature branches merging into `main`.  
👉 Read our complete collaboration manual: **[`CONTRIBUTING.md`](CONTRIBUTING.md)**

---

## 📚 Documentation & Reference
* 📄 **Architecture Brief (Markdown):** [`docs/TEAM_BRIEF_AND_ARCHITECTURE.md`](docs/TEAM_BRIEF_AND_ARCHITECTURE.md)
* 📋 **API Specifications:** [`docs/API_SPEC.md`](docs/API_SPEC.md)
* 📑 **Compiled Printable Team PDF:** [`docs/FundFlow_Team_Brief_and_Architecture.pdf`](docs/FundFlow_Team_Brief_and_Architecture.pdf)
