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
  getSchedules
} = require('../data/store');
const { getAccountLedgerInfo, getAdminWallet } = require('../xrpl/xrplClient');

// GET /api/programmes
router.get('/programmes', (req, res) => {
  res.json(getProgrammes());
});

// POST /api/programmes (Create New Funding Mandate)
router.post('/programmes', (req, res) => {
  const { name, sponsor, totalBudget } = req.body;
  if (!name || !totalBudget) {
    return res.status(400).json({ error: 'Name and totalBudget are required.' });
  }

  const newProg = addProgramme({ name, sponsor, totalBudget });
  res.status(201).json(newProg);
});

// PATCH /api/programmes/:id (Update Mandate Settings/Budget)
router.patch('/programmes/:id', (req, res) => {
  const updated = updateProgramme(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  res.json(updated);
});

// GET /api/programmes/:id
router.get('/programmes/:id', (req, res) => {
  const programme = getProgrammeById(req.params.id);
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' });
  }
  res.json(programme);
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
    isPaused: updatedPause
  });
});

// GET /api/beneficiaries
router.get('/beneficiaries', (req, res) => {
  res.json(getBeneficiaries());
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

  res.status(201).json(newStudent);
});

// PATCH /api/beneficiaries/:studentId (Adjust Allowance Cap or Status)
router.patch('/beneficiaries/:studentId', (req, res) => {
  const updated = updateBeneficiary(req.params.studentId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Beneficiary not found' });
  }
  res.json(updated);
});

// GET /api/schedules
router.get('/schedules', (req, res) => {
  res.json(getSchedules());
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
