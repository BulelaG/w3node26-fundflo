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

// Ping Endpoint (minimal test)
app.get('/api/ping', (req, res) => res.json({ ping: 'pong', time: new Date().toISOString() }));
app.get('/ping', (req, res) => res.json({ ping: 'pong', time: new Date().toISOString() }));

// Health Check Endpoint (handles both /api/health and /health)
const handleHealth = (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'FundFlow Backend Engine',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Root API Overview (handles both /api and /)
const handleRoot = (req, res) => {
  res.json({
    name: 'FundFlow API',
    status: 'ONLINE',
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
};
app.get('/api', handleRoot);
app.get('/', handleRoot);

// Mount API Routes under both /api and / so rewrites work seamlessly
app.use('/api', mandateRoutes);
app.use('/', mandateRoutes);

app.use('/api', paymentRoutes);
app.use('/', paymentRoutes);

app.use('/api', auditRoutes);
app.use('/', auditRoutes);

app.use('/api', agentRoutes);
app.use('/', agentRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'ERR_SERVER_ERROR'
  });
});

// Only start local HTTP listener if running outside Vercel serverless
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` FundFlow Engine Active on http://localhost:${PORT}`);
    console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
module.exports.default = app;
