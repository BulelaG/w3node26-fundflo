const express = require('express');
const router = express.Router();
const { processDisbursement } = require('../policy/policyEngine');
const { getBeneficiaryById, getSchedules, getScheduleById, state } = require('../data/store');

// POST /api/disbursements/validate-and-pay
router.post('/disbursements/validate-and-pay', async (req, res) => {
  const { programmeId, studentId, amount, scheduleId } = req.body;

  if (!programmeId || !studentId || !amount || !scheduleId) {
    return res.status(400).json({
      error: 'Missing required parameters: programmeId, studentId, amount, scheduleId are required.'
    });
  }

  try {
    const result = await processDisbursement({ programmeId, studentId, amount, scheduleId });
    if (result.approved && result.executed) {
      return res.status(200).json({
        status: 'SUCCESS',
        ...result
      });
    } else {
      return res.status(422).json({
        status: 'REJECTED_OR_FAILED',
        ...result
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/:studentId/claim (Student-initiated allowance claim)
router.post('/students/:studentId/claim', async (req, res) => {
  const beneficiary = getBeneficiaryById(req.params.studentId);
  if (!beneficiary) {
    return res.status(404).json({ error: 'Student not found in registered beneficiaries' });
  }

  // Find their schedule or generate on-demand claim
  const allSchedules = getSchedules();
  let pendingSched = allSchedules.find(s => s.studentId === beneficiary.studentId && s.status === 'PENDING');

  if (!pendingSched) {
    // Generate an on-demand claim schedule
    const scheduleId = `SCH-CLAIM-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    pendingSched = {
      id: scheduleId,
      _id: scheduleId,
      scheduleId,
      studentId: beneficiary.studentId,
      programmeId: beneficiary.programmeId,
      period: "November 2026 Claim",
      amount: beneficiary.monthlyAllowance,
      currency: "XRP",
      status: "PENDING",
      txHash: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    };
    state.schedules.push(pendingSched);
  }

  try {
    const result = await processDisbursement({
      programmeId: beneficiary.programmeId,
      studentId: beneficiary.studentId,
      amount: pendingSched.amount,
      scheduleId: pendingSched.scheduleId
    });

    const scheduleId = pendingSched.id || pendingSched._id || pendingSched.scheduleId;
    res.json({
      success: result.approved && result.executed,
      id: scheduleId,
      _id: scheduleId,
      scheduleId,
      period: pendingSched.period || "November 2026",
      amount: pendingSched.amount,
      currency: "XRP",
      status: pendingSched.status,
      updatedAt: pendingSched.updatedAt,
      decision: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:studentId/status
router.get('/students/:studentId/status', (req, res) => {
  const beneficiary = getBeneficiaryById(req.params.studentId);
  if (!beneficiary) {
    return res.status(404).json({ error: 'Student not found in registered beneficiaries' });
  }

  const allSchedules = getSchedules();
  const studentSchedules = allSchedules.filter(s => s.studentId === beneficiary.studentId);

  res.json({
    id: beneficiary.id || beneficiary._id || beneficiary.studentId,
    _id: beneficiary.id || beneficiary._id || beneficiary.studentId,
    studentId: beneficiary.studentId,
    fullName: beneficiary.fullName,
    institution: beneficiary.institution,
    monthlyAllowance: beneficiary.monthlyAllowance,
    currency: "XRP",
    walletAddress: beneficiary.walletAddress,
    status: beneficiary.status,
    programmeId: beneficiary.programmeId,
    disbursements: studentSchedules.map(s => {
      const id = s.id || s._id || s.scheduleId;
      return {
        ...s,
        id,
        _id: id,
        period: s.period || "November 2026",
        currency: "XRP",
        xrplExplorerUrl: s.txHash ? `https://testnet.xrpl.org/transactions/${s.txHash}` : null,
        updatedAt: s.updatedAt || s.createdAt || new Date().toISOString()
      };
    })
  });
});

module.exports = router;
