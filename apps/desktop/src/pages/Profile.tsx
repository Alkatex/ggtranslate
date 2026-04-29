import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'
import { getAvailableLanguages } from '../lib/languages'

const AVATARS = [
  { id: 0, emoji: '🎮', bg: 'linear-gradient(135deg, #3b82f6, #06b6d4)', label: 'Gamer' },
  { id: 1, emoji: '🔫', bg: 'linear-gradient(135deg, #ef4444, #f97316)', label: 'Sniper' },
  { id: 2, emoji: '🛡️', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', label: 'Tank' },
  { id: 3, emoji: '⚡', bg: 'linear-gradient(135deg, #f59e0b, #eab308)', label: 'Speedrun' },
  { id: 4, emoji: '🧙', bg: 'linear-gradient(135deg, #8b5cf6, #a855f7)', label: 'Mage' },
  { id: 5, emoji: '🏹', bg: 'linear-gradient(135deg, #22c55e, #16a34a)', label: 'Archer' },
  { id: 6, emoji: '🤖', bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', label: 'Robot' },
  { id: 7, emoji: '🐉', bg: 'linear-gradient(135deg, #dc2626, #9333ea)', label: 'Dragon' },
  { id: 8, emoji: '👾', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)', label: 'Alien' },
  { id: 9, emoji: '🦊', bg: 'linear-gradient(135deg, #f97316, #ef4444)', label: 'Renard' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, plan } = useAuthStore()
  const LANGUAGES = getAvailableLanguages('pro')

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [mainLanguage, setMainLanguage] = useState('fr')
  const [avatarId, setAvatarId] = useState(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [totalPhrases, setTotalPhrases] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)

  const planColor = plan === 'pro' ? '#a855f7' : plan === 'starter' ? '#3b82f6' : plan === 'trial' ? '#06b6d4' : '#64748b'
  const planLabel = plan === 'pro' ? '⚡ PRO' : plan === 'starter' ? '🚀 STARTER' : plan === 'trial' ? '⭐ TRIAL' : '🆓 FREE'
  const currentAvatar = AVATARS[avatarId] || AVATARS[0]

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
      setAvatarId(data.avatar_id || 0)
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
        avatar_id: avatarId,
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
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .avatar-option:hover { transform: scale(1.1); border-color: #06b6d4 !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1e2d45', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px' }}>MON PROFIL</div>
        </div>
        <button onClick={() => navigate('/translate')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Traducteur</button>
      </div>

      {/* AVATAR + INFO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: currentAvatar.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', cursor: 'pointer',
              border: '3px solid rgba(6,182,212,0.4)',
              transition: 'all 0.2s',
              boxShadow: '0 0 20px rgba(6,182,212,0.2)',
            }}
          >
            {currentAvatar.emoji}
          </div>
          <div style={{
            position: 'absolute', bottom: '-4px', right: '-4px',
            background: '#06b6d4', borderRadius: '50%',
            width: '22px', height: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', cursor: 'pointer', border: '2px solid #06080f',
          }} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            ✏️
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif', marginBottom: '4px' }}>
            {username || user?.email?.split('@')[0] || 'Joueur'}
          </div>
          <div style={{ color: '#475569', fontSize: '12px', marginBottom: '8px' }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ background: `${planColor}22`, color: planColor, padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${planColor}44` }}>
              {planLabel}
            </span>
            <span style={{ color: '#475569', fontSize: '11px' }}>{currentAvatar.label}</span>
          </div>
        </div>
      </div>

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div style={{
          background: '#0d1424', border: '1px solid #1e2d45',
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
          animation: 'pop 0.2s ease',
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '16px' }}>
            🎭 CHOISIS TON AVATAR
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {AVATARS.map(avatar => (
              <div
                key={avatar.id}
                className="avatar-option"
                onClick={() => { setAvatarId(avatar.id); setShowAvatarPicker(false) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: avatar.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                  border: `2px solid ${avatarId === avatar.id ? '#06b6d4' : 'transparent'}`,
                  boxShadow: avatarId === avatar.id ? '0 0 12px rgba(6,182,212,0.5)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {avatar.emoji}
                </div>
                <span style={{ color: avatarId === avatar.id ? '#06b6d4' : '#475569', fontSize: '10px', fontFamily: 'Orbitron, sans-serif' }}>
                  {avatar.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#06b6d4', fontSize: '28px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{totalPhrases}</div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>🗣️ Phrases traduites</div>
        </div>
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#a855f7', fontSize: '28px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{totalSessions}</div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>🎮 Sessions jouées</div>
        </div>
      </div>

      {/* FORMULAIRE */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '16px', padding: '24px' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '20px' }}>
          ✏️ MODIFIER MON PROFIL
        </div>

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