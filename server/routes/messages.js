/**
 * /api/messages  — REST routes for the frontend dashboard
 */

const express = require('express');
const router  = express.Router();
const { store, updateMessage, logActivity } = require('../store');

// GET  /api/messages          — fetch all messages (newest first)
router.get('/', (req, res) => {
  const { platform, status, q } = req.query;
  let msgs = [...store.messages];

  if (platform && platform !== 'All') msgs = msgs.filter((m) => m.platform === platform);
  if (status   && status   !== 'All') msgs = msgs.filter((m) => m.status   === status);
  if (q) {
    const query = q.toLowerCase();
    msgs = msgs.filter(
      (m) => m.senderName?.toLowerCase().includes(query) || m.original?.toLowerCase().includes(query)
    );
  }

  res.json({ success: true, count: msgs.length, messages: msgs });
});

// GET  /api/messages/stats    — live stat counts
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      ...store.stats,
      totalMessages:  store.messages.length,
      queueLength:    store.reviewQueue.length,
      activityCount:  store.activity.length,
    },
  });
});

// GET  /api/messages/activity — live activity feed
router.get('/activity', (req, res) => {
  res.json({ success: true, activity: store.activity.slice(0, 20) });
});

module.exports = router;
