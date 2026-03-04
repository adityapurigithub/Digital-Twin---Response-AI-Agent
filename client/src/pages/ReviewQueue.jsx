import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, Edit3, AlertTriangle, RefreshCw } from 'lucide-react'
import { fetchReviewQueue, approveReview, dismissReview } from '../services/api'
import { useLiveData } from '../hooks/useLiveData'

const AVATAR_COLORS = ['#7c3aed','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4','#8b5cf6','#f97316']
const avatarColor = (str) => AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

export default function ReviewQueue() {
  const fetcher = useCallback(fetchReviewQueue, [])
  const { data, loading, error, refresh } = useLiveData(fetcher, 4000)

  const [editing,   setEditing]   = useState(null)  // item id being edited
  const [editText,  setEditText]  = useState('')
  const [busy,      setBusy]      = useState({})    // { [id]: 'approving' | 'dismissing' }

  const queue = data?.queue || []

  const handleApprove = async (item) => {
    const finalDraft = editing === item.id ? editText : null
    setBusy(b => ({ ...b, [item.id]: 'approving' }))
    try {
      await approveReview(item.id, finalDraft)
      setEditing(null)
      refresh()
    } catch (err) {
      alert(`Failed to approve: ${err.message}`)
    } finally {
      setBusy(b => { const n = { ...b }; delete n[item.id]; return n })
    }
  }

  const handleDismiss = async (item) => {
    setBusy(b => ({ ...b, [item.id]: 'dismissing' }))
    try {
      await dismissReview(item.id)
      refresh()
    } catch (err) {
      alert(`Failed to dismiss: ${err.message}`)
    } finally {
      setBusy(b => { const n = { ...b }; delete n[item.id]; return n })
    }
  }

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)',
      }}>
        <AlertTriangle size={18} color="var(--accent-amber)" />
        <span style={{ flex: 1 }}>
          {loading
            ? 'Loading review queue…'
            : queue.length > 0
              ? <>These <strong style={{ color: 'var(--accent-amber)' }}>{queue.length} messages</strong> were flagged because AI confidence was below threshold or the message was sensitive. Review, edit, and approve — or dismiss.</>
              : 'No messages pending review. New flagged messages will appear here automatically.'
          }
        </span>
        <button className="btn btn-ghost btn-sm" id="refresh-queue-btn" onClick={refresh} style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          ❌ Backend error: {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && [1, 2].map(i => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: '40%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ width: '60%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      ))}

      {/* Empty */}
      {!loading && queue.length === 0 && (
        <div className="empty-state">
          <CheckCircle size={48} color="var(--accent-green)" style={{ opacity: 0.6 }} />
          <h3>All clear! 🎉</h3>
          <p>No messages waiting for review. Simulate one from the Dashboard to test.</p>
        </div>
      )}

      {/* Queue items */}
      {!loading && queue.map((item) => (
        <div className="review-card fade-in" key={item.id}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="msg-avatar" style={{
              background: avatarColor(item.name), width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'white', fontSize: 17, flexShrink: 0,
            }}>
              {(item.name || '?')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                <span className={`msg-platform platform-${(item.platform || '').toLowerCase()}`}>{item.platform}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-amber">🧠 Confidence: {item.confidence}%</span>
                {item.sentiment && <span className="badge badge-red">⚠ {item.sentiment}</span>}
              </div>
            </div>
          </div>

          {/* Original */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>📩 Incoming Message</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              "{item.original}"
            </div>
          </div>

          {/* AI Draft */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>🤖 AI Draft Reply</div>
            {editing === item.id ? (
              <textarea
                id={`edit-draft-${item.id}`}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                style={{
                  width: '100%', minHeight: 80, padding: '12px 14px',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.6, fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none',
                }}
              />
            ) : (
              <div className="review-draft">"{item.draft}"</div>
            )}
          </div>

          {/* Reason */}
          {item.reason && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic' }}>
              💡 Why flagged: {item.reason}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {editing === item.id ? (
              <>
                <button className="btn btn-primary btn-sm" id={`save-${item.id}`} onClick={() => setEditing(null)}>
                  ✓ Done Editing
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" id={`edit-${item.id}`}
                onClick={() => { setEditing(item.id); setEditText(item.draft) }}
                style={{ display: 'flex', gap: 6, alignItems: 'center' }}
              >
                <Edit3 size={13} /> Edit Draft
              </button>
            )}

            <button
              className="btn btn-success btn-sm"
              id={`approve-${item.id}`}
              disabled={!!busy[item.id]}
              onClick={() => handleApprove(item)}
              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <CheckCircle size={13} />
              {busy[item.id] === 'approving' ? 'Sending…' : 'Approve & Send'}
            </button>

            <button
              className="btn btn-danger btn-sm"
              id={`dismiss-${item.id}`}
              disabled={!!busy[item.id]}
              onClick={() => handleDismiss(item)}
              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <XCircle size={13} />
              {busy[item.id] === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
