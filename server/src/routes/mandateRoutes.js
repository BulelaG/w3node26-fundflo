const express = require('express');
const router = express.Router();
const {
  getProgrammes,
  getProgrammeById,
  setProgrammePause,
  getBeneficiaries,
  getSchedules
} = require('../data/store');

// GET /api/programmes
router.get('/programmes', (req, res) => {
  res.json(getProgrammes());
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

// GET /api/schedules
router.get('/schedules', (req, res) => {
  res.json(getSchedules());
});

module.exports = router;
