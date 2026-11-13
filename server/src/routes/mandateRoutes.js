const express = require('express');
const router = express.Router();
const {
  getProgrammes,
  getProgrammeById,
  addProgramme,
  updateProgramme,
  setProgrammePause,
  getBeneficiaries,
  addBeneficiary,
  updateBeneficiary,
  getSchedules,
  resetStore
} = require('../data/store');
const { getAccountLedgerInfo, getAdminWallet } = require('../xrpl/xrplClient');
const requireAdminRole = require('../middleware/requireAdminRole');
const { isValidXrplAddress } = require('../policy/policyEngine');
const { XRP_TO_ZAR_RATE } = require('../config/currency');

const BENEFICIARY_STATUSES = ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'];

function parsePositiveNumber(value, fieldName, { allowZero = false } = {}) {
  if (value === undefined) return { ok: true, value: undefined };
  const n = Number(value);
  if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) {
    return { ok: false, error: `${fieldName} must be a ${allowZero ? 'non-negative' : 'positive'} number.` };
  }
  return { ok: true, value: n };
}

function serializeProgramme(programme) {
  const id = programme.id || programme._id;
  return { ...programme, id, _id: id, currency: "XRP" };
}

function serializeBeneficiary(beneficiary) {
  const publicBeneficiary = { ...beneficiary };
  delete publicBeneficiary.walletSeed;
  const id = beneficiary.id || beneficiary._id || beneficiary.studentId;
  return {
    ...publicBeneficiary,
    id,
    _id: id,
    currency: "XRP"
  };
}

function serializeSchedule(schedule) {
  const id = schedule.id || schedule._id || schedule.scheduleId;
  return {
    ...schedule,
    id,
    _id: id,
    period: schedule.period || "November 2026",
    currency: "XRP",
    updatedAt: schedule.updatedAt || schedule.createdAt || new Date().toISOString()
  };
}

// POST /api/demo/reset (Restore local demo data without making XRPL requests)
router.post('/demo/reset', requireAdminRole, (req, res) => {
  const resetState = resetStore();
  res.json({
    success: true,
    message: 'In-memory demo data restored. XRPL ledger transactions are unchanged.',
    counts: {
      programmes: resetState.programmes.length,
      beneficiaries: resetState.beneficiaries.length,
      schedules: resetState.schedules.length,
      auditLogs: resetState.auditLogs.length
    }
  });
});

// GET /api/config (shared constants so the client never hardcodes financial parameters)
router.get('/config', (req, res) => {
  res.json({ xrpToZarRate: XRP_TO_ZAR_RATE, currency: 'XRP', network: 'testnet' });
});

// GET /api/programmes
router.get('/programmes', (req, res) => {
  res.json(getProgrammes().map(serializeProgramme));
});

// POST /api/programmes (Create New Funding Mandate)
router.post('/programmes', requireAdminRole, (req, res) => {
  const { name, sponsor, totalBudget } = req.body || {};
  if (!name || typeof name !== 'string' || totalBudget === undefined) {
    return res.status(400).json({ error: 'Name and totalBudget are required.' });
  }
  const budget = parsePositiveNumber(totalBudget, 'totalBudget');
  if (!budget.ok) return res.status(400).json({ error: budget.error });

  const newProg = addProgramme({ name: name.trim(), sponsor, totalBudget: budget.value });
  res.status(201).json(serializeProgramme(newProg));
});

// PATCH /api/programmes/:id (Update Mandate Settings/Budget)
router.patch('/programmes/:id', requireAdminRole, (req, res) => {
  const { name, totalBudget } = req.body || {};
  const updates = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name must be a non-empty string.' });
    updates.name = name.trim();
  }
  const budget = parsePositiveNumber(totalBudget, 'totalBudget');
  if (!budget.ok) return res.status(400).json({ error: budget.error });
  if (budget.value !== undefined) updates.totalBudget = budget.value;

  const updated = updateProgramme(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  res.json(serializeProgramme(updated));
});

// GET /api/programmes/:id
router.get('/programmes/:id', (req, res) => {
  const programme = getProgrammeById(req.params.id);
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  res.json(serializeProgramme(programme));
});

// PATCH /api/programmes/:id/toggle-pause (Admin Emergency Kill Switch)
router.patch('/programmes/:id/toggle-pause', requireAdminRole, (req, res) => {
  const programme = getProgrammeById(req.params.id);
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' });
  }

  const updatedPause = !programme.isPaused;
  setProgrammePause(programme.id, updatedPause);

  res.json({
    message: `Programme ${updatedPause ? 'PAUSED' : 'RESUMED'} by administrator`,
    programmeId: programme.id,
    id: programme.id,
    _id: programme.id,
    currency: "XRP",
    isPaused: updatedPause,
    updatedAt: programme.updatedAt
  });
});

// GET /api/beneficiaries
router.get('/beneficiaries', (req, res) => {
  res.json(getBeneficiaries().map(serializeBeneficiary));
});

// POST /api/beneficiaries (Onboard New Student Beneficiary)
router.post('/beneficiaries', requireAdminRole, (req, res) => {
  const { fullName, institution, monthlyAllowance, programmeId, studentId, walletAddress } = req.body || {};
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ error: 'Student full name is required.' });
  }
  const allowance = parsePositiveNumber(monthlyAllowance, 'monthlyAllowance');
  if (!allowance.ok) return res.status(400).json({ error: allowance.error });
  if (walletAddress !== undefined && walletAddress !== null && !isValidXrplAddress(walletAddress)) {
    return res.status(400).json({ error: 'walletAddress must be a valid XRPL classic address (starts with r).' });
  }
  if (programmeId !== undefined && !getProgrammeById(programmeId)) {
    return res.status(400).json({ error: `Programme ${programmeId} does not exist.` });
  }

  const newStudent = addBeneficiary({
    fullName: fullName.trim(),
    institution,
    monthlyAllowance: allowance.value,
    programmeId,
    studentId,
    walletAddress: walletAddress || null
  });

  res.status(201).json(serializeBeneficiary(newStudent));
});

// PATCH /api/beneficiaries/:studentId (Adjust Allowance Cap or Status)
router.patch('/beneficiaries/:studentId', requireAdminRole, (req, res) => {
  const { monthlyAllowance, status, walletAddress } = req.body || {};
  const updates = {};
  const allowance = parsePositiveNumber(monthlyAllowance, 'monthlyAllowance', { allowZero: true });
  if (!allowance.ok) return res.status(400).json({ error: allowance.error });
  if (allowance.value !== undefined) updates.monthlyAllowance = allowance.value;
  if (status !== undefined) {
    const normalized = String(status).toUpperCase();
    if (!BENEFICIARY_STATUSES.includes(normalized)) {
      return res.status(400).json({ error: `status must be one of ${BENEFICIARY_STATUSES.join(', ')}.` });
    }
    updates.status = normalized;
  }
  if (walletAddress !== undefined) {
    if (!isValidXrplAddress(walletAddress)) {
      return res.status(400).json({ error: 'walletAddress must be a valid XRPL classic address (starts with r).' });
    }
    updates.walletAddress = walletAddress;
  }

  const updated = updateBeneficiary(req.params.studentId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Beneficiary not found' });
  }
  res.json(serializeBeneficiary(updated));
});

// GET /api/schedules
router.get('/schedules', (req, res) => {
  res.json(getSchedules().map(serializeSchedule));
});

// GET /api/xrpl/account-info/:address (Query live XRP balance & ledger state)
router.get('/xrpl/account-info/:address', async (req, res) => {
  try {
    const info = await getAccountLedgerInfo(req.params.address);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xrpl/admin-wallet (Query live admin wallet address & balance)
router.get('/xrpl/admin-wallet', async (req, res) => {
  try {
    const wallet = await getAdminWallet();
    const info = await getAccountLedgerInfo(wallet.address);
    res.json({
      address: wallet.address,
      balanceXRP: info.balanceXRP,
      sequence: info.sequence
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
