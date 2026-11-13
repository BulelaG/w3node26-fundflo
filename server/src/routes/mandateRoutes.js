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
router.post('/demo/reset', (req, res) => {
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

// GET /api/programmes
router.get('/programmes', (req, res) => {
  res.json(getProgrammes().map(serializeProgramme));
});

// POST /api/programmes (Create New Funding Mandate)
router.post('/programmes', (req, res) => {
  const { name, sponsor, totalBudget } = req.body;
  if (!name || !totalBudget) {
    return res.status(400).json({ error: 'Name and totalBudget are required.' });
  }

  const newProg = addProgramme({ name, sponsor, totalBudget });
  res.status(201).json(serializeProgramme(newProg));
});

// PATCH /api/programmes/:id (Update Mandate Settings/Budget)
router.patch('/programmes/:id', (req, res) => {
  const updated = updateProgramme(req.params.id, req.body);
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
router.patch('/programmes/:id/toggle-pause', (req, res) => {
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
router.post('/beneficiaries', (req, res) => {
  const { fullName, institution, monthlyAllowance, programmeId, studentId } = req.body;
  if (!fullName) {
    return res.status(400).json({ error: 'Student full name is required.' });
  }

  const newStudent = addBeneficiary({
    fullName,
    institution,
    monthlyAllowance,
    programmeId,
    studentId
  });

  res.status(201).json(serializeBeneficiary(newStudent));
});

// PATCH /api/beneficiaries/:studentId (Adjust Allowance Cap or Status)
router.patch('/beneficiaries/:studentId', (req, res) => {
  const updated = updateBeneficiary(req.params.studentId, req.body);
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
