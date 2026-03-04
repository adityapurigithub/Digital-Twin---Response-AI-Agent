import { useCallback, useState } from 'react'
import { MessageSquare, Zap, Clock, Users, Bot, RefreshCw, Send, ChevronRight } from 'lucide-react'
import { fetchStats, fetchMessages, fetchActivity, fetchHealth, simulate } from '../services/api'
import { useLiveData } from '../hooks/useLiveData'

// ─── Helpers ─────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="confidence-bar">
      <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

function Skeleton({ w = '100%', h = 16, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'rgba(255,255,255,0.06)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

// ─── Simulate Panel ───────────────────────────────────────────────────
function SimulatePanel({ onSent }) {
  const [form,   setForm]   = useState({ name: '', message: '', platform: 'WhatsApp' })
  const [busy,   setBusy]   = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) return
    setBusy(true)
    setResult(null)
    try {
      const res = await simulate({ name: form.name || 'Test User', message: form.message, platform: form.platform })
      setResult(res)
      setForm(f => ({ ...f, message: '' }))
      onSent?.()
    } catch (err) {
      setResult({ error: err.message })
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
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title"><Send size={15} color="var(--accent-cyan)" /> Simulate Incoming Message</div>
        <span className="badge badge-blue">Test Mode</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="sim-name"
              placeholder="Sender name (optional)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select
              id="sim-platform"
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              style={{ ...inputStyle, width: 130, cursor: 'pointer' }}
            >
              <option>WhatsApp</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
          </div>
          <textarea
            id="sim-message"
            placeholder="Type an incoming message to simulate… e.g. 'What time is the meeting?'"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          />
          <button
            id="sim-submit"
            type="submit"
            className="btn btn-primary"
            disabled={busy}
            style={{ alignSelf: 'flex-end' }}
          >
            {busy ? '⌛ Processing...' : '🚀 Simulate & Process'}
          </button>
        </form>

        {result && !result.error && (
          <div style={{
            background: result.autoSent ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${result.autoSent ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
            borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: result.autoSent ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
              {result.autoSent ? '✅ Auto-Sent!' : '⌛ Added to Review Queue'}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>AI Draft:</strong> "{result.draft}"
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <span className="badge badge-purple">🧠 {result.confidence}% confidence</span>
              <span className="badge badge-blue">{result.sentiment}</span>
              <span className="badge badge-green">{result.intent}</span>
            </div>
          </div>
        )}
        {result?.error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--accent-red)' }}>
            ❌ {result.error}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, change, dir, color, grad, icon: Icon, loading }) {
  return (
    <div className="stat-card fade-in" style={{ '--grad': grad }}>
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <Icon size={20} color={color} />
      </div>
      {loading
        ? <><Skeleton w={60} h={28} /><Skeleton w={100} h={12} radius={4} style={{ marginTop: 6 }} /></>
        : <>
            <div className="stat-value">{value ?? '—'}</div>
            <div className="stat-label">{label}</div>
            {change && <div className={`stat-change ${dir}`}>{dir === 'up' ? '↑' : '↓'} {change}</div>}
          </>
      }
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function Dashboard({ dnd }) {
  const statFetcher     = useCallback(fetchStats,    [])
  const msgFetcher      = useCallback(() => fetchMessages({ limit: 6 }), [])
  const activityFetcher = useCallback(fetchActivity, [])
  const healthFetcher   = useCallback(fetchHealth,   [])

  const { data: statsData,    loading: statsLoading,    refresh: refreshStats    } = useLiveData(statFetcher,     4000)
  const { data: msgsData,     loading: msgsLoading                                } = useLiveData(msgFetcher,      4000)
  const { data: actData,      loading: actLoading                                  } = useLiveData(activityFetcher, 4000)
  const { data: healthData                                                          } = useLiveData(healthFetcher,   10000)

  const stats   = statsData?.stats     || {}
  const msgs    = msgsData?.messages   || []
  const activity= actData?.activity    || []
  const mode    = healthData?.mode     || 'demo'

  const STAT_CARDS = [
    { label: 'Total Replied',    value: stats.totalReplied,  change: null,           dir: 'up',   color: '#7c3aed', grad: 'var(--grad-purple)', icon: MessageSquare },
    { label: 'Auto-Sent',        value: stats.autoSent,      change: null,           dir: 'up',   color: '#10b981', grad: 'var(--grad-green)',  icon: Zap           },
    { label: 'Needs Review',     value: stats.needsReview,   change: null,           dir: 'down', color: '#f59e0b', grad: 'var(--grad-amber)',  icon: Clock         },
    { label: 'Total Messages',   value: stats.totalMessages, change: null,           dir: 'up',   color: '#06b6d4', grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)', icon: Users },
  ]

  const MOCK_AI_METRICS = [
    { label: 'Persona Match Accuracy', value: 94, color: 'var(--accent-violet)' },
    { label: 'Auto-Reply Rate',        value: stats.totalMessages > 0 ? Math.round((stats.autoSent / stats.totalMessages) * 100) || 0 : 0, color: 'var(--accent-green)' },
    { label: 'Sentiment Detection',    value: 91, color: 'var(--accent-blue)' },
    { label: 'VIP Rule Compliance',    value: 100, color: 'var(--accent-cyan)' },
  ]

  return (
    <div className="fade-in">

      {/* Mode Banner */}
      <div style={{
        background: mode === 'live'
          ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.08))'
          : 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(59,130,246,0.08))',
        border: `1px solid ${mode === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)'}`,
        borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 26 }}>{mode === 'live' ? '🚀' : '🎭'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
            {mode === 'live' ? 'AutoPilot AI is Live!' : 'Demo Mode — Add your API keys to go live'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {mode === 'live'
              ? `AutoPilot has handled ${stats.autoSent || 0} messages automatically. ${stats.needsReview || 0} messages need your review.`
              : 'OpenAI & Twilio are mocked. Add keys to .env in the server folder to activate real AI replies.'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {healthData?.services && Object.entries(healthData.services).map(([svc, status]) => (
            <span key={svc} className={`badge ${status.startsWith('✅') ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
              {svc}: {status.startsWith('✅') ? '✅' : '⚠'}
            </span>
          ))}
          <button className="btn btn-ghost btn-sm" id="refresh-btn" onClick={refreshStats} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CARDS.map(sc => <StatCard key={sc.label} {...sc} loading={statsLoading} />)}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Recent Messages */}
        <div className="card col-span-2 fade-in">
          <div className="card-header">
            <div className="card-title"><MessageSquare size={16} color="var(--accent-violet)" /> Recent Message Activity</div>
            <span className="badge badge-purple">Live</span>
          </div>
          <div style={{ padding: '0 20px' }}>
            {msgsLoading && [1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <Skeleton w={40} h={40} radius={99} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton w="40%" h={14} />
                  <Skeleton w="80%" h={12} />
                </div>
              </div>
            ))}
            {!msgsLoading && msgs.length === 0 && (
              <div className="empty-state">
                <MessageSquare size={40} />
                <h3>No messages yet</h3>
                <p>Use the Simulate panel below to fire your first test message!</p>
              </div>
            )}
            {!msgsLoading && msgs.map((m, i) => (
              <div className="msg-item" key={m.id || i}>
                <div className="msg-avatar" style={{ background: '#7c3aed' }}>{(m.senderName || '?')[0]}</div>
                <div className="msg-meta">
                  <div className="msg-header">
                    <span className="msg-name">{m.senderName}</span>
                    <span className={`msg-platform platform-${(m.platform || '').toLowerCase()}`}>{m.platform}</span>
                    <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="msg-preview" title={m.original}>{m.original}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Confidence: <strong style={{ color: m.confidence >= 90 ? 'var(--accent-green)' : m.confidence >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{m.confidence}%</strong></span>
                    <div style={{ flex: 1 }}><ConfidenceBar value={m.confidence} /></div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {m.status === 'auto-sent'
                      ? <span className="badge badge-green">✓ Auto-Sent</span>
                      : m.status === 'dismissed'
                        ? <span className="badge badge-red">✗ Dismissed</span>
                        : <span className="badge badge-amber">⌛ Awaiting Review</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title"><Zap size={16} color="var(--accent-amber)" /> Live Activity Feed</div>
            <span className="live-dot" />
          </div>
          <div className="card-body" style={{ padding: '10px 20px' }}>
            {actLoading && [1,2,3].map(i => <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}><Skeleton w="90%" h={13} /></div>)}
            {!actLoading && activity.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <Zap size={28} style={{ opacity: 0.3 }} />
                <p>Activity will appear here as messages are processed.</p>
              </div>
            )}
            <div className="activity-feed">
              {activity.map((a, i) => (
                <div className="activity-item" key={a.id || i}>
                  <div className="activity-dot" style={{ background: 'rgba(124,58,237,0.15)', fontSize: 15 }}>{a.icon}</div>
                  <div className="activity-content">
                    <div className="act-title">{a.text}</div>
                    <div className="act-sub">{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title"><Bot size={16} color="var(--accent-blue)" /> AI Engine Status</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MOCK_AI_METRICS.map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{value}%</span>
                </div>
                <div className="confidence-bar" style={{ height: 8 }}>
                  <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
            ))}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>Persona active</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {mode === 'live' ? 'Using GPT-4o-mini · Live mode' : 'Demo mode · Add OpenAI key to activate'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulate Panel */}
        <div className="col-span-2">
          <SimulatePanel onSent={refreshStats} />
        </div>

      </div>
    </div>
  )
}
