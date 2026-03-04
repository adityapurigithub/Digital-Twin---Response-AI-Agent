/**
 * /api/review  — Review Queue routes
 *
 * The frontend calls these when the user:
 *  - Approves a draft (and optionally edits it before sending)
 *  - Dismisses a flagged message
 */

const express = require('express');
const router  = express.Router();
const { store, removeFromReviewQueue, updateMessage, logActivity } = require('../store');
const { sendWhatsApp } = require('../services/twilio');

// GET  /api/review            — get full review queue
router.get('/', (req, res) => {
  res.json({ success: true, count: store.reviewQueue.length, queue: store.reviewQueue });
});

// POST /api/review/:id/approve  — approve a draft (with optional edited body)
router.post('/:id/approve', async (req, res) => {
  const { id }        = req.params;
  const { editedDraft } = req.body; // optional — user can edit before approving

  const entry = store.reviewQueue.find((e) => e.id === id);
  if (!entry) {
    return res.status(404).json({ success: false, message: 'Queue entry not found' });
  }

  const finalReply = editedDraft || entry.draft;

  try {
    // Send the message via Twilio
    const result = await sendWhatsApp(entry.from, finalReply);

    // Update stats
    store.stats.totalReplied++;

    // Update message state
    updateMessage(id, { status: 'approved-sent', finalReply });

    // Remove from queue
    removeFromReviewQueue(id);

    logActivity(
      '✅',
      `Approved & sent reply to ${entry.name}`,
      `${entry.platform} · Edited: ${editedDraft ? 'Yes' : 'No'} · just now`
    );

    console.log(`[Review] ✅ Approved and sent reply to ${entry.name} — SID: ${result.sid}`);
    res.json({ success: true, sid: result.sid, finalReply });
  } catch (err) {
    console.error('[Review] ❌ Failed to send approved message:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/review/:id/dismiss  — dismiss without sending
router.post('/:id/dismiss', (req, res) => {
  const { id } = req.params;
  const entry  = store.reviewQueue.find((e) => e.id === id);

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Queue entry not found' });
  }

  updateMessage(id, { status: 'dismissed' });
  removeFromReviewQueue(id);
  logActivity('🗑️', `Dismissed message from ${entry.name}`, `${entry.platform} · No reply sent`);

  console.log(`[Review] 🗑  Dismissed message from ${entry.name}`);
  res.json({ success: true });
});

module.exports = router;
