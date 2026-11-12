const express = require('express');
const router = express.Router();
const { processDisbursement } = require('../policy/policyEngine');
const { getBeneficiaryById, getSchedules } = require('../data/store');

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

// GET /api/students/:studentId/status
router.get('/students/:studentId/status', (req, res) => {
  const beneficiary = getBeneficiaryById(req.params.studentId);
  if (!beneficiary) {
    return res.status(404).json({ error: 'Student not found in registered beneficiaries' });
  }

  const allSchedules = getSchedules();
  const studentSchedules = allSchedules.filter(s => s.studentId === beneficiary.studentId);

  res.json({
    studentId: beneficiary.studentId,
    fullName: beneficiary.fullName,
    institution: beneficiary.institution,
    monthlyAllowance: beneficiary.monthlyAllowance,
    walletAddress: beneficiary.walletAddress,
    status: beneficiary.status,
    programmeId: beneficiary.programmeId,
    disbursements: studentSchedules.map(s => ({
      scheduleId: s.scheduleId,
      period: s.period,
      amount: s.amount,
      status: s.status,
      txHash: s.txHash,
      xrplExplorerUrl: s.txHash ? `https://testnet.xrpl.org/transactions/${s.txHash}` : null,
      rejectionReason: s.rejectionReason,
      updatedAt: s.updatedAt
    }))
  });
});

module.exports = router;
