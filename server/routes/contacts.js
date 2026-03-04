/**
 * /api/contacts  — VIP Contact management
 */

const express = require('express');
const router  = express.Router();
const { store } = require('../store');

// GET    /api/contacts          — list all contacts
router.get('/', (req, res) => {
  res.json({ success: true, contacts: store.contacts });
});

// POST   /api/contacts          — add a new contact
router.post('/', (req, res) => {
  const { name, phone, platform, tag, directive, autoApprove } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  const contact = {
    id:          `c_${Date.now()}`,
    name:        name.trim(),
    phone:       phone   || null,
    platform:    platform || 'WhatsApp',
    tag:         tag      || 'General',
    directive:   directive || '',
    autoApprove: autoApprove ?? false,
  };

  store.contacts.push(contact);
  res.status(201).json({ success: true, contact });
});

// PATCH  /api/contacts/:id      — update directive or autoApprove
router.patch('/:id', (req, res) => {
  const { id }      = req.params;
  const idx         = store.contacts.findIndex((c) => c.id === id);

  if (idx === -1) return res.status(404).json({ success: false, message: 'Contact not found' });

  const { directive, autoApprove, tag, phone } = req.body;

  if (directive   !== undefined) store.contacts[idx].directive   = directive;
  if (autoApprove !== undefined) store.contacts[idx].autoApprove = autoApprove;
  if (tag         !== undefined) store.contacts[idx].tag         = tag;
  if (phone       !== undefined) store.contacts[idx].phone       = phone;

  res.json({ success: true, contact: store.contacts[idx] });
});

// DELETE /api/contacts/:id      — remove a contact
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  store.contacts = store.contacts.filter((c) => c.id !== id);
  res.json({ success: true });
});

module.exports = router;
