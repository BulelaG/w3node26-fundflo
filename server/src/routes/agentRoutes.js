const express = require('express');
const router = express.Router();
const { agentInstance } = require('../agent/disbursementAgent');
const { chatWithCopilot } = require('../agent/claudeService');
const requireAdminRole = require('../middleware/requireAdminRole');

// POST /api/agent/trigger
router.post('/agent/trigger', requireAdminRole, async (req, res) => {
  try {
    const report = await agentInstance.runCycle();
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code || 'ERR_AGENT_CYCLE_FAILED' });
  }
});

// GET /api/agent/status
router.get('/agent/status', (req, res) => {
  res.json({
    agentName: agentInstance.agentName,
    status: agentInstance.status,
    claudeCopilot: 'ONLINE',
    model: 'claude-haiku-4-5-20251001'
  });
});

// POST /api/agent/copilot (Conversational Claude AI Assistant with Tool-Calling)
router.post('/agent/copilot', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Array of messages required in body' });
  }

  try {
    const result = await chatWithCopilot(messages);
    res.json(result);
  } catch (err) {
    console.error('[Claude Copilot Route Error]', err);
    res.status(500).json({
      error: 'Claude Copilot query failed',
      details: err.message || err
    });
  }
});

module.exports = router;
