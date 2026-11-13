require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mandateRoutes = require('./routes/mandateRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const agentRoutes = require('./routes/agentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api', mandateRoutes);
app.use('/api', paymentRoutes);
app.use('/api', auditRoutes);
app.use('/api', agentRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'FundFlow Backend Engine',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root API Overview
app.get('/api', (req, res) => {
  res.json({
    name: 'FundFlow API',
    tagline: 'Every approved rand. Accounted for.',
    hackathonTrack: 'Agentic Finance (W3Node 2026 - Sponsored by Ripple)',
    endpoints: [
      '/api/health',
      '/api/programmes',
      '/api/beneficiaries',
      '/api/schedules',
      '/api/demo/reset',
      '/api/agent/trigger',
      '/api/audit-logs',
      '/api/students/:studentId/status'
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
