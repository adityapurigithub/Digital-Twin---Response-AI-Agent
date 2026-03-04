import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { fetchMessages } from '../services/api'
import { useLiveData } from '../hooks/useLiveData'

const PLATFORMS = ['All', 'WhatsApp', 'Instagram', 'Facebook']
const STATUSES  = ['All', 'auto-sent', 'pending', 'dismissed']

function ConfidenceBar({ value }) {
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="confidence-bar">
      <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '40%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '80%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

const AVATAR_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316']
const avatarColor = (str) => AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

export default function Messages() {
  const [search,   setSearch]   = useState('')
  const [platform, setPlatform] = useState('All')
  const [status,   setStatus]   = useState('All')

  const fetcher = useCallback(() => fetchMessages({
    ...(platform !== 'All' ? { platform } : {}),
    ...(status   !== 'All' ? { status   } : {}),
    ...(search              ? { q: search } : {}),
  }), [platform, status, search])

  const { data, loading, error } = useLiveData(fetcher, 4000)
  const messages = data?.messages || []

  const inputStyle = {
    width: '100%', padding: '9px 12px 9px 36px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
  }

  return (
    <div className="fade-in">

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex:1, minWidth: 250 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input id="msg-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…" style={inputStyle} />
        </div>

        <div className="tab-bar" style={{ margin: 0,flex:1 }}>
          {PLATFORMS.map(p => (
            <button key={p} className={`tab-item${platform === p ? ' active' : ''}`} id={`plat-${p.toLowerCase()}`} onClick={() => setPlatform(p)}>{p}</button>
          ))}
        </div>

        
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          ❌ Could not connect to server: {error}. Make sure the backend is running on port 3001.
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Messages ({loading ? '…' : messages.length})</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
         <div className="tab-bar" style={{ margin: 0 }}>
          {STATUSES.map(s => (
            <button key={s} className={`tab-item${status === s ? ' active' : ''}`} id={`status-${s.replace('-', '')}`} onClick={() => setStatus(s)}>
              {s === 'All' ? 'All' : s === 'auto-sent' ? '✓ Auto-Sent' : s === 'pending' ? '⌛ Review' : '✗ Dismissed'}
            </button>
          ))}
        </div>
          <span className="badge badge-purple">Live</span>
      </div>
       </div>
        
        <div style={{ padding: '0 20px' }}>
          {loading && [1, 2, 3, 4].map(i => <Skeleton key={i} />)}

          {!loading && messages.length === 0 && (
            <div className="empty-state">
              <Search size={40} />
              <h3>No messages found</h3>
              <p>Try adjusting filters or simulate a message from the Dashboard.</p>
            </div>
          )}

          {!loading && messages.map((m, i) => (
            <div className="msg-item fade-in" key={m.id || i}>
              <div className="msg-avatar" style={{ background: avatarColor(m.senderName) }}>
                {(m.senderName || '?')[0]}
              </div>
              <div className="msg-meta">
                <div className="msg-header">
                  <span className="msg-name">{m.senderName}</span>
                  <span className={`msg-platform platform-${(m.platform || '').toLowerCase()}`}>{m.platform}</span>
                  <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="msg-preview" title={m.original}>{m.original}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                  💬 Draft: "{m.draft}"
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {m.status === 'auto-sent'
                    ? <span className="badge badge-green">✓ Auto-Sent</span>
                    : m.status === 'dismissed'
                      ? <span className="badge badge-red">✗ Dismissed</span>
                      : <span className="badge badge-amber">⌛ Needs Review</span>
                  }
                  <span style={{ fontSize: 11, color: m.confidence >= 90 ? 'var(--accent-green)' : m.confidence >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {m.confidence}% confidence
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{m.intent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
