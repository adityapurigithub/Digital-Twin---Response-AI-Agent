import { useState } from 'react'
import { Bot, Shield, Zap, Bell, MessageSquare, Key } from 'lucide-react'

function Toggle({ id, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="switch">
      <input id={id} type="checkbox" checked={on} onChange={() => setOn(p => !p)} />
      <span className="switch-slider" />
    </label>
  )
}

function SettingRow({ label, desc, id, defaultChecked }) {
  return (
    <div className="settings-item">
      <div>
        <div className="settings-label">{label}</div>
        {desc && <div className="settings-desc">{desc}</div>}
      </div>
      <Toggle id={id} defaultChecked={defaultChecked} />
    </div>
  )
}

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(85)
  const [persona,   setPersona]   = useState('WhatsApp Casual')

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>

      {/* AI Engine */}
      <div className="settings-section">
        <div className="settings-header">
          <Bot size={16} color="var(--accent-violet)" />
          <h3>AI Engine</h3>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-label">Confidence Threshold</div>
            <div className="settings-desc">
              Messages below <strong style={{ color:'var(--accent-amber)' }}>{threshold}%</strong> go to Review Queue.
            </div>
          </div>
          <input
            id="confidence-threshold"
            type="range" min={50} max={99}
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            style={{ width:140, accentColor:'var(--accent-violet)' }}
          />
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-label">Active Persona</div>
            <div className="settings-desc">The tone the AI uses when composing replies.</div>
          </div>
          <select
            id="persona-select"
            value={persona}
            onChange={e => setPersona(e.target.value)}
            style={{
              background:'var(--bg-elevated)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', color:'var(--text-primary)',
              padding:'7px 12px', fontSize:13, fontFamily:'var(--font-sans)',
              outline:'none', cursor:'pointer',
            }}
          >
            <option>WhatsApp Casual</option>
            <option>Instagram Trendy</option>
            <option>Professional / Work</option>
            <option>Custom (trained on my chats)</option>
          </select>
        </div>

        <SettingRow id="ai-personatrain" label="Auto-Train Persona" desc="Continuously learn from your approved replies to improve style matching." defaultChecked={true} />
        <SettingRow id="ai-sentiment"    label="Sentiment Detection" desc="Detect emotional tone in incoming messages to adjust confidence scoring."  defaultChecked={true} />
      </div>

      {/* Platforms */}
      <div className="settings-section">
        <div className="settings-header">
          <MessageSquare size={16} color="var(--accent-green)" />
          <h3>Platform Connections</h3>
        </div>

        {[
          { label:'WhatsApp', desc:'Connected via Twilio API',                   id:'platform-wa', on:true  },
          { label:'Instagram DM', desc:'Not connected — click to configure',      id:'platform-ig', on:false },
          { label:'Facebook Messenger', desc:'Not connected — click to configure', id:'platform-fb', on:false },
        ].map(({ label, desc, id, on }) => (
          <div className="settings-item" key={id}>
            <div>
              <div className="settings-label">{label}</div>
              <div className="settings-desc">{desc}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className={`badge ${on ? 'badge-green' : 'badge-red'}`}>{on ? 'Connected' : 'Disconnected'}</span>
              <Toggle id={id} defaultChecked={on} />
            </div>
          </div>
        ))}
      </div>

      {/* Notifications & DND */}
      <div className="settings-section">
        <div className="settings-header">
          <Bell size={16} color="var(--accent-amber)" />
          <h3>Notifications & DND</h3>
        </div>
        <SettingRow id="notif-review"   label="Notify on Review Queue"     desc="Get an in-app alert when a new message enters your Review Queue."  defaultChecked={true} />
        <SettingRow id="notif-urgent"   label="Breakthrough Keyword Alert" desc="Trigger alert when a contact types 'URGENT' during DND mode."        defaultChecked={true} />
        <SettingRow id="notif-summary"  label="Morning Executive Summary"  desc="Generate a daily briefing card at 8:00 AM on your dashboard."        defaultChecked={true} />
      </div>

      {/* Security */}
      <div className="settings-section">
        <div className="settings-header">
          <Key size={16} color="var(--accent-red)" />
          <h3>API Keys</h3>
        </div>
        {[
          { label:'OpenAI API Key',   id:'key-openai',  placeholder: 'sk-••••••••••••••••••' },
          { label:'Twilio SID',       id:'key-twilio',  placeholder: 'AC••••••••••••••••••' },
          { label:'Twilio Auth Token', id:'key-twilio-token', placeholder: '••••••••••••••••••' },
        ].map(({ label, id, placeholder }) => (
          <div className="settings-item" key={id}>
            <div className="settings-label">{label}</div>
            <input
              id={id}
              type="password"
              placeholder={placeholder}
              style={{
                background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)', color:'var(--text-primary)',
                padding:'7px 12px', fontSize:13, fontFamily:'var(--font-sans)',
                outline:'none', width:230,
              }}
            />
          </div>
        ))}
        <div style={{ padding:'16px 20px' }}>
          <button className="btn btn-primary btn-sm" id="save-keys-btn">Save API Keys</button>
        </div>
      </div>

    </div>
  )
}
