const express = require('express');
const router = express.Router();
const { getAuditLogs, state } = require('../data/store');

// GET /api/audit-logs
router.get('/audit-logs', (req, res) => {
  res.json(getAuditLogs());
});

// GET /api/audit-summary
router.get('/audit-summary', (req, res) => {
  const logs = getAuditLogs();
  const verifiedCount = logs.filter(l => l.policyDecision === 'APPROVED' && l.txHash).length;
  const rejectedCount = logs.filter(l => l.policyDecision === 'REJECTED').length;

  res.json({
    totalAuditEvents: logs.length,
    verifiedDisbursements: verifiedCount,
    rejectedAttempts: rejectedCount,
    latestLog: logs.length > 0 ? logs[0] : null
  });
});

module.exports = router;
