# FundFlow API Specification (Contract between Dev 1 & Dev 2)

**Base URL:** `http://localhost:5000/api`

---

## 1. Programmes (Mandates)

### `GET /programmes`
Returns all funding programmes.
**Response (200):**
```json
[
  {
    "_id": "6732...01",
    "programmeId": "PRG-WE-THINK-CODE-2026",
    "name": "WeThinkCode Student Living Allowance Fund",
    "sponsor": "National Tech Bursary Alliance",
    "totalBudget": 50000,
    "remainingBudget": 46700,
    "currency": "XRP",
    "isPaused": false,
    "beneficiaryCount": 5,
    "createdAt": "2026-11-12T10:00:00.000Z"
  }
]
```

### `PATCH /programmes/:id/toggle-pause`
Admin Emergency Kill Switch.
**Response (200):**
```json
{
  "message": "Programme pause status updated",
  "programmeId": "PRG-WE-THINK-CODE-2026",
  "isPaused": true
}
```

---

## 2. Beneficiaries (Whitelisted Students)

### `GET /beneficiaries`
Returns all registered synthetic students.
**Response (200):**
```json
[
  {
    "_id": "6732...02",
    "studentId": "STU-2026-001",
    "fullName": "Sipho Dlamini",
    "institution": "WeThinkCode Cape Town",
    "walletAddress": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    "monthlyAllowance": 1650,
    "status": "ACTIVE",
    "programmeId": "PRG-WE-THINK-CODE-2026"
  }
]
```

---

## 3. Autonomous AI Agent Trigger

### `POST /agent/trigger`
Triggers an autonomous cycle of the AI Disbursement Agent.
The agent finds all eligible `PENDING` scheduled disbursements, prepares the transaction, and submits it to the Independent Policy Engine.

**Response (200):**
```json
{
  "success": true,
  "cycleId": "CYC-1731427200",
  "scannedCount": 3,
  "processed": [
    {
      "scheduleId": "SCH-001",
      "studentId": "STU-2026-001",
      "amount": 1650,
      "status": "APPROVED_AND_EXECUTED",
      "txHash": "E3F92C80A5D6...B37A"
    },
    {
      "scheduleId": "SCH-002",
      "studentId": "STU-2026-002",
      "amount": 5000,
      "status": "REJECTED_BY_POLICY",
      "reason": "ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP"
    }
  ]
}
```

---

## 4. Student Portal View

### `GET /students/:studentId/status`
Used by the Student Portal to display transparent payment assurance.

**Response (200):**
```json
{
  "studentId": "STU-2026-001",
  "fullName": "Sipho Dlamini",
  "institution": "WeThinkCode Cape Town",
  "monthlyAllowance": 1650,
  "walletAddress": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
  "disbursements": [
    {
      "scheduleId": "SCH-001",
      "month": "November 2026",
      "amount": 1650,
      "status": "VERIFIED",
      "txHash": "E3F92C80A5D6...B37A",
      "xrplExplorerUrl": "https://testnet.xrpl.org/transactions/E3F92C80A5D6...B37A",
      "timestamp": "2026-11-12T16:45:00.000Z"
    }
  ]
}
```

---

## 5. Audit & Assurance Trail

### `GET /audit-logs`
Returns the immutable chronological audit log.

**Response (200):**
```json
[
  {
    "_id": "6732...99",
    "timestamp": "2026-11-12T16:45:00.000Z",
    "eventType": "DISBURSEMENT_ATTEMPT",
    "studentId": "STU-2026-001",
    "programmeId": "PRG-WE-THINK-CODE-2026",
    "amount": 1650,
    "policyDecision": "APPROVED",
    "rejectionReason": null,
    "txHash": "E3F92C80A5D6...B37A",
    "ledgerResult": "tesSUCCESS"
  }
]
```
