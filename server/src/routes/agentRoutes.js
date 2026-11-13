const express = require('express');
const router = express.Router();
const { agentInstance } = require('../agent/disbursementAgent');
const requireAdminRole = require('../middleware/requireAdminRole');

// POST /api/agent/trigger
router.post('/agent/trigger', requireAdminRole, async (req, res) => {
  try {
    const report = await agentInstance.runCycle();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/status
router.get('/agent/status', (req, res) => {
  res.json({
    agentName: agentInstance.agentName,
    status: agentInstance.status
  });
});

module.exports = router;
