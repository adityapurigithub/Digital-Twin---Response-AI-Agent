/**
 * /api/simulate  — Test endpoint for local development
 *
 * Simulate an incoming WhatsApp message without needing a real Twilio webhook.
 * The frontend's "Test Mode" panel calls this endpoint.
 *
 * Usage (curl):
 *   curl -X POST http://localhost:3001/api/simulate \
 *     -H "Content-Type: application/json" \
 *     -d '{"from":"+919876543210","name":"Test User","message":"Hey, what time is the meeting?"}'
 */

const express = require('express');
const router  = express.Router();

const { analyzeAndDraft } = require('../services/openai');
const { sendWhatsApp }    = require('../services/twilio');
const {
  store, addMessage, addToReviewQueue, findContactByPhone, logActivity,
} = require('../store');

const THRESHOLD = () => Number(process.env.CONFIDENCE_THRESHOLD || 85);

router.post('/', async (req, res) => {
  const { from, name, message, platform = 'WhatsApp' } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  const senderName = name || from || 'Test User';
  const senderFrom = `whatsapp:${from || '+910000000000'}`;

  console.log(`\n[Simulate] 🧪 Simulating message from ${senderName}: "${message}"`);

  // Find matching contact directive
  const contact = findContactByPhone(from) || store.contacts.find((c) => c.name === 'Default');
  const contactDirective = contact?.directive || null;
  const autoApprove      = contact?.autoApprove ?? false;

  // Call OpenAI
  const { draft, confidence, sentiment, intent } = await analyzeAndDraft({
    incomingText: message, senderName, platform, contactDirective,
  });

  // Add to store
  const msg = addMessage({
    from: senderFrom, senderName, senderTag: contact?.tag || 'General',
    platform, original: message, draft, confidence, sentiment, intent, status: 'pending',
  });

  let autoSent = false;

  if (confidence >= THRESHOLD() || autoApprove) {
    // Auto-send (demo mode = just log)
    await sendWhatsApp(senderFrom, draft);
    msg.status = 'auto-sent';
    store.stats.totalReplied++;
    store.stats.autoSent++;
    logActivity('✅', `Auto-replied to ${senderName}`, `${platform} · ${confidence}% confidence · Simulated`);
    autoSent = true;
    console.log(`[Simulate] ✅ Auto-sent: "${draft}"`);
  } else {
    // Queue it
    addToReviewQueue({
      id: msg.id, messageId: msg.id, name: senderName, platform,
      avatar: '#f59e0b', time: 'just now', original: message,
      draft, confidence, sentiment, intent,
      reason: `${intent} — ${confidence}% confidence — Needs your review.`,
      from: senderFrom,
    });
    store.stats.needsReview = store.reviewQueue.length;
    logActivity('🚨', `Flagged message from ${senderName}`, `${platform} · ${confidence}% confidence · Simulated`);
    console.log(`[Simulate] ⌛ Added to Review Queue (confidence: ${confidence}%)`);
  }

  res.json({
    success:    true,
    messageId:  msg.id,
    draft,
    confidence,
    sentiment,
    intent,
    autoSent,
    action: autoSent ? 'auto-sent' : 'queued-for-review',
  });
});

module.exports = router;
