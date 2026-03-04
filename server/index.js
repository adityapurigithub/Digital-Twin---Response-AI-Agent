/**
 * AutoPilot AI — Backend Server (index.js)
 *
 * Architecture overview:
 *
 *   WhatsApp message
 *       │
 *       ▼
 *   POST /webhook/whatsapp   ← Twilio calls this
 *       │
 *       ▼
 *   OpenAI (gpt-4o-mini)     ← generates draft + confidence score
 *       │
 *       ├── confidence >= threshold? ──► Auto-send via Twilio
 *       │
 *       └── confidence <  threshold? ──► Review Queue (frontend approval)
 *
 *   Frontend dashboard polls:
 *     GET  /api/messages          → all messages
 *     GET  /api/review            → review queue
 *     GET  /api/messages/stats    → live stats
 *     GET  /api/messages/activity → activity feed
 *     POST /api/review/:id/approve
 *     POST /api/review/:id/dismiss
 *     POST /api/simulate          → test without real WhatsApp
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const bodyParser = require('body-parser');

// ─── Route imports ────────────────────────────────────────────────────
const webhookRoutes  = require('./routes/webhook');
const messageRoutes  = require('./routes/messages');
const reviewRoutes   = require('./routes/review');
const contactRoutes  = require('./routes/contacts');
const simulateRoutes = require('./routes/simulate');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors({ origin: '*' })); // Allow all origins to fix Vercel CORS issues
app.use(morgan('dev'));

// Twilio sends URL-encoded bodies for webhooks
app.use('/webhook', bodyParser.urlencoded({ extended: false }));

// All other routes use JSON
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/webhook',      webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/review',   reviewRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/simulate', simulateRoutes);

// Health check
app.get('/health', (req, res) => {
  const hasOpenAI  = !!(process.env.OPENAI_API_KEY  && process.env.OPENAI_API_KEY  !== 'sk-placeholder');
  const hasTwilio  = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'ACplaceholder');

  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    mode:      hasOpenAI && hasTwilio ? 'live' : 'demo',
    services: {
      openai: hasOpenAI ? '✅ connected' : '⚠  demo mode (no API key)',
      twilio: hasTwilio ? '✅ connected' : '⚠  demo mode (no credentials)',
    },
    threshold: `${process.env.CONFIDENCE_THRESHOLD || 85}%`,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  🤖 AutoPilot AI Server                  ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  🚀 Running on http://localhost:${PORT}   ║`);
  console.log(`║  📡 Webhook: POST /webhook/whatsapp      ║`);
  console.log(`║  🧪 Simulate: POST /api/simulate         ║`);
  console.log(`║  ❤  Health: GET /health                  ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const hasOpenAI = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder');
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'ACplaceholder');

  if (!hasOpenAI) console.log('  ⚠  OpenAI: DEMO MODE — add OPENAI_API_KEY to .env to go live');
  else            console.log('  ✅ OpenAI: Live');

  if (!hasTwilio) console.log('  ⚠  Twilio: DEMO MODE — add Twilio credentials to .env to go live\n');
  else            console.log('  ✅ Twilio: Live\n');
});

// Export the app for Vercel
module.exports = app;
