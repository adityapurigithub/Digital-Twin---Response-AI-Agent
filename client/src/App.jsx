import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, MessageSquare, Users, Clock, Settings, Bell, Search, Moon } from 'lucide-react'
import Dashboard    from './pages/Dashboard.jsx'
import Messages     from './pages/Messages.jsx'
import ReviewQueue  from './pages/ReviewQueue.jsx'
import Contacts     from './pages/Contacts.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { fetchStats } from './services/api.js'

function useLiveBadges() {
  const [stats, setStats] = useState({ queueLength: 0, totalMessages: 0 })
  useEffect(() => {
    const load = async () => {
      try { const d = await fetchStats(); setStats(d.stats || {}) } catch (_) {}
    }
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])
  return stats
}

function Sidebar({ dnd, setDnd }) {
  const stats = useLiveBadges()
  const NAV = [
    { to: '/',         icon: LayoutDashboard, label: 'Dashboard'              },
    { to: '/messages', icon: MessageSquare,   label: 'All Messages',  badge: stats.totalMessages || null },
    { to: '/review',   icon: Clock,           label: 'Review Queue',  badge: stats.queueLength   || null },
    { to: '/contacts', icon: Users,           label: 'VIP Contacts'           },
    { to: '/settings', icon: Settings,        label: 'Settings'               },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🤖</div>
        <div>
          <div className="logo-text">AutoPilot AI</div>
          <div className="logo-sub">Digital Twin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={17} />
            {label}
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className={`dnd-toggle${dnd ? ' active' : ''}`}
          onClick={() => setDnd(p => !p)}
          role="button" id="dnd-toggle-btn"
        >
          <Moon size={14} />
          {dnd ? 'DND On' : 'DND Off'}
          <div className="toggle-dot" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="user-card" style={{ marginTop: 10 }}>
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Aditya</div>
            <div className="user-status">Online</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ dnd }) {
  const location = useLocation()
  const titles = { '/': 'Dashboard', '/messages': 'All Messages', '/review': 'Review Queue', '/contacts': 'VIP Contacts', '/settings': 'Settings' }
  const title = titles[location.pathname] || 'Dashboard'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        <p>{dnd ? '🌙 Do Not Disturb — AutoPilot is handling all messages' : '✅ Active — monitoring all platforms'}</p>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" id="search-btn" aria-label="Search"><Search size={16} /></button>
        <button className="topbar-btn" id="notif-btn"  aria-label="Notifications"><Bell size={16} /></button>
        <div style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:8,padding:'6px 12px' }}>
          <span className="live-dot" />
          <span style={{ fontSize:12,color:'var(--accent-green)',fontWeight:600 }}>AI Live</span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [dnd, setDnd] = useState(false)
  return (
    <BrowserRouter>
      <div className="app-layout">
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <Sidebar dnd={dnd} setDnd={setDnd} />
        <div className="main-content">
          <TopBar dnd={dnd} />
          <main className="page">
            <Routes>
              <Route path="/"         element={<Dashboard  dnd={dnd} />} />
              <Route path="/messages" element={<Messages />}              />
              <Route path="/review"   element={<ReviewQueue />}           />
              <Route path="/contacts" element={<Contacts />}              />
              <Route path="/settings" element={<SettingsPage />}          />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
