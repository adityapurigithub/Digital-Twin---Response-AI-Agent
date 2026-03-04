/**
 * AutoPilot AI — Frontend API Client
 * All backend communication goes through this file.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Health ──────────────────────────────────────────────────────────
export const fetchHealth = () => request('/health');

// ─── Messages ────────────────────────────────────────────────────────
export const fetchMessages = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/api/messages${q ? `?${q}` : ''}`);
};
export const fetchStats    = () => request('/api/messages/stats');
export const fetchActivity = () => request('/api/messages/activity');

// ─── Review Queue ────────────────────────────────────────────────────
export const fetchReviewQueue  = ()                        => request('/api/review');
export const approveReview     = (id, editedDraft = null)  =>
  request(`/api/review/${id}/approve`, {
    method: 'POST',
    body:   JSON.stringify({ editedDraft }),
  });
export const dismissReview     = (id) =>
  request(`/api/review/${id}/dismiss`, { method: 'POST' });

// ─── Contacts ────────────────────────────────────────────────────────
export const fetchContacts    = ()                => request('/api/contacts');
export const createContact    = (data)            => request('/api/contacts', { method: 'POST', body: JSON.stringify(data) });
export const updateContact    = (id, data)        => request(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteContact    = (id)              => request(`/api/contacts/${id}`, { method: 'DELETE' });

// ─── Simulate ────────────────────────────────────────────────────────
export const simulate = (data) =>
  request('/api/simulate', { method: 'POST', body: JSON.stringify(data) });
