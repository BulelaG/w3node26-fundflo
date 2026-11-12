# FundFlow — Official Hackathon Demo Script & Pitch Guide
**W3Node Hackathon 2026 — Agentic Finance Track (Sponsored by Ripple)**  
*Product Tagline: Every approved rand. Accounted for.*

---

## 🎯 1. The 60-Second Hook (Problem & Real Data)

> *"Good afternoon judges. In South Africa, education funding is plagued by severe governance failures. The Special Investigating Unit (SIU) uncovered over **R5 Billion** in improper disbursements to more than 40,000 ineligible beneficiaries—including ghost students, dropouts, and duplicate allocations. Furthermore, when funding bodies switched to direct payment fintechs, students were hit with predatory monthly account fees and ATM charges on their meager living stipends.*
> 
> *The problem isn't that funding doesn't exist. The problem is that **reconciliation takes 12 months, middlemen extract rent, and current systems lack independent, real-time policy enforcement**.*
> 
> *We built **FundFlow**: an AI-powered student funding disbursement and assurance platform that answers the Ripple track challenge: **'Would your CFO sign off?'***"

---

## 🏗️ 2. The Architecture (30 Seconds)

> *"FundFlow is not a chatbot asking for approval. It is an autonomous agent operating under strict, out-of-agent constraints.*
> 
> *1. **The AI Agent:** Proposes payments by discovering scheduled bursary stipends.*  
> *2. **The Independent Policy Engine:** A zero-trust security gatekeeper enforcing student monthly caps, total budgets, and duplicate locks. The agent cannot alter its own limits.*  
> *3. **The XRP Ledger:** Provides near-instant 3.8-second final settlement with fractions-of-a-cent fees, creating a tamper-proof cryptographic audit trail."*

---

## 🎬 3. Live 3-Minute Product Demonstration

### Step 1: The Administrator Control Deck
* **Screen:** Open `http://localhost:5173` on the **Administrator Control** tab.
* **Talking Point:**
  > *"Here is the CFO's dashboard for the WeThinkCode Student Living Allowance Fund. You can see our 50,000 XRP treasury budget, our whitelisted synthetic students, and our live consensus connection to the XRP Ledger."*

### Step 2: Autonomous Disbursement on XRPL Testnet
* **Action:** Click the electric cyan button: **`[ ⚡ Run Autonomous Agent Cycle ]`**.
* **What happens:** The agent scans pending schedules, submits them to the Policy Engine, connects to XRPL Testnet, and settles in ~4 seconds.
* **Talking Point:**
  > *"The agent just ran autonomously. It evaluated scheduled stipends, cleared policy, and submitted transactions to the XRP Ledger. You can see the verified transaction hash generated in the live audit log."*

### Step 3: The Student Assurance Portal
* **Action:** Click the top navbar tab: **`Student Assurance Portal`**.
* **What happens:** The screen transitions to the student view for Sipho Dlamini (`STU-001`).
* **Talking Point:**
  > *"Here is what the student sees. A verified living stipend of 10 XRP (~R1,650). Notice the metrics: **Middleman Rent Extracted: R0.00**. No predatory bank charges. The student can click **'Verify on XRPL Explorer'** to see cryptographic proof on `testnet.xrpl.org`."*

### Step 4: The Showstopper — Blocking Invalid & Duplicate Attempts
* **Action:** Switch back to **Administrator Control**. In the **Hackathon Demo Sandbox**, click:
  1. **`Test Replay / Duplicate`** $\rightarrow$ Toast alert: *Policy Engine Intercepted Attack! Rejection code: `ERR_DUPLICATE_PAYMENT`*.
  2. **`Test Allowance Exceedance`** $\rightarrow$ Toast alert: *Policy Engine Intercepted Attack! Rejection code: `ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP`*.
* **Talking Point:**
  > *"This is the critical test. As Ripple stated in the workshop: **'A demo where the agent gets blocked beats one that only shows the happy path.'** An attacker or buggy agent tried to replay the payout and extract 50 XRP. The Independent Policy Engine intercepted both attempts immediately and logged the rejection codes to the audit trail."*

### Step 5: The Human CFO Kill Switch
* **Action:** Click the red **`[ Emergency Pause ]`** button.
* **What happens:** The dashboard shifts to a red glow: *MANDATE FROZEN / PAYMENTS HALTED*.
* **Talking Point:**
  > *"If an administrator spots an anomaly, they have an instant out-of-agent kill switch that overrides all autonomous operations."*

---

## 🏆 4. The 4 CFO Questions (Closing Punch)

> *"In conclusion, FundFlow answers the four fundamental questions every CFO asks:*
> 1. ***What is the agent allowed to do?*** *Only propose payments matching pre-approved bursary schedules.*
> 2. ***Who can it pay?*** *Only cryptographically whitelisted beneficiaries.*
> 3. ***How do I stop it?*** *With our instant Emergency Pause kill switch.*
> 4. ***How do I prove what it did?*** *Through an immutable ledger transaction hash on the XRP Ledger.*
> 
> *Every approved rand. Accounted for. Thank you!"*
