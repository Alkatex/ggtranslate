import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAppLanguage } from '../store/appLanguage'
import { getAvailableLanguages } from '../lib/languages'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import tokens from '../styles/tokens'

interface Group {
  id: string; name: string; code: string; is_public: boolean; owner_id: string
  max_members: number; created_at: string; last_activity_at?: string; member_count?: number; languages?: string[]
}
interface GroupMember { id: string; group_id: string; user_id: string; language: string; is_speaking: boolean }
interface GroupMessage { id: string; group_id: string; user_id: string; message: string; language: string; type: 'text' | 'translation'; display_name: string; created_at: string }

function generateCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

const LANG_FLAGS: Record<string, string> = {
  fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', nl: '🇳🇱', ja: '🇯🇵', pt: '🇧🇷',
  ru: '🇷🇺', zh: '🇨🇳', ko: '🇰🇷', ar: '🇸🇦', pl: '🇵🇱', tr: '🇹🇷', sv: '🇸🇪', da: '🇩🇰',
}

function copyToClipboard(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const success = document.execCommand('copy')
    document.body.removeChild(el)
    return success
  } catch {
    return false
  }
}

export function GroupsPage() {
  const navigate = useNavigate()
  const { plan, user } = useAuthStore()
  const { t } = useAppLanguage()
  const LANGUAGES = getAvailableLanguages(plan)

  const [selectedLang, setSelectedLang] = useState('fr')
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [publicGroups, setPublicGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [activeMembers, setActiveMembers] = useState<GroupMember[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadPublicGroups(); loadMyGroups(); cleanInactiveGroups() }, [])
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!activeGroup) return
    loadActiveMembers(activeGroup.id)
    loadMessages(activeGroup.id)
    const channel = supabase.channel(`group:${activeGroup.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${activeGroup.id}` }, () => loadActiveMembers(activeGroup.id))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${activeGroup.id}` }, (payload) => { setMessages(prev => [...prev, payload.new as GroupMessage]) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeGroup])

  async function cleanInactiveGroups() {
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const { data: inactiveGroups } = await supabase.from('groups').select('id').lt('last_activity_at', threeDaysAgo.toISOString())
    if (inactiveGroups && inactiveGroups.length > 0) {
      for (const group of inactiveGroups) {
        await supabase.from('group_members').delete().eq('group_id', group.id)
        await supabase.from('group_messages').delete().eq('group_id', group.id)
        await supabase.from('groups').delete().eq('id', group.id)
      }
    }
  }

  async function loadPublicGroups() {
    const { data } = await supabase.from('groups').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(20)
    if (data) {
      const groupsWithCount = await Promise.all(data.map(async (g) => {
        const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id)
        const { data: members } = await supabase.from('group_members').select('language').eq('group_id', g.id)
        const langs = members ? [...new Set(members.map(m => m.language))] : []
        return { ...g, member_count: count || 0, languages: langs }
      }))
      setPublicGroups(groupsWithCount)
    }
  }

  async function loadMyGroups() {
    if (!user) return
    const { data } = await supabase.from('group_members').select('group_id, groups(*)').eq('user_id', user.id)
    if (data) setMyGroups(data.map((d: any) => d.groups).filter(Boolean))
  }

  async function loadActiveMembers(groupId: string) {
    const { data } = await supabase.from('group_members').select('*').eq('group_id', groupId)
    if (data) setActiveMembers(data)
  }

  async function loadMessages(groupId: string) {
    const { data } = await supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(50)
    if (data) setMessages(data as GroupMessage[])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeGroup || !user) return
    const displayName = user.email?.split('@')[0] || 'Joueur'
    await supabase.from('group_messages').insert({ group_id: activeGroup.id, user_id: user.id, message: newMessage.trim(), language: selectedLang, type: 'text', display_name: displayName })
    await supabase.from('groups').update({ last_activity_at: new Date().toISOString() }).eq('id', activeGroup.id)
    setNewMessage('')
  }

  async function createGroup() {
    if (!groupName.trim() || !user) return
    setLoading(true); setError(''); setSuccess('')
    const code = generateCode(groupName)
    const { data: group, error: groupError } = await supabase.from('groups').insert({ name: groupName.trim(), code, is_public: isPublic, owner_id: user.id, max_members: 8, last_activity_at: new Date().toISOString() }).select().single()
    if (groupError) { setError('Erreur lors de la création du groupe'); setLoading(false); return }
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, language: selectedLang })
    setSuccess(`✅ Groupe créé ! Code: ${code}`)
    setTimeout(() => setSuccess(''), 5000)
    setGroupName(''); setShowCreate(false); setActiveGroup(group)
    await loadPublicGroups(); await loadMyGroups(); setLoading(false)
  }

  async function joinGroup(code?: string) {
    const codeToUse = (code || joinCode).trim().toUpperCase()
    if (!codeToUse || !user) return
    setLoading(true); setError(''); setSuccess('')
    const { data: group, error: groupError } = await supabase.from('groups').select('*').eq('code', codeToUse).maybeSingle()
    if (groupError) { setError('Erreur lors de la recherche du groupe'); setLoading(false); return }
    if (!group) { setError(`Code invalide : "${codeToUse}" — vérifie le code et réessaie`); setLoading(false); return }
    const { data: existing } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
    if (!existing) await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, language: selectedLang })
    await supabase.from('groups').update({ last_activity_at: new Date().toISOString() }).eq('id', group.id)
    setActiveGroup(group); setJoinCode(''); setShowJoin(false)
    setSuccess(`✅ Rejoint ${group.name} !`)
    setTimeout(() => setSuccess(''), 5000)
    await loadMyGroups(); setLoading(false)
  }

  async function deleteGroup(groupId: string) {
    if (!user) return
    setLoading(true)
    await supabase.from('group_members').delete().eq('group_id', groupId)
    await supabase.from('group_messages').delete().eq('group_id', groupId)
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) { setError('Erreur lors de la suppression') }
    else {
      setSuccess('🗑️ Groupe supprimé')
      if (activeGroup?.id === groupId) { setActiveGroup(null); setActiveMembers([]); setMessages([]) }
      loadPublicGroups(); loadMyGroups()
    }
    setConfirmDelete(null); setLoading(false)
  }

  async function leaveGroup() {
    if (!activeGroup || !user) return
    await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', user.id)
    setActiveGroup(null); setActiveMembers([]); setMessages([])
    loadPublicGroups(); loadMyGroups()
  }

  function copyCode(code: string) {
    copyToClipboard(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function formatTime(timestamp: string) { return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  function daysInactive(lastActivity?: string) { if (!lastActivity) return 0; return Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}
      >
        <div>
          <h1 style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '20px', letterSpacing: tokens.letterSpacing.wide, margin: 0 }}>GG TRANSLATE</h1>
          <p style={{ color: tokens.colors.dim, fontSize: '11px', letterSpacing: tokens.letterSpacing.widest, marginTop: '2px' }}>{t('groups.title')}</p>
        </div>
        <button
          onClick={() => navigate('/translate')}
          style={{ background: 'transparent', border: 'none', color: tokens.colors.muted, cursor: 'pointer', fontSize: '13px', transition: tokens.transitions.normal }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.colors.text}
          onMouseLeave={e => e.currentTarget.style.color = tokens.colors.muted}
        >
          {t('groups.back')}
        </button>
      </motion.div>

      {/* MESSAGES ERREUR / SUCCÈS */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ background: tokens.alpha.redDim, border: `1px solid ${tokens.colors.red}`, borderRadius: tokens.radius.md, padding: '10px 14px', marginBottom: '16px', color: tokens.colors.red, fontSize: '13px' }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ background: tokens.alpha.greenDim, border: `1px solid ${tokens.colors.green}`, borderRadius: tokens.radius.md, padding: '10px 14px', marginBottom: '16px', color: tokens.colors.green, fontSize: '13px' }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION SUPPRESSION */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: tokens.alpha.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.alpha.redMid}`, borderRadius: tokens.radius['3xl'], padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
              <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.text, fontSize: '16px', marginBottom: '8px' }}>{t('groups.delete')}</div>
              <div style={{ color: tokens.colors.dim, fontSize: '13px', marginBottom: '24px' }}>{t('groups.delete.confirm')}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: tokens.colors.dim, padding: '10px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '13px' }}>{t('groups.cancel')}</button>
                <button onClick={() => deleteGroup(confirmDelete)} style={{ flex: 1, background: tokens.alpha.redMid, border: `1px solid ${tokens.colors.red}`, color: tokens.colors.red, padding: '10px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display }}>🗑️</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GROUPE ACTIF */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            style={{ background: tokens.alpha.cyanDim, border: `1px solid ${tokens.colors.cyan}`, borderRadius: tokens.radius.xl, padding: '20px', marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '14px', marginBottom: '4px' }}>🎮 {activeGroup.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: tokens.colors.dim, fontSize: '11px' }}>Code:</span>
                  <span style={{ color: tokens.colors.text, fontSize: '14px', fontFamily: tokens.fonts.mono, letterSpacing: '0.1em', background: tokens.colors.bg3, padding: '2px 8px', borderRadius: tokens.radius.xs, border: `1px solid ${tokens.colors.border}` }}>{activeGroup.code}</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyCode(activeGroup.code)}
                    style={{ background: copiedCode === activeGroup.code ? tokens.alpha.greenMid : tokens.alpha.cyanLight, border: `1px solid ${copiedCode === activeGroup.code ? tokens.colors.green : tokens.colors.cyan}`, color: copiedCode === activeGroup.code ? tokens.colors.green : tokens.colors.cyan, padding: '4px 10px', borderRadius: tokens.radius.xs, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display, transition: tokens.transitions.normal }}
                  >
                    {copiedCode === activeGroup.code ? '✅ COPIÉ' : '📋 COPIER'}
                  </motion.button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeGroup.owner_id === user?.id && (
                  <button onClick={() => setConfirmDelete(activeGroup.id)} style={{ background: tokens.alpha.redDim, border: `1px solid rgba(239,68,68,0.4)`, color: tokens.colors.red, padding: '6px 12px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                )}
                <button onClick={leaveGroup} style={{ background: 'transparent', border: `1px solid ${tokens.colors.red}`, color: tokens.colors.red, padding: '6px 14px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px' }}>{t('groups.leave')}</button>
              </div>
            </div>

            <div style={{ fontFamily: tokens.fonts.display, fontSize: '10px', color: tokens.colors.dim, letterSpacing: tokens.letterSpacing.wide, marginBottom: '10px' }}>
              {t('groups.members')} ({activeMembers.length}/{activeGroup.max_members})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {activeMembers.length === 0 ? (
                <div style={{ color: tokens.colors.dim, fontSize: '12px' }}>Aucun membre pour l'instant...</div>
              ) : (
                activeMembers.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ background: member.is_speaking ? tokens.alpha.greenMid : tokens.colors.bg3, border: `1px solid ${member.is_speaking ? tokens.colors.green : tokens.colors.border}`, borderRadius: tokens.radius.md, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ fontSize: '14px' }}>{LANG_FLAGS[member.language] || '🌍'}</span>
                    <span style={{ color: member.user_id === user?.id ? tokens.colors.cyan : tokens.colors.muted, fontSize: '11px' }}>{member.user_id === user?.id ? 'Toi' : 'Joueur'}</span>
                    {member.is_speaking && <span style={{ color: tokens.colors.green, fontSize: '10px' }}>● PARLE</span>}
                  </motion.div>
                ))
              )}
            </div>

            <div style={{ fontFamily: tokens.fonts.display, fontSize: '10px', color: tokens.colors.dim, letterSpacing: tokens.letterSpacing.wide, marginBottom: '10px' }}>{t('groups.chat')}</div>
            <div style={{ background: tokens.colors.bgChat, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.colors.border}`, height: '240px', overflowY: 'auto', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ color: tokens.colors.dim, fontSize: '12px', textAlign: 'center', marginTop: '80px' }}>Aucun message — commence la conversation !</div>
              ) : (
                messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.user_id === user?.id ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: msg.user_id === user?.id ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{ color: tokens.colors.dim, fontSize: '10px', marginBottom: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                      {msg.user_id === user?.id ? 'Toi' : msg.display_name || 'Joueur'} · {formatTime(msg.created_at)}
                    </div>
                    <div style={{ background: msg.type === 'translation' ? tokens.alpha.purpleMid : msg.user_id === user?.id ? tokens.alpha.cyanMid : tokens.colors.bg3, border: `1px solid ${msg.type === 'translation' ? tokens.colors.purple : msg.user_id === user?.id ? tokens.colors.cyan : tokens.colors.border}`, borderRadius: tokens.radius.lg, padding: '8px 12px', maxWidth: '80%' }}>
                      {msg.type === 'translation' && <div style={{ color: tokens.colors.purple, fontSize: '9px', fontFamily: tokens.fonts.display, marginBottom: '4px', letterSpacing: tokens.letterSpacing.wide }}>🎤 TRADUCTION VOCALE {LANG_FLAGS[msg.language] || '🌍'}</div>}
                      <div style={{ color: msg.type === 'translation' ? '#e9d5ff' : msg.user_id === user?.id ? tokens.colors.cyan : tokens.colors.text, fontSize: '13px' }}>{msg.message}</div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t('groups.placeholder')} style={{ flex: 1, background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '13px', outline: 'none' }} />
              <motion.button
                whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{ background: tokens.gradients.primaryR, border: 'none', color: tokens.colors.white, padding: '10px 16px', borderRadius: tokens.radius.md, cursor: newMessage.trim() ? 'pointer' : 'not-allowed', fontSize: '16px', opacity: newMessage.trim() ? 1 : 0.5 }}
              >➤</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MA LANGUE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        style={{ marginBottom: '20px' }}
      >
        <p style={{ color: tokens.colors.muted, fontSize: '11px', letterSpacing: tokens.letterSpacing.wide, marginBottom: '8px', fontFamily: tokens.fonts.display }}>{t('groups.lang')}</p>
        <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={{ width: '100%', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '12px 16px', borderRadius: tokens.radius.lg, fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </motion.div>

      {/* BOUTONS CRÉER / REJOINDRE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}
      >
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setError(''); setSuccess('') }}
          style={{ flex: 1, background: showCreate ? tokens.gradients.primaryR : 'transparent', border: showCreate ? 'none' : `1px solid ${tokens.colors.border}`, color: tokens.colors.white, padding: '14px', borderRadius: tokens.radius.lg, cursor: 'pointer', fontSize: '14px', fontFamily: tokens.fonts.display, fontWeight: tokens.fontWeights.bold }}
        >{t('groups.create')}</motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setError(''); setSuccess('') }}
          style={{ flex: 1, background: showJoin ? tokens.alpha.cyanMid : 'transparent', border: `1px solid ${showJoin ? tokens.colors.cyan : tokens.colors.border}`, color: tokens.colors.white, padding: '14px', borderRadius: tokens.radius.lg, cursor: 'pointer', fontSize: '14px', fontFamily: tokens.fonts.display }}
        >{t('groups.join')}</motion.button>
      </motion.div>

      {/* CRÉER */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px' }}>
              <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, marginBottom: '16px' }}>✨ {t('groups.create')}</div>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={t('groups.name.placeholder')} style={{ width: '100%', background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button onClick={() => setIsPublic(true)} style={{ background: isPublic ? tokens.alpha.cyanMid : 'transparent', border: `1px solid ${isPublic ? tokens.colors.cyan : tokens.colors.border}`, color: isPublic ? tokens.colors.cyan : tokens.colors.muted, padding: '8px 16px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px', transition: tokens.transitions.normal }}>{t('groups.public.label')}</button>
                <button onClick={() => setIsPublic(false)} style={{ background: !isPublic ? tokens.alpha.cyanMid : 'transparent', border: `1px solid ${!isPublic ? tokens.colors.cyan : tokens.colors.border}`, color: !isPublic ? tokens.colors.cyan : tokens.colors.muted, padding: '8px 16px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px', transition: tokens.transitions.normal }}>{t('groups.private.label')}</button>
              </div>
              <div style={{ color: tokens.colors.dim, fontSize: '11px', marginBottom: '14px' }}>{t('groups.inactivity')}</div>
              <motion.button
                whileTap={!loading && groupName.trim() ? { scale: 0.98 } : {}}
                onClick={createGroup}
                disabled={loading || !groupName.trim()}
                style={{ width: '100%', background: tokens.gradients.primaryR, border: 'none', color: tokens.colors.white, padding: '12px', borderRadius: tokens.radius.md, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? t('groups.creating') : t('groups.create.btn')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJOINDRE */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px' }}>
              <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, marginBottom: '16px' }}># {t('groups.join')}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && joinGroup()} placeholder="Ex: VAL-ABCD" style={{ flex: 1, background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '13px', fontFamily: tokens.fonts.mono, letterSpacing: '0.08em', outline: 'none' }} />
                <motion.button
                  whileTap={!loading && joinCode.trim() ? { scale: 0.97 } : {}}
                  onClick={() => joinGroup()}
                  disabled={loading || !joinCode.trim()}
                  style={{ background: tokens.gradients.primaryR, border: 'none', color: tokens.colors.white, padding: '10px 20px', borderRadius: tokens.radius.md, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display, opacity: loading || !joinCode.trim() ? 0.7 : 1 }}
                >{t('groups.join.btn')}</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MES GROUPES */}
      {myGroups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          style={{ marginBottom: '20px' }}
        >
          <p style={{ color: tokens.colors.muted, fontSize: '11px', letterSpacing: tokens.letterSpacing.wide, marginBottom: '12px', fontFamily: tokens.fonts.display }}>{t('groups.mine')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myGroups.map((group, i) => {
              const inactive = daysInactive(group.last_activity_at)
              const isOwner = group.owner_id === user?.id
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.06 }}
                  style={{ background: activeGroup?.id === group.id ? tokens.alpha.cyanLight : tokens.colors.bg2, border: `1px solid ${activeGroup?.id === group.id ? tokens.colors.cyan : tokens.colors.border}`, borderRadius: tokens.radius.lg, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: tokens.transitions.normal }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: tokens.colors.text, fontSize: '13px', fontWeight: tokens.fontWeights.semibold }}>{group.name}</div>
                      {isOwner && <span style={{ color: tokens.colors.yellow, fontSize: '10px', fontFamily: tokens.fonts.display }}>{t('groups.owner')}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ color: tokens.colors.muted, fontSize: '12px', fontFamily: tokens.fonts.mono, letterSpacing: '0.08em', background: tokens.colors.bg3, padding: '1px 6px', borderRadius: '3px' }}>{group.code}</span>
                      {inactive > 0 && <span style={{ color: inactive >= 2 ? tokens.colors.red : tokens.colors.yellow, fontSize: '10px' }}>· {inactive}{t('groups.inactive')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => copyCode(group.code)} style={{ background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: copiedCode === group.code ? tokens.colors.green : tokens.colors.dim, padding: '6px 10px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '11px', transition: tokens.transitions.normal }}>{copiedCode === group.code ? '✅' : '📋'}</button>
                    {isOwner && <button onClick={() => setConfirmDelete(group.id)} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, color: tokens.colors.red, padding: '6px 10px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '11px' }}>🗑️</button>}
                    <button onClick={() => setActiveGroup(group)} style={{ background: 'transparent', border: `1px solid ${tokens.colors.cyan}`, color: tokens.colors.cyan, padding: '6px 14px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display }}>Entrer</button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* GROUPES PUBLICS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.25 }}
      >
        <p style={{ color: tokens.colors.muted, fontSize: '11px', letterSpacing: tokens.letterSpacing.wide, marginBottom: '12px', fontFamily: tokens.fonts.display }}>{t('groups.public')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {publicGroups.length === 0 ? (
            <div style={{ border: `1px dashed ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '40px', textAlign: 'center', color: tokens.colors.dim, fontSize: '14px' }}>{t('groups.empty')}</div>
          ) : (
            publicGroups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ color: tokens.colors.text, fontSize: '14px', fontWeight: tokens.fontWeights.semibold, marginBottom: '6px' }}>{group.name}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: tokens.colors.dim, fontSize: '12px' }}>👥 {group.member_count}/{group.max_members}</span>
                    <span style={{ color: tokens.colors.dim, fontSize: '12px' }}>·</span>
                    <span style={{ fontSize: '14px' }}>{group.languages?.map(l => LANG_FLAGS[l] || '🌍').join(' ') || '🌍'}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => joinGroup(group.code)}
                  style={{ background: 'transparent', border: `1px solid ${tokens.colors.cyan}`, color: tokens.colors.cyan, padding: '8px 16px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px', fontFamily: tokens.fonts.display }}
                >{t('groups.join.btn')}</motion.button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}