import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAppLanguage } from '../store/appLanguage'
import { supabase } from '../lib/supabase'
import { getAvailableLanguages } from '../lib/languages'
import { motion, AnimatePresence } from 'motion/react'
import tokens from '../styles/tokens'

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
  const { t } = useAppLanguage()
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

  const planColor = plan === 'pro' ? tokens.colors.planPro : plan === 'starter' ? tokens.colors.planStarter : plan === 'trial' ? tokens.colors.planTrial : tokens.colors.planFree
  const planLabel = plan === 'pro' ? '⚡ PRO' : plan === 'starter' ? '🚀 STARTER' : plan === 'trial' ? '⭐ TRIAL' : '🆓 FREE'
  const currentAvatar = AVATARS[avatarId] || AVATARS[0]

  useEffect(() => { loadProfile() }, [])

  // ─── FIX: Recharge le profil quand la fenêtre reprend le focus ───────────
  // Nécessaire après OCR (mainWindow.hide → show) qui reset avatar/data
  useEffect(() => {
    const handleFocus = () => { loadProfile() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  async function loadProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setUsername(data.username || '')
      setBio(data.bio || '')
      setMainLanguage(data.main_language || 'fr')
      setAvatarId(data.avatar_id ?? 0)
      setTotalPhrases(data.total_phrases || 0)
      setTotalSessions(data.total_sessions || 0)
    }
  }

  async function saveProfile() {
    if (!user) return
    setIsSaving(true); setSaveMsg('')
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim() || null,
        bio: bio.trim() || null,
        main_language: mainLanguage,
        avatar_id: avatarId,
      })
      if (error) {
        setSaveMsg('❌ ' + (error.message.includes('unique') ? t('profile.error.taken') : error.message))
      } else {
        setSaveMsg(t('profile.saved'))
        setTimeout(() => setSaveMsg(''), 3000)
      }
    } catch (err: any) {
      setSaveMsg('❌ ' + (err?.message || 'Erreur'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 24px 24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${tokens.colors.border}`, marginBottom: '24px' }}
      >
        <div>
          <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '18px', fontWeight: tokens.fontWeights.bold, letterSpacing: tokens.letterSpacing.wide }}>GG TRANSLATE</div>
          <div style={{ color: tokens.colors.dim, fontSize: '10px', letterSpacing: tokens.letterSpacing.widest, marginTop: '2px' }}>{t('profile.title')}</div>
        </div>
        <button
          onClick={() => navigate('/translate')}
          style={{ background: 'transparent', border: 'none', color: tokens.colors.muted, cursor: 'pointer', fontSize: '13px', transition: tokens.transitions.normal }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.colors.text}
          onMouseLeave={e => e.currentTarget.style.color = tokens.colors.muted}
        >{t('profile.back')}</button>
      </motion.div>

      {/* AVATAR + INFO */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        style={{ display: 'flex', alignItems: 'center', gap: '20px', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius['3xl'], padding: '24px', marginBottom: '20px' }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: currentAvatar.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', cursor: 'pointer', border: `3px solid ${tokens.alpha.cyanBorder}`, boxShadow: tokens.shadows.cyanSm }}
          >
            {currentAvatar.emoji}
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: tokens.colors.cyan, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', cursor: 'pointer', border: `2px solid ${tokens.colors.bg}` }}
          >✏️</motion.div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: tokens.colors.text, fontSize: '18px', fontWeight: tokens.fontWeights.bold, fontFamily: tokens.fonts.display, marginBottom: '4px' }}>
            {username || user?.email?.split('@')[0] || 'Joueur'}
          </div>
          <div style={{ color: tokens.colors.dim, fontSize: '12px', marginBottom: '8px' }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ background: `${planColor}22`, color: planColor, padding: '3px 10px', borderRadius: tokens.radius.full, fontSize: '11px', fontFamily: tokens.fonts.display, border: `1px solid ${planColor}44` }}>{planLabel}</span>
            <span style={{ color: tokens.colors.dim, fontSize: '11px' }}>{currentAvatar.label}</span>
          </div>
        </div>
      </motion.div>

      {/* AVATAR PICKER */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius['3xl'], padding: '20px' }}>
              <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide, marginBottom: '16px' }}>{t('profile.avatar.title')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {AVATARS.map((avatar, i) => (
                  <motion.div
                    key={avatar.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setAvatarId(avatar.id); setShowAvatarPicker(false) }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: avatar.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: `2px solid ${avatarId === avatar.id ? tokens.colors.cyan : 'transparent'}`, boxShadow: avatarId === avatar.id ? tokens.shadows.cyanMd : 'none', transition: tokens.transitions.normal }}>
                      {avatar.emoji}
                    </div>
                    <span style={{ color: avatarId === avatar.id ? tokens.colors.cyan : tokens.colors.dim, fontSize: '10px', fontFamily: tokens.fonts.display }}>{avatar.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}
      >
        <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '16px', textAlign: 'center' }}>
          <div style={{ color: tokens.colors.cyan, fontSize: '28px', fontWeight: tokens.fontWeights.bold, fontFamily: tokens.fonts.display }}>{totalPhrases}</div>
          <div style={{ color: tokens.colors.dim, fontSize: '11px', marginTop: '4px' }}>{t('profile.phrases')}</div>
        </div>
        <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '16px', textAlign: 'center' }}>
          <div style={{ color: tokens.colors.purple, fontSize: '28px', fontWeight: tokens.fontWeights.bold, fontFamily: tokens.fonts.display }}>{totalSessions}</div>
          <div style={{ color: tokens.colors.dim, fontSize: '11px', marginTop: '4px' }}>{t('profile.sessions')}</div>
        </div>
      </motion.div>

      {/* FORMULAIRE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius['3xl'], padding: '24px' }}
      >
        <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide, marginBottom: '20px' }}>{t('profile.edit')}</div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: tokens.colors.muted, fontSize: '12px', marginBottom: '8px' }}>{t('profile.username')}</div>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="MonPseudo123"
            maxLength={30}
            style={{ width: '100%', background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: tokens.transitions.normal }}
            onFocus={e => e.target.style.borderColor = tokens.colors.cyan}
            onBlur={e => e.target.style.borderColor = tokens.colors.border}
          />
          <div style={{ color: tokens.colors.veryDim, fontSize: '10px', marginTop: '4px' }}>{username.length}/30</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: tokens.colors.muted, fontSize: '12px', marginBottom: '8px' }}>{t('profile.bio')}</div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Joueur passionné de FPS..."
            maxLength={150}
            rows={3}
            style={{ width: '100%', background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: tokens.transitions.normal }}
            onFocus={e => e.target.style.borderColor = tokens.colors.cyan}
            onBlur={e => e.target.style.borderColor = tokens.colors.border}
          />
          <div style={{ color: tokens.colors.veryDim, fontSize: '10px', marginTop: '4px' }}>{bio.length}/150</div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: tokens.colors.muted, fontSize: '12px', marginBottom: '8px' }}>{t('profile.lang')}</div>
          <select
            value={mainLanguage}
            onChange={e => setMainLanguage(e.target.value)}
            style={{ width: '100%', background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '14px', cursor: 'pointer', outline: 'none' }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>

        <motion.button
          whileHover={isSaving ? {} : { scale: 1.01 }}
          whileTap={isSaving ? {} : { scale: 0.98 }}
          onClick={saveProfile}
          disabled={isSaving}
          style={{ width: '100%', background: isSaving ? tokens.colors.border : tokens.gradients.primaryR, border: 'none', color: tokens.colors.white, padding: '12px', borderRadius: tokens.radius.md, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display, opacity: isSaving ? 0.7 : 1, transition: tokens.transitions.normal }}
        >
          {isSaving ? t('profile.saving') : t('profile.save')}
        </motion.button>

        <AnimatePresence>
          {saveMsg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ marginTop: '12px', textAlign: 'center', fontSize: '13px', color: saveMsg.startsWith('✅') ? tokens.colors.green : tokens.colors.red }}
            >
              {saveMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}