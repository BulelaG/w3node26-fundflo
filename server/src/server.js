require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'FundFlow Backend Engine',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root API Welcome & Overview
app.get('/api', (req, res) => {
  res.json({
    name: 'FundFlow API',
    tagline: 'Every approved rand. Accounted for.',
    hackathonTrack: 'Agentic Finance (W3Node 2026)',
    endpoints: [
      '/api/health',
      '/api/programmes',
      '/api/beneficiaries',
      '/api/schedules',
      '/api/agent/trigger',
      '/api/audit-logs'
    ]
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` FundFlow Engine Active on http://localhost:${PORT}`);
    console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
