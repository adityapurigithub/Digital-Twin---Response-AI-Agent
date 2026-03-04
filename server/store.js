/**
 * AutoPilot AI — In-Memory Store
 * Acts as the database layer. When you add MongoDB/Postgres,
 * just swap out these helpers and keep the same interface.
 */

const store = {
  // All incoming messages with their processing state
  messages: [],

  // Review queue — messages that need manual approval
  reviewQueue: [],

  // VIP contact directives
  contacts: [
    {
      id: 'test_user',
      name: 'My Test Number',
      platform: 'WhatsApp',
      phone: '+9288123333', // <--- REPLACE THIS WITH YOUR ACTUAL WHATSAPP NUMBER (including country code)
      tag: 'Tester',
      directive: 'Always reply enthusiastically and confirm that the auto-reply test is successful.',
      autoApprove: true, // This bypasses the review queue and guarantees an auto-reply
    },
    {
      id: 'c1',
      name: 'Mom',
      platform: 'WhatsApp',
      phone: null,
      tag: 'Family',
      directive: "Always reply warmly and politely in Hinglish (Hindi + English). Call her 'Mummy'. Tell her I'm doing great. Example: 'Haan mummy kha liya, sab theek hai.' If she asks why I haven't called, say I'll call tonight.",
      autoApprove: true,
    },
    {
      id: 'c2',
      name: 'Default',
      platform: 'all',
      phone: null,
      tag: 'General',
      directive: 'Be helpful, friendly, and casual. Match their language: if they type in Hinglish or Hindi, reply in Hinglish. Keep replies short and natural. Sound like Aditya.',
      autoApprove: true,
    },
  ],

  // Persona corpus (lines of "how Aditya writes")
  persona: [
    "Keep replies short, punchy, and real. Matches the language of the sender.",
    "Fluent in Hinglish (Hindi written in English alphabet) and uses it naturally.",
    "Uses words like 'haan yaar', 'bhai', 'scene kya hai', 'arrey', 'theek hai' naturally in casual chats.",
    "For work/client messages: strictly professional, concise English, always include a clear next step or ETA.",
    "For family: warm, loving, comforting (mostly Hinglish). Never sound robotic.",
    "Never say 'I apologize', 'I am an AI', or 'Namaste'. Just sound like a normal human texting.",
  ],

  // Activity log
  activity: [],

  // Stats
  stats: {
    totalReplied: 0,
    autoSent: 0,
    needsReview: 0,
  },
};

// ─── Message helpers ───────────────────────────────────────────────
function addMessage(msg) {
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...msg,
  };
  store.messages.unshift(message); // newest first
  if (store.messages.length > 200) store.messages.pop(); // cap at 200
  return message;
}

function updateMessage(id, updates) {
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx !== -1) {
    store.messages[idx] = { ...store.messages[idx], ...updates };
    return store.messages[idx];
  }
  return null;
}

// ─── Review Queue helpers ──────────────────────────────────────────
function addToReviewQueue(entry) {
  store.reviewQueue.unshift(entry);
  store.stats.needsReview = store.reviewQueue.length;
  return entry;
}

function removeFromReviewQueue(id) {
  store.reviewQueue = store.reviewQueue.filter((e) => e.id !== id);
  store.stats.needsReview = store.reviewQueue.length;
}

// ─── Contact helpers ───────────────────────────────────────────────
function findContactByPhone(phone) {
  return store.contacts.find(
    (c) => c.phone === phone || c.phone === null
  );
}

function findContactByName(name) {
  return store.contacts.find((c) =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );
}

// ─── Activity log helpers ──────────────────────────────────────────
function logActivity(icon, text, sub) {
  store.activity.unshift({
    id: `act_${Date.now()}`,
    icon,
    text,
    sub,
    time: new Date().toISOString(),
  });
  if (store.activity.length > 50) store.activity.pop();
}

module.exports = {
  store,
  addMessage,
  updateMessage,
  addToReviewQueue,
  removeFromReviewQueue,
  findContactByPhone,
  findContactByName,
  logActivity,
};
