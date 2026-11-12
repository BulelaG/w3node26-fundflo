# FundFlow — Team Master Brief & Architecture Guide
**W3Node Hackathon 2026 — Agentic Finance Track (Sponsored by Ripple)**  
*For: Developer 1 (MERN Application) & Developer 2 (Agentic Finance & XRPL)*  
*Compiled PDF Version: [`docs/FundFlow_Team_Brief_and_Architecture.pdf`](./FundFlow_Team_Brief_and_Architecture.pdf)*

---

## 1. Executive Summary & Purpose
This guide gives our 2-person distributed engineering team full context and alignment on **FundFlow**. While one developer works on the MERN dashboards and REST APIs, and the other works remotely using Git and GitHub Copilot CLI on XRPL Testnet settlement and the Independent Policy Engine, this document serves as the single source of truth.

---

## 2. The Real South African Problem: Grounded in Verified Data
To win over hackathon judges, our pitch and product solve a well-documented national crisis:

1. **R5+ Billion in Ineligible Disbursements (SIU Probe):**
   * The Special Investigating Unit (Proclamation R.88 of 2022) revealed over **40,000 ineligible students** received funds improperly—including ghost students, dropouts, deceased identities, and students exceeding the financial threshold.
2. **R2+ Billion in Stranded / Trapped Funds:**
   * Poor systems integration left billions unallocated in university and TVET college bank accounts. The SIU had to claw back over **R1.7 Billion** from institutions like UJ and UFS because of missing real-time reconciliation.
3. **The R47-Billion Direct Payment Scandal (Werksmans Report & High Court):**
   * In 2023, four fintechs (eZaga, Coinvest, Norraco, Tenet Technology) were awarded direct payment contracts. The independent Werksmans report uncovered serious conflicts of interest, and the Western Cape High Court declared the tender unconstitutional and unlawful.
4. **Predatory Middleman Fee Deductions:**
   * Fintech providers charged impoverished students high monthly fees (R12 to R29/month) plus ATM withdrawal charges on their meager R1,650 living allowance.
5. **Repeated Qualified Audits by Auditor-General (AGSA):**
   * Broken audit trails, lack of automated mandate checks, and payment records that do not reconcile with bank ledgers.

---

## 3. Ripple Hackathon Judging Requirements ("Would your CFO Sign Off?")
From the Ripple Agentic Finance workshop (Maxime Dienger):
* **No Chatbots:** An agent that asks a human to click "Approve" fails the track. The agent must execute payments autonomously on XRPL Testnet.
* **Out-of-Agent Enforcement:** Policy limits must be enforced **outside the agent's control** by an independent policy engine. The agent cannot alter its own budget.
* **The "Blocked Agent" Demo:** A demo where the agent gets blocked beats one that only shows the happy path. We must demonstrate the agent attempting an invalid/duplicate payment and being rejected.
* **Human Kill Switch:** The CFO/Admin can pause the mandate or change limits at any time.
* **Ledger Settlement:** Verifiable transaction hashes on `testnet.xrpl.org`.

---

## 4. System Architecture

```text
[ React + Vite Client ]
    ├── Admin Dashboard (Mandates, limits, pause switch, audit stream)
    └── Student Portal (Disbursement status & XRPL explorer links)
             │
             ▼
[ Express.js REST API ] ─── [ MongoDB / Mongoose Data Store ]
             ▲
             │
[ AI Autonomous Disbursement Agent ]
             │ (Proposes Payment Instruction)
             ▼
[ INDEPENDENT POLICY ENGINE ] (Zero-Trust Gatekeeper)
    ├── Checks Beneficiary Whitelist
    ├── Checks Individual Monthly Allowance Cap (e.g. R1,650)
    ├── Checks Remaining Programme Budget
    ├── Checks Duplicate / Idempotency (Prevents double dipping)
    └── Checks Admin Pause Status
             │
             ├── IF APPROVED: Dispatches to XRPL Service
             └── IF REJECTED: Emits Audit Log Reason Code & Halts
                     │
                     ▼
        [ XRPL Transaction Service ]
             ├── Isolated Server-Side Wallet
             ├── Signs & Submits to XRPL Testnet
             ├── Awaits Ledger Validation (`tesSUCCESS`)
             └── Returns 64-char Hash to Audit Trail
```

---

## 5. Two-Developer Task Division

| Area | **Developer 1 (MERN Application)** | **Developer 2 (Agentic Finance & XRPL)** |
| :--- | :--- | :--- |
| **Focus** | User Experience, Dashboards & REST Endpoints | Blockchain Settlement, Policy Gate & Agent Logic |
| **Key Tasks** | • React + Vite Admin Dashboard<br>• Student Portal with XRPL Explorer links<br>• Express routes & Mongoose models<br>• Navy/Cyan UI styling & status badges<br>• Frontend API integration | • XRPL Testnet connection (`xrpl.js`)<br>• Faucet auto-funding & transaction service<br>• Independent Policy Engine (Zero-Trust checks)<br>• Autonomous AI agent evaluation loop<br>• Security test scripts (duplicate/over-budget) |
| **Shared** | Collaborate on `docs/API_SPEC.md` so UI and backend services integrate seamlessly without waiting. | Review each other's pull requests and participate in demo rehearsal. |

---

## 6. Git & Remote Workflow (GitHub Copilot CLI Friendly)

* **Branches:**
  * `main` (Always deployable and demo-ready; do not commit directly).
  * `dev` (Shared integration branch).
  * `feature/dev1-admin-student-ui`
  * `feature/dev2-xrpl-policy-engine`
* **Secret Protection:** `.env` and wallet secret files are permanently ignored in `.gitignore`.
* **GitHub Copilot CLI Tips:**
  * Ask Copilot specific, self-contained questions:
    * `gh copilot suggest "Create an Express route in paymentRoutes.js to fetch all audit records"`
    * `gh copilot explain "How does xrpl.js verify that a transaction was validated in the ledger?"`

---

## 7. Developer Educational Primer

### XRPL Fundamentals
* **Speed:** 3–5 second final settlement via RPCA consensus.
* **Cost:** Negligible gas (~0.000012 XRP per transaction).
* **Reserve:** 1 XRP minimum account reserve to activate a wallet.
* **Drops:** 1 XRP = 1,000,000 drops. (`xrpl.xrpToDrops('10')`).
* **Success Code:** `tesSUCCESS` confirms irreversible transaction inclusion.

### Agentic Security Rules
* An LLM should **never** hold wallet private keys or approve transactions.
* The agent's role is strictly proposal; the deterministic Policy Engine is the execution authority.
