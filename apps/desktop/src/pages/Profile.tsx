import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'
import { getAvailableLanguages } from '../lib/languages'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, plan } = useAuthStore()
  const LANGUAGES = getAvailableLanguages('pro')

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [mainLanguage, setMainLanguage] = useState('fr')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [totalPhrases, setTotalPhrases] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)

  const planColor = plan === 'pro' ? '#a855f7' : plan === 'starter' ? '#3b82f6' : plan === 'trial' ? '#06b6d4' : '#64748b'
  const planLabel = plan === 'pro' ? '⚡ PRO' : plan === 'starter' ? '🚀 STARTER' : plan === 'trial' ? '⭐ TRIAL' : '🆓 FREE'

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setUsername(data.username || '')
      setBio(data.bio || '')
      setMainLanguage(data.main_language || 'fr')
      setTotalPhrases(data.total_phrases || 0)
      setTotalSessions(data.total_sessions || 0)
    }
  }

  async function saveProfile() {
    if (!user) return
    setIsSaving(true)
    setSaveMsg('')

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username.trim() || null,
        bio: bio.trim() || null,
        main_language: mainLanguage,
      })

    setIsSaving(false)
    if (error) {
      setSaveMsg('❌ ' + (error.message.includes('unique') ? 'Ce pseudo est déjà pris' : error.message))
    } else {
      setSaveMsg('✅ Profil sauvegardé !')
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '0 24px 24px',
      maxWidth: '800px', margin: '0 auto',
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1e2d45', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px' }}>MON PROFIL</div>
        </div>
        <button onClick={() => navigate('/translate')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Traducteur</button>
      </div>

      {/* AVATAR + PLAN */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', flexShrink: 0,
        }}>
          🎮
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif', marginBottom: '4px' }}>
            {username || user?.email?.split('@')[0] || 'Joueur'}
          </div>
          <div style={{ color: '#475569', fontSize: '12px', marginBottom: '8px' }}>{user?.email}</div>
          <span style={{ background: `${planColor}22`, color: planColor, padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${planColor}44` }}>
            {planLabel}
          </span>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#06b6d4', fontSize: '28px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{totalPhrases}</div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>Phrases traduites</div>
        </div>
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#a855f7', fontSize: '28px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{totalSessions}</div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>Sessions jouées</div>
        </div>
      </div>

      {/* FORMULAIRE */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '20px' }}>
          ✏️ MODIFIER MON PROFIL
        </div>

        {/* USERNAME */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Pseudo</div>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="MonPseudo123"
            maxLength={30}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1e2d45',
              color: '#fff', padding: '10px 14px', borderRadius: '8px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ color: '#334155', fontSize: '10px', marginTop: '4px' }}>{username.length}/30</div>
        </div>

        {/* BIO */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Bio</div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Joueur passionné de FPS..."
            maxLength={150}
            rows={3}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1e2d45',
              color: '#fff', padding: '10px 14px', borderRadius: '8px',
              fontSize: '14px', outline: 'none', resize: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
          <div style={{ color: '#334155', fontSize: '10px', marginTop: '4px' }}>{bio.length}/150</div>
        </div>

        {/* LANGUE PRINCIPALE */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Langue principale</div>
          <select
            value={mainLanguage}
            onChange={e => setMainLanguage(e.target.value)}
            style={{
              width: '100%', background: '#111827', border: '1px solid #1e2d45',
              color: '#fff', padding: '10px 14px', borderRadius: '8px',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>

        {/* SAVE */}
        <button
          onClick={saveProfile}
          disabled={isSaving}
          style={{
            width: '100%',
            background: isSaving ? '#1e2d45' : 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', color: '#fff', padding: '12px',
            borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? '⟳ Sauvegarde...' : '💾 Sauvegarder'}
        </button>

        {saveMsg && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '13px', color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>
            {saveMsg}
          </div>
        )}
      </div>
    </div>
  )
}