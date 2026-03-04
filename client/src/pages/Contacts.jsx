import { useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { fetchContacts, updateContact, createContact, deleteContact } from '../services/api'
import { useLiveData } from '../hooks/useLiveData'

const TAG_COLORS = {
  Family:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  Client:  { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  Friend:  { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6' },
  Work:    { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  General: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
}
const AVATAR_COLORS = ['#7c3aed','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4','#8b5cf6','#f97316']
const avatarColor = (str) => AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

// ─── Add Contact Modal ─────────────────────────────────────────────────
function AddModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', platform: 'WhatsApp', tag: 'General', directive: '', autoApprove: false })
  const [busy, setBusy] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setBusy(true)
    try {
      await createContact(form)
      onSave()
    } catch (err) {
      alert('Failed to add contact: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: 480, maxWidth: '95vw' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 20 }}>Add VIP Contact</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="new-name" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
            <input id="new-phone" placeholder="Phone (+91…)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['platform', 'tag'].map(field => (
              <select key={field} id={`new-${field}`} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                {field === 'platform' ? ['WhatsApp','Instagram','Facebook'].map(p => <option key={p}>{p}</option>)
                                      : ['Family','Friend','Client','Work','General'].map(t => <option key={t}>{t}</option>)}
              </select>
            ))}
          </div>
          <textarea
            id="new-directive"
            placeholder="Directive — how should AutoPilot respond to this person?"
            value={form.directive}
            onChange={e => setForm(f => ({ ...f, directive: e.target.value }))}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="switch">
              <input id="new-autoapprove" type="checkbox" checked={form.autoApprove} onChange={e => setForm(f => ({ ...f, autoApprove: e.target.checked }))} />
              <span className="switch-slider" />
            </label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-approve replies from this contact</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" id="save-contact-btn" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving…' : 'Add Contact'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────
export default function Contacts() {
  const fetcher = useCallback(fetchContacts, [])
  const { data, loading, refresh } = useLiveData(fetcher, 8000)
  const contacts = data?.contacts || []

  const [editing,    setEditing]    = useState(null)
  const [editDir,    setEditDir]    = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [busy,       setBusy]       = useState({})

  const saveDirective = async (c) => {
    setBusy(b => ({ ...b, [c.id]: true }))
    try {
      await updateContact(c.id, { directive: editDir })
      refresh()
      setEditing(null)
    } catch (err) { alert('Save failed: ' + err.message) }
    finally { setBusy(b => { const n = { ...b }; delete n[c.id]; return n }) }
  }

  const toggleAutoApprove = async (c) => {
    setBusy(b => ({ ...b, [c.id]: true }))
    try {
      await updateContact(c.id, { autoApprove: !c.autoApprove })
      refresh()
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setBusy(b => { const n = { ...b }; delete n[c.id]; return n }) }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Remove "${c.name}" from VIP contacts?`)) return
    try {
      await deleteContact(c.id)
      refresh()
    } catch (err) { alert('Delete failed: ' + err.message) }
  }

  return (
    <div className="fade-in">
      {showModal && <AddModal onSave={() => { refresh(); setShowModal(false) }} onClose={() => setShowModal(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600 }}>VIP Contact Directives</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Custom instructions for how AutoPilot responds to each person.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" id="refresh-contacts-btn" onClick={refresh} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" id="add-contact-btn" onClick={() => setShowModal(true)} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {loading && (
        <div className="contacts-grid">
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: '60%', height: 15, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: '80%', height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && contacts.length === 0 && (
        <div className="empty-state">
          <Plus size={40} style={{ opacity: 0.3 }} />
          <h3>No VIP Contacts yet</h3>
          <p>Add contacts to set custom AI response directives for each person.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add First Contact</button>
        </div>
      )}

      <div className="contacts-grid">
        {!loading && contacts.map((c) => {
          const tagColor = TAG_COLORS[c.tag] || TAG_COLORS.General
          return (
            <div className="contact-card fade-in" key={c.id}>
              <div className="contact-top">
                <div className="contact-avatar" style={{ background: avatarColor(c.name) }}>{(c.name || '?')[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-handle">{c.phone || 'No phone'} · {c.platform}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: tagColor.bg, color: tagColor.text, display: 'inline-block', marginTop: 4 }}>
                    {c.tag}
                  </span>
                </div>
                <button onClick={() => handleDelete(c)} id={`del-${c.id}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>📋 Directive</div>

              {editing === c.id ? (
                <textarea
                  id={`dir-edit-${c.id}`}
                  value={editDir}
                  onChange={e => setEditDir(e.target.value)}
                  style={{
                    width: '100%', minHeight: 80, padding: '10px 12px',
                    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                    fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none', marginBottom: 10,
                  }}
                />
              ) : (
                <div className="directive-box">"{c.directive || 'No directive set.'}"</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Auto-Approve Replies</span>
                <label className="switch" style={{ cursor: busy[c.id] ? 'wait' : 'pointer' }}>
                  <input id={`aa-${c.id}`} type="checkbox" checked={!!c.autoApprove} onChange={() => !busy[c.id] && toggleAutoApprove(c)} />
                  <span className="switch-slider" />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {editing === c.id ? (
                  <>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} id={`save-dir-${c.id}`}
                      onClick={() => saveDirective(c)} disabled={!!busy[c.id]}>
                      {busy[c.id] ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    id={`edit-dir-${c.id}`} onClick={() => { setEditing(c.id); setEditDir(c.directive || '') }}>
                    <Edit2 size={13} /> Edit Directive
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
