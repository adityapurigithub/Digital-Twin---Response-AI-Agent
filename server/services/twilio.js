/**
 * AutoPilot AI — Twilio Service
 * Handles sending WhatsApp messages back via Twilio.
 */

const twilio = require('twilio');

let client;

function getClient() {
  if (!client) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || sid === 'ACplaceholder') {
      console.warn('[Twilio] ⚠  No valid credentials. Running in DEMO mode — messages will NOT be sent.');
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
}

/**
 * Send a WhatsApp message via Twilio.
 * @param {string} to   - Recipient in format "whatsapp:+91XXXXXXXXXX"
 * @param {string} body - Message text
 * @returns {Promise<object>} Twilio message SID or mock result
 */
async function sendWhatsApp(to, body) {
  const twilioClient = getClient();

  if (!twilioClient) {
    // Demo mode — log it but don't actually send
    console.log(`[Twilio DEMO] Would send to ${to}: "${body}"`);
    return { sid: `DEMO_${Date.now()}`, status: 'demo', to, body };
  }

  try {
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body,
    });
    console.log(`[Twilio] ✅ Sent to ${to} — SID: ${message.sid}`);
    return { sid: message.sid, status: message.status, to, body };
  } catch (err) {
    console.error('[Twilio] ❌ Failed to send message:', err.message);
    throw err;
  }
}

/**
 * Validate that an incoming webhook request is from Twilio.
 * Use this middleware when deploying to production.
 */
function validateTwilioSignature(req, res, next) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || authToken === 'placeholder') {
    // Skip validation in demo mode
    return next();
  }

  const signature = req.headers['x-twilio-signature'];
  const url       = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid   = twilio.validateRequest(authToken, signature, url, req.body);

  if (!isValid) {
    console.warn('[Twilio] ⚠  Invalid webhook signature — rejected.');
    return res.status(403).send('Forbidden');
  }
  next();
}

module.exports = { sendWhatsApp, validateTwilioSignature };
