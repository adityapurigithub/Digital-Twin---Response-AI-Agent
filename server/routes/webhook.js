/**
 * POST /webhook/whatsapp
 *
 * This is the endpoint Twilio calls when someone sends a WhatsApp message
 * to your Twilio number.
 *
 * Flow:
 *  1. Parse the incoming body (Twilio sends URL-encoded form data)
 *  2. Find contact-specific directive (VIP rules)
 *  3. Call OpenAI to generate a draft reply + confidence score
 *  4. If confidence >= threshold → auto-send via Twilio
 *     If confidence < threshold  → add to Review Queue for manual approval
 *  5. Log activity and update stats
 *  6. Return a TwiML "empty" response (Twilio expects this)
 */

const express = require('express');
const router  = express.Router();

const { analyzeAndDraft }      = require('../services/openai');
const { sendWhatsApp }         = require('../services/twilio');
const {
  store, addMessage, addToReviewQueue, findContactByPhone, logActivity,
} = require('../store');

const THRESHOLD = () => Number(process.env.CONFIDENCE_THRESHOLD || 85);

router.post('/whatsapp', async (req, res) => {
  try {
    const body       = req.body || {};
    const from       = body.From   || 'whatsapp:+910000000000'; // e.g. "whatsapp:+919876543210"
    const msgBody    = body.Body   || '';
    const senderName = body.ProfileName || from.replace('whatsapp:', '');
    const platform   = 'WhatsApp';

    console.log(`\n[Webhook] 📩 Message from ${senderName} (${from}): "${msgBody}"`);

    // ── 1. Find contact directive ──────────────────────────────
    const contact = findContactByPhone(from.replace('whatsapp:', ''))
      || store.contacts.find((c) => c.tag === 'Default' || c.name === 'Default');

    const contactDirective = contact?.directive || null;
    const senderTag        = contact?.tag        || 'General';
    const autoApprove      = contact?.autoApprove ?? false;

    // ── 2. Analyze with OpenAI ─────────────────────────────────
    const { draft, confidence, sentiment, intent } = await analyzeAndDraft({
      incomingText:     msgBody,
      senderName,
      platform,
      contactDirective,
    });

    console.log(`[AI]      Draft: "${draft}" | Confidence: ${confidence}% | Intent: ${intent}`);

    // ── 3. Add to message store ────────────────────────────────
    const message = addMessage({
      from, senderName, senderTag, platform,
      original: msgBody,
      draft,
      confidence,
      sentiment,
      intent,
      status: 'pending',
    });

    // ── 4. Decision: Auto-send or Queue? ───────────────────────
    let wentToQueue = false;

    if (confidence >= THRESHOLD() || autoApprove) {
      // Try to AUTO-SEND
      try {
        await sendWhatsApp(from, draft);
        message.status = 'auto-sent';
        store.stats.totalReplied++;
        store.stats.autoSent++;

        logActivity('✅', `Auto-replied to ${senderName}`, `${platform} · ${confidence}% confidence · ${intent}`);
        console.log(`[AutoPilot] ✅ Auto-sent reply to ${senderName}`);
      } catch (twilioErr) {
        console.error(`[AutoPilot] ❌ Twilio threw an error while auto-sending to ${senderName}. Falling back to Review Queue. Error: ${twilioErr.message}`);
        wentToQueue = true; // Fall back
      }
    } else {
      wentToQueue = true;
    }

    if (wentToQueue) {
      // ADD TO REVIEW QUEUE
      const queueReason = (confidence >= THRESHOLD() || autoApprove) 
        ? `⚠️ Auto-send failed! Twilio encountered an error.` 
        : `${intent} — AI confidence ${confidence}% below threshold. Awaiting your approval.`;

      const queueEntry = {
        id:       message.id,
        messageId: message.id,
        name:     senderName,
        platform,
        avatar:   '#f59e0b',
        time:     'just now',
        original: msgBody,
        draft,
        confidence,
        sentiment,
        intent,
        reason:   queueReason,
        from,
      };

      addToReviewQueue(queueEntry);
      store.stats.needsReview = store.reviewQueue.length;

      logActivity('🚨', `Flagged message from ${senderName}`, `${platform} · ${confidence}% confidence · Needs Review`);
      console.log(`[AutoPilot] ⌛ Added to Review Queue — confidence too low (${confidence}%)`);
    }

    // ── 5. Respond to Twilio (empty TwiML — we're handling the reply ourselves) ──
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');

  } catch (err) {
    console.error('[Webhook] ❌ Error processing message:', err);
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
});

module.exports = router;
