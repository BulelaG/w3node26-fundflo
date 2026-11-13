const express = require('express');
const cors = require('cors');

const mandateRoutes = require('../server/src/routes/mandateRoutes');
const paymentRoutes = require('../server/src/routes/paymentRoutes');
const auditRoutes = require('../server/src/routes/auditRoutes');
const agentRoutes = require('../server/src/routes/agentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api', mandateRoutes);
app.use('/api', paymentRoutes);
app.use('/api', auditRoutes);
app.use('/api', agentRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'FundFlow Vercel Serverless Engine',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'FundFlow API on Vercel',
    tagline: 'Every approved rand. Accounted for.',
    hackathonTrack: 'Agentic Finance (W3Node 2026 - Sponsored by Ripple)'
  });
});

module.exports = app;
