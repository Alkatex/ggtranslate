import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAppLanguage } from '../store/appLanguage'
import { getAvailableLanguages } from '../lib/languages'
import { supabase } from '../lib/supabase'

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

// ─── FIX: Copie clipboard compatible Electron ─────────────────────────────────
function copyToClipboard(text: string): boolean {
  try {
    // Méthode 1 — navigator.clipboard (async, peut échouer dans Electron)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    // Méthode 2 — execCommand fallback (synchrone, marche toujours dans Electron)
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
    setLoading(true); setError('')
    const code = generateCode(groupName)
    const { data: group, error: groupError } = await supabase.from('groups').insert({ name: groupName.trim(), code, is_public: isPublic, owner_id: user.id, max_members: 8, last_activity_at: new Date().toISOString() }).select().single()
    if (groupError) { setError('Erreur lors de la création du groupe'); setLoading(false); return }
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, language: selectedLang })
    setSuccess(`✅ Groupe créé ! Code: ${code}`)
    setGroupName('')
    setShowCreate(false)
    setActiveGroup(group)
    loadPublicGroups()
    loadMyGroups()
    setLoading(false)
  }

  async function joinGroup(code?: string) {
    // ─── FIX: trim + uppercase + maybeSingle ─────────────────────────────────
    const codeToUse = (code || joinCode).trim().toUpperCase()
    if (!codeToUse || !user) return
    setLoading(true); setError('')

    // FIX: maybeSingle() retourne null au lieu d'une erreur si pas trouvé
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('code', codeToUse)
      .maybeSingle()

    if (groupError) {
      setError('Erreur lors de la recherche du groupe')
      setLoading(false)
      return
    }

    if (!group) {
      setError(`Code invalide : "${codeToUse}" — vérifie le code et réessaie`)
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, language: selectedLang })
    }

    await supabase.from('groups').update({ last_activity_at: new Date().toISOString() }).eq('id', group.id)
    setActiveGroup(group)
    setJoinCode('')
    setShowJoin(false)
    setSuccess(`✅ Rejoint ${group.name} !`)
    loadMyGroups()
    setLoading(false)
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

  // ─── FIX: Copie clipboard compatible Electron ─────────────────────────────
  function copyCode(code: string) {
    const success = copyToClipboard(code)
    if (success || true) { // Affiche toujours le feedback visuel
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  function formatTime(timestamp: string) { return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  function daysInactive(lastActivity?: string) { if (!lastActivity) return 0; return Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '20px', letterSpacing: '0.1em', margin: 0 }}>GG TRANSLATE</h1>
          <p style={{ color: '#475569', fontSize: '11px', letterSpacing: '0.15em', marginTop: '2px' }}>{t('groups.title')}</p>
        </div>
        <button onClick={() => navigate('/translate')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>{t('groups.back')}</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#ef4444', fontSize: '13px' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#22c55e', fontSize: '13px' }}>{success}</div>}

      {/* CONFIRMATION SUPPRESSION */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0d1424', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '16px', marginBottom: '8px' }}>{t('groups.delete')}</div>
            <div style={{ color: '#475569', fontSize: '13px', marginBottom: '24px' }}>{t('groups.delete.confirm')}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e2d45', color: '#475569', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>{t('groups.cancel')}</button>
              <button onClick={() => deleteGroup(confirmDelete)} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Orbitron, sans-serif' }}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* GROUPE ACTIF */}
      {activeGroup && (
        <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid #06b6d4', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '14px', marginBottom: '4px' }}>🎮 {activeGroup.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#475569', fontSize: '11px' }}>Code:</span>
                <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.1em', background: '#111827', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e2d45' }}>{activeGroup.code}</span>
                <button onClick={() => copyCode(activeGroup.code)} style={{ background: copiedCode === activeGroup.code ? 'rgba(34,197,94,0.2)' : 'rgba(6,182,212,0.1)', border: `1px solid ${copiedCode === activeGroup.code ? '#22c55e' : '#06b6d4'}`, color: copiedCode === activeGroup.code ? '#22c55e' : '#06b6d4', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', transition: 'all 0.2s' }}>
                  {copiedCode === activeGroup.code ? '✅ COPIÉ' : '📋 COPIER'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeGroup.owner_id === user?.id && (
                <button onClick={() => setConfirmDelete(activeGroup.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
              )}
              <button onClick={leaveGroup} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>{t('groups.leave')}</button>
            </div>
          </div>

          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '10px' }}>
            {t('groups.members')} ({activeMembers.length}/{activeGroup.max_members})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {activeMembers.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px' }}>Aucun membre pour l'instant...</div>
            ) : (
              activeMembers.map(member => (
                <div key={member.id} style={{ background: member.is_speaking ? 'rgba(34,197,94,0.15)' : '#111827', border: `1px solid ${member.is_speaking ? '#22c55e' : '#1e2d45'}`, borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>{LANG_FLAGS[member.language] || '🌍'}</span>
                  <span style={{ color: member.user_id === user?.id ? '#06b6d4' : '#94a3b8', fontSize: '11px' }}>{member.user_id === user?.id ? 'Toi' : 'Joueur'}</span>
                  {member.is_speaking && <span style={{ color: '#22c55e', fontSize: '10px' }}>● PARLE</span>}
                </div>
              ))
            )}
          </div>

          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '10px' }}>{t('groups.chat')}</div>
          <div style={{ background: '#0a0f1a', borderRadius: '10px', border: '1px solid #1e2d45', height: '240px', overflowY: 'auto', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '80px' }}>Aucun message — commence la conversation !</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.user_id === user?.id ? 'flex-end' : 'flex-start' }}>
                  <div style={{ color: '#475569', fontSize: '10px', marginBottom: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                    {msg.user_id === user?.id ? 'Toi' : msg.display_name || 'Joueur'} · {formatTime(msg.created_at)}
                  </div>
                  <div style={{ background: msg.type === 'translation' ? 'rgba(168,85,247,0.15)' : msg.user_id === user?.id ? 'rgba(6,182,212,0.15)' : '#111827', border: `1px solid ${msg.type === 'translation' ? '#a855f7' : msg.user_id === user?.id ? '#06b6d4' : '#1e2d45'}`, borderRadius: '10px', padding: '8px 12px', maxWidth: '80%' }}>
                    {msg.type === 'translation' && <div style={{ color: '#a855f7', fontSize: '9px', fontFamily: 'Orbitron, sans-serif', marginBottom: '4px', letterSpacing: '0.1em' }}>🎤 TRADUCTION VOCALE {LANG_FLAGS[msg.language] || '🌍'}</div>}
                    <div style={{ color: msg.type === 'translation' ? '#e9d5ff' : msg.user_id === user?.id ? '#06b6d4' : '#fff', fontSize: '13px' }}>{msg.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t('groups.placeholder')} style={{ flex: 1, background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }} />
            <button onClick={sendMessage} disabled={!newMessage.trim()} style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', fontSize: '16px', opacity: newMessage.trim() ? 1 : 0.5 }}>➤</button>
          </div>
        </div>
      )}

      {/* MA LANGUE */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#94a3b8', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.lang')}</p>
        <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </div>

      {/* BOUTONS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }} style={{ flex: 1, background: showCreate ? 'linear-gradient(to right, #3b82f6, #06b6d4)' : 'transparent', border: showCreate ? 'none' : '1px solid #1e2d45', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>{t('groups.create')}</button>
        <button onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }} style={{ flex: 1, background: showJoin ? 'rgba(6,182,212,0.15)' : 'transparent', border: `1px solid ${showJoin ? '#06b6d4' : '#1e2d45'}`, color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.join')}</button>
      </div>

      {/* CRÉER */}
      {showCreate && (
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', marginBottom: '16px' }}>✨ {t('groups.create')}</div>
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={t('groups.name.placeholder')} style={{ width: '100%', background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setIsPublic(true)} style={{ background: isPublic ? 'rgba(6,182,212,0.15)' : 'transparent', border: `1px solid ${isPublic ? '#06b6d4' : '#1e2d45'}`, color: isPublic ? '#06b6d4' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>{t('groups.public.label')}</button>
            <button onClick={() => setIsPublic(false)} style={{ background: !isPublic ? 'rgba(6,182,212,0.15)' : 'transparent', border: `1px solid ${!isPublic ? '#06b6d4' : '#1e2d45'}`, color: !isPublic ? '#06b6d4' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>{t('groups.private.label')}</button>
          </div>
          <div style={{ color: '#475569', fontSize: '11px', marginBottom: '14px' }}>{t('groups.inactivity')}</div>
          <button onClick={createGroup} disabled={loading || !groupName.trim()} style={{ width: '100%', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Orbitron, sans-serif', opacity: loading ? 0.7 : 1 }}>
            {loading ? t('groups.creating') : t('groups.create.btn')}
          </button>
        </div>
      )}

      {/* REJOINDRE */}
      {showJoin && (
        <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', marginBottom: '16px' }}># {t('groups.join')}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGroup()}
              placeholder="Ex: VAL-ABCD"
              style={{ flex: 1, background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
            <button onClick={() => joinGroup()} disabled={loading || !joinCode.trim()} style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Orbitron, sans-serif', opacity: loading || !joinCode.trim() ? 0.7 : 1 }}>{t('groups.join.btn')}</button>
          </div>
        </div>
      )}

      {/* MES GROUPES */}
      {myGroups.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.mine')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myGroups.map(group => {
              const inactive = daysInactive(group.last_activity_at)
              const isOwner = group.owner_id === user?.id
              return (
                <div key={group.id} style={{ background: activeGroup?.id === group.id ? 'rgba(6,182,212,0.1)' : '#0d1424', border: `1px solid ${activeGroup?.id === group.id ? '#06b6d4' : '#1e2d45'}`, borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{group.name}</div>
                      {isOwner && <span style={{ color: '#f59e0b', fontSize: '10px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.owner')}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.08em', background: '#111827', padding: '1px 6px', borderRadius: '3px' }}>{group.code}</span>
                      {inactive > 0 && <span style={{ color: inactive >= 2 ? '#ef4444' : '#f59e0b', fontSize: '10px' }}>· {inactive}{t('groups.inactive')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => copyCode(group.code)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: copiedCode === group.code ? '#22c55e' : '#475569', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }}>{copiedCode === group.code ? '✅' : '📋'}</button>
                    {isOwner && <button onClick={() => setConfirmDelete(group.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>🗑️</button>}
                    <button onClick={() => setActiveGroup(group)} style={{ background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>Entrer</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* GROUPES PUBLICS */}
      <p style={{ color: '#94a3b8', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.public')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {publicGroups.length === 0 ? (
          <div style={{ border: '1px dashed #1e2d45', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>{t('groups.empty')}</div>
        ) : (
          publicGroups.map(group => (
            <div key={group.id} style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{group.name}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '12px' }}>👥 {group.member_count}/{group.max_members}</span>
                  <span style={{ color: '#475569', fontSize: '12px' }}>·</span>
                  <span style={{ fontSize: '14px' }}>{group.languages?.map(l => LANG_FLAGS[l] || '🌍').join(' ') || '🌍'}</span>
                </div>
              </div>
              <button onClick={() => joinGroup(group.code)} style={{ background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif' }}>{t('groups.join.btn')}</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}