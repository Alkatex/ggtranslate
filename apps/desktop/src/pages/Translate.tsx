import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPanel } from '../components/SettingsPanel'
import { ThemeSelector } from '../components/ThemeSelector'
import { TranslationPipeline, PipelineState } from '../lib/pipeline'
import { startOtherPlayers, stopOtherPlayers, OtherPlayersState, setOtherPlayersTTSEnabled } from '../lib/otherPlayersPipeline'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { useAppLanguage } from '../store/appLanguage'
import { getAvailableLanguages } from '../lib/languages'
import { getAvailableEffects, VoiceEffect, applyVoiceEffect } from '../lib/voiceEffects'
import { translateText } from '../lib/translation'
import { speakTranslation } from '../lib/tts'
import { updateStats } from '../lib/stats'

const API_URL = 'https://ggtranslatebackend-production.up.railway.app'
const DISCORD_API = 'https://ggtranslatebackend-production.up.railway.app'

const DEFAULT_PHRASES = ['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse']

interface FeedItem {
  id: number
  original: string
  translated: string
  timestamp: string
}

let feedCounter = 0

async function sendToDiscord(opts: {
  original: string; translated: string; sourceLang: string; targetLang: string
  sourceLangFlag: string; targetLangFlag: string; game?: string | null; gameEmoji?: string | null; username?: string
}) {
  try {
    const guildId = await window.electron.settings.get('discordGuildId') as string
    const enabled = await window.electron.settings.get('discordEnabled') as boolean
    if (!guildId || !enabled) return
    await fetch(`${DISCORD_API}/discord/translate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId, ...opts }),
    })
  } catch {}
}

function NavItem({ icon, label, active, onClick, color }: {
  icon: string; label: string; active?: boolean; onClick: () => void; color?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', width: '48px', height: '48px',
        borderRadius: '12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(6,182,212,0.15)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: active ? `1px solid ${color || '#06b6d4'}` : '1px solid transparent',
        transition: 'all 0.18s', fontSize: '18px',
      }}
      title={label}
    >
      {icon}
      {active && (
        <div style={{ position: 'absolute', left: '-1px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: color || '#06b6d4', borderRadius: '0 3px 3px 0' }} />
      )}
    </div>
  )
}

export function TranslatePage() {
  const navigate = useNavigate()
  const { plan, secondsRemaining, canUseFeature, signOut } = useAuthStore()
  const { getTheme } = useThemeStore()
  const { t } = useAppLanguage()
  const theme = getTheme()
  const LANGUAGES = getAvailableLanguages(plan)
  const EFFECTS = getAvailableEffects(plan)

  const [sourceLang, setSourceLang] = useState('fr')
  const [targetLang, setTargetLang] = useState('en')
  const [liveState, setLiveState] = useState<PipelineState>('inactive')
  const [activeEffect, setActiveEffect] = useState('normal')
  const [previewingEffect, setPreviewingEffect] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [micDeviceId, setMicDeviceId] = useState<string | null>(null)
  const [headsetDeviceId, setHeadsetDeviceId] = useState<string | null>(null)
  const [virtualDeviceId, setVirtualDeviceId] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [myFeed, setMyFeed] = useState<FeedItem[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [otherPlayersState, setOtherPlayersState] = useState<OtherPlayersState>('inactive')
  const [currentOtherTranscript, setCurrentOtherTranscript] = useState('')
  const [otherFeed, setOtherFeed] = useState<FeedItem[]>([])
  const [otherError, setOtherError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [sessionPhrases, setSessionPhrases] = useState(0)
  const [showSessionBadge, setShowSessionBadge] = useState(false)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [detectedGame, setDetectedGame] = useState<string | null>(null)
  const [detectedGameEmoji, setDetectedGameEmoji] = useState<string | null>(null)
  const [quickPhrases, setQuickPhrases] = useState<string[]>(DEFAULT_PHRASES)
  const [activeTab, setActiveTab] = useState<'my' | 'other'>('my')
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [otherPlayersTTS, setOtherPlayersTTS] = useState(true)

  const pipelineRef = useRef<TranslationPipeline | null>(null)
  const myFeedRef = useRef<HTMLDivElement>(null)
  const otherFeedRef = useRef<HTMLDivElement>(null)
  const currentTranscriptRef = useRef('')
  const currentOtherTranscriptRef = useRef('')
  const detectedGameRef = useRef<string | null>(null)
  const detectedGameEmojiRef = useRef<string | null>(null)
  const targetLangRef = useRef(targetLang)
  const sourceLangRef = useRef(sourceLang)
  const sessionStartRef = useRef<number | null>(null)

  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])
  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { detectedGameRef.current = detectedGame }, [detectedGame])
  useEffect(() => { detectedGameEmojiRef.current = detectedGameEmoji }, [detectedGameEmoji])
  useEffect(() => { setOtherPlayersTTSEnabled(otherPlayersTTS) }, [otherPlayersTTS])

  const categories = ['Tous', ...Array.from(new Set(EFFECTS.map(e => e.category)))]
  const filteredEffects = selectedCategory === 'Tous' ? EFFECTS : EFFECTS.filter(e => e.category === selectedCategory)

  useEffect(() => {
    pipelineRef.current = new TranslationPipeline()
    async function loadSavedDevices() {
      const savedMic = await window.electron.settings.get('micDeviceId') as string
      const savedHeadset = await window.electron.settings.get('headsetDeviceId') as string
      const savedVirtual = await window.electron.settings.get('virtualDeviceId') as string
      if (savedMic) setMicDeviceId(savedMic)
      if (savedHeadset) setHeadsetDeviceId(savedHeadset)
      if (savedVirtual) setVirtualDeviceId(savedVirtual)
    }
    loadSavedDevices()
    return () => { pipelineRef.current?.stop(); stopOtherPlayers() }
  }, [])

  useEffect(() => {
    async function loadSavedLangs() {
      const savedSource = await window.electron.settings.get('sourceLang') as string
      const savedTarget = await window.electron.settings.get('targetLang') as string
      if (savedSource) setSourceLang(savedSource)
      if (savedTarget) setTargetLang(savedTarget)
    }
    loadSavedLangs()
  }, [])

  useEffect(() => { window.electron.settings.set('sourceLang', sourceLang) }, [sourceLang])
  useEffect(() => { window.electron.settings.set('targetLang', targetLang) }, [targetLang])
  useEffect(() => { if (myFeedRef.current) myFeedRef.current.scrollTop = myFeedRef.current.scrollHeight }, [myFeed])
  useEffect(() => { if (otherFeedRef.current) otherFeedRef.current.scrollTop = otherFeedRef.current.scrollHeight }, [otherFeed])

  useEffect(() => {
    if (plan === 'pro') return
    if (liveState !== 'listening' && liveState !== 'processing') return
    const interval = setInterval(() => { useAuthStore.getState().consumeSeconds(1) }, 1000)
    return () => clearInterval(interval)
  }, [liveState, plan])

  useEffect(() => {
    if (plan !== 'free' && plan !== 'trial') return
    if (secondsRemaining === 0) {
      setShowUpgradePopup(true)
      pipelineRef.current?.stop()
      setLiveState('inactive')
      stopOtherPlayers()
      setOtherPlayersState('inactive')
    }
  }, [secondsRemaining, plan])

  useEffect(() => {
    if (sessionPhrases > 0 && sessionPhrases % 5 === 0) {
      setShowSessionBadge(true)
      setTimeout(() => setShowSessionBadge(false), 3000)
    }
  }, [sessionPhrases])

  useEffect(() => {
    window.electron.updater?.onUpdateAvailable((version: string) => setUpdateVersion(version))
    window.electron.updater?.onUpdateDownloaded(() => setUpdateDownloaded(true))
    return () => window.electron.updater?.removeListeners()
  }, [])

  useEffect(() => {
    window.electron.game?.detect().then((data: any) => {
      if (data?.game) { setDetectedGame(data.game); setDetectedGameEmoji(data.emoji); setQuickPhrases(data.phrases) }
    })
    window.electron.game?.onDetected((data: any) => {
      setDetectedGame(data.game); setDetectedGameEmoji(data.emoji); setQuickPhrases(data.phrases || DEFAULT_PHRASES)
    })
    return () => window.electron.game?.removeListeners()
  }, [])

  const swapLanguages = () => { setSourceLang(targetLang); setTargetLang(sourceLang) }

  const previewEffect = async (effect: VoiceEffect, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canUseFeature('voiceEffects') || previewingEffect === effect.id) return
    setPreviewingEffect(effect.id)
    try {
      const sampleText = targetLang === 'fr' ? 'Bonjour ceci est un test' : 'Hello this is a test'
      const voice = targetLang === 'fr' ? 'aura-2-agathe-fr' : 'aura-2-thalia-en'
      const res = await fetch(`${API_URL}/ai/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice, targetLang }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const arrayBuffer = await blob.arrayBuffer()
      if (effect.id === 'normal') {
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        if (headsetDeviceId && headsetDeviceId !== 'default' && 'setSinkId' in audio) {
          try { await (audio as any).setSinkId(headsetDeviceId) } catch {}
        }
        audio.addEventListener('ended', () => { URL.revokeObjectURL(url); setPreviewingEffect(null) })
        await audio.play(); return
      }
      const audioCtx = new AudioContext()
      if (headsetDeviceId && headsetDeviceId !== 'default' && 'setSinkId' in audioCtx) {
        try { await (audioCtx as any).setSinkId(headsetDeviceId) } catch {}
      }
      let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      audioBuffer = await applyVoiceEffect(audioBuffer, effect.id)
      const source = audioCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioCtx.destination)
      source.addEventListener('ended', () => { audioCtx.close(); setPreviewingEffect(null) })
      source.start()
    } catch { setPreviewingEffect(null) }
  }

  const toggleLive = async () => {
    if (liveState === 'inactive') {
      sessionStartRef.current = Date.now()
      setCurrentTranscript(''); currentTranscriptRef.current = ''; setErrorMsg('')
      const { user } = useAuthStore.getState()
      if (user) updateStats(user.id, { newSession: true, game: detectedGameRef.current ? { name: detectedGameRef.current, emoji: detectedGameEmojiRef.current || '🎮' } : null })
      await pipelineRef.current?.start({
        micDeviceId, headsetDeviceId, virtualDeviceId,
        sourceLang, targetLang, voiceEffect: activeEffect,
        onStateChange: (state) => setLiveState(state),
        onTranscript: (text) => { setCurrentTranscript(text); currentTranscriptRef.current = text },
        onTranslated: (text) => {
          const originalText = currentTranscriptRef.current
          setMyFeed(prev => [...prev, { id: ++feedCounter, original: originalText, translated: text, timestamp: new Date().toLocaleTimeString() }])
          setCurrentTranscript(''); currentTranscriptRef.current = ''
          setSessionPhrases(prev => prev + 1)
          window.electron.overlay.sendTranslation({ original: originalText, translated: text, timestamp: new Date().toLocaleTimeString(), type: 'my' })
          const { user } = useAuthStore.getState()
          if (user) {
            const langInfo = LANGUAGES.find(l => l.code === targetLangRef.current)
            updateStats(user.id, { phrases: 1, targetLang: langInfo ? { code: langInfo.code, flag: langInfo.flag, name: langInfo.name } : undefined, game: detectedGameRef.current ? { name: detectedGameRef.current, emoji: detectedGameEmojiRef.current || '🎮' } : null })
          }
          const srcInfo = LANGUAGES.find(l => l.code === sourceLangRef.current)
          const tgtInfo = LANGUAGES.find(l => l.code === targetLangRef.current)
          sendToDiscord({ original: originalText, translated: text, sourceLang: sourceLangRef.current, targetLang: targetLangRef.current, sourceLangFlag: srcInfo?.flag || '🌍', targetLangFlag: tgtInfo?.flag || '🌍', game: detectedGameRef.current, gameEmoji: detectedGameEmojiRef.current })
        },
        onError: (error) => { setErrorMsg(error); setLiveState('error') },
      })
    } else {
      pipelineRef.current?.stop()
      setLiveState('inactive')
      setCurrentTranscript('')
      currentTranscriptRef.current = ''
      if (sessionStartRef.current) {
        const minutes = Math.ceil((Date.now() - sessionStartRef.current) / 60000)
        const { user } = useAuthStore.getState()
        if (user && minutes > 0) updateStats(user.id, { minutes })
        sessionStartRef.current = null
      }
    }
  }

  const toggleOtherPlayers = async () => {
    if (!canUseFeature('otherPlayers')) { setOtherError(t('translate.other.upgrade.msg')); return }
    if (otherPlayersState === 'inactive') {
      setCurrentOtherTranscript(''); currentOtherTranscriptRef.current = ''; setOtherError('')
      await startOtherPlayers({
        headsetDeviceId, virtualDeviceId, sourceLang: targetLang, targetLang: sourceLang,
        onStateChange: setOtherPlayersState,
        onTranscript: (text) => { setCurrentOtherTranscript(text); currentOtherTranscriptRef.current = text },
        onTranslated: (text) => {
          const originalText = currentOtherTranscriptRef.current
          setOtherFeed(prev => [...prev, { id: ++feedCounter, original: originalText, translated: text, timestamp: new Date().toLocaleTimeString() }])
          setCurrentOtherTranscript(''); currentOtherTranscriptRef.current = ''
          setSessionPhrases(prev => prev + 1)
          window.electron.overlay.sendTranslation({ original: originalText, translated: text, timestamp: new Date().toLocaleTimeString(), type: 'other' })
          const srcInfo = LANGUAGES.find(l => l.code === targetLangRef.current)
          const tgtInfo = LANGUAGES.find(l => l.code === sourceLangRef.current)
          sendToDiscord({ original: originalText, translated: text, sourceLang: targetLangRef.current, targetLang: sourceLangRef.current, sourceLangFlag: srcInfo?.flag || '🌍', targetLangFlag: tgtInfo?.flag || '🌍', game: detectedGameRef.current, gameEmoji: detectedGameEmojiRef.current })
        },
        onError: (error) => { setOtherError(error); setOtherPlayersState('error') },
      })
    } else {
      stopOtherPlayers(); setOtherPlayersState('inactive'); setCurrentOtherTranscript(''); currentOtherTranscriptRef.current = ''
    }
  }

  const handleQuickPhrase = async (phrase: string) => {
    const text = phrase.replace(/^\S+\s/, '')
    try {
      const translated = await translateText(text, sourceLang, targetLang)
      const outputDevice = virtualDeviceId || headsetDeviceId
      await speakTranslation(translated, outputDevice, targetLang, activeEffect)
      setMyFeed(prev => [...prev, { id: ++feedCounter, original: text, translated, timestamp: new Date().toLocaleTimeString() }])
      setSessionPhrases(prev => prev + 1)
      window.electron.overlay.sendTranslation({ original: text, translated, timestamp: new Date().toLocaleTimeString(), type: 'my' })
    } catch {}
  }

  const liveColors: Record<PipelineState, string> = { inactive: '#475569', listening: '#06b6d4', processing: '#3b82f6', translated: '#22c55e', error: '#ef4444' }
  const liveLabels: Record<PipelineState, string> = {
    inactive: t('translate.live.inactive'),
    listening: t('translate.live.listening'),
    processing: t('translate.live.processing'),
    translated: t('translate.live.translated'),
    error: t('translate.live.error'),
  }
  const otherColors: Record<OtherPlayersState, string> = { inactive: '#475569', listening: '#a855f7', processing: '#3b82f6', error: '#ef4444' }

  const isLocked = liveState === 'processing'
  const isLowTime = plan !== 'pro' && secondsRemaining > 0 && secondsRemaining <= 120
  const planColor = plan === 'pro' ? '#a855f7' : plan === 'starter' ? '#3b82f6' : plan === 'trial' ? '#06b6d4' : '#64748b'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1, filter: theme.filter === 'none' ? undefined : theme.filter }}>
      <style>{`
        @keyframes pulse-red { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        @keyframes slide-down { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes badge-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-green { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse-cyan { 0%,100%{box-shadow:0 0 20px rgba(6,182,212,0.3)} 50%{box-shadow:0 0 40px rgba(6,182,212,0.6)} }
        .effect-card:hover { border-color: #06b6d4 !important; background: rgba(6,182,212,0.08) !important; }
        .effect-card:hover .preview-btn { opacity: 1 !important; }
        .feed-item { animation: slide-down 0.2s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 99px; }
      `}</style>

      {/* BADGES FLOTTANTS */}
      {showSessionBadge && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', borderRadius: '99px', padding: '10px 20px', zIndex: 500, animation: 'badge-pop 0.4s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>{sessionPhrases} {t('translate.session.badge')}</span>
        </div>
      )}

      {/* UPGRADE POPUP */}
      {showUpgradePopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0d1424', border: '1px solid rgba(249,115,22,0.5)', borderRadius: '20px', padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center', animation: 'slide-down 0.3s ease' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '20px', marginBottom: '8px' }}>{t('translate.trial.end')}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              Tu as traduit <strong style={{ color: '#06b6d4' }}>{sessionPhrases}</strong> {t('translate.trial.phrases')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => { setShowUpgradePopup(false); navigate('/pricing') }} style={{ background: 'linear-gradient(to right, #f97316, #ef4444)', border: 'none', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>{t('translate.upgrade.now')}</button>
              <button onClick={() => setShowUpgradePopup(false)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#475569', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>{t('translate.continue.free')}</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR GAUCHE */}
      <div style={{ width: '68px', height: '100vh', background: '#080d18', borderRight: '1px solid #0f1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '4px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '12px', fontWeight: 900 }}>GG</span>
        </div>
        <NavItem icon="🎤" label="Traduction" active onClick={() => {}} />
        <NavItem icon="👥" label="Groupes" onClick={() => navigate('/groups')} />
        <NavItem icon="📊" label="Stats" onClick={() => navigate('/stats')} />
        <NavItem icon="👤" label="Profil" onClick={() => navigate('/profile')} />
        <NavItem icon="📷" label="OCR" onClick={() => navigate('/ocr')} />
        <NavItem icon="⧉" label="Overlay" onClick={() => window.electron.overlay.open()} />
        <NavItem icon="💰" label="Plans" onClick={() => navigate('/pricing')} color="#f97316" />
        <div style={{ flex: 1 }} />
        <NavItem icon="🎨" label="Thème" onClick={() => setShowTheme(true)} />
        <NavItem icon="⚙️" label="Paramètres" onClick={() => setShowSettings(true)} />
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${planColor}22`, border: `1px solid ${planColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '4px' }} onClick={() => navigate('/pricing')}>
          <span style={{ fontSize: '14px' }}>{plan === 'pro' ? '⚡' : plan === 'starter' ? '🚀' : plan === 'trial' ? '⭐' : '🆓'}</span>
        </div>
        <div onClick={signOut} title={t('translate.signout')} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', opacity: 0.5, transition: 'opacity 0.2s', marginBottom: '4px' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
        >🚪</div>
      </div>

      {/* ZONE PRINCIPALE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#060b14' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #0f1a2e', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>GG TRANSLATE</div>
            {detectedGame ? (
              <div style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', background: '#22c55e', borderRadius: '50%', animation: 'pulse-green 2s ease infinite' }} />
                <span style={{ fontSize: '12px' }}>{detectedGameEmoji}</span>
                <span style={{ color: '#a855f7', fontSize: '10px', fontFamily: 'Orbitron, sans-serif' }}>{detectedGame}</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(71,85,105,0.1)', border: '1px solid #1e2d45', borderRadius: '6px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', background: '#475569', borderRadius: '50%' }} />
                <span style={{ color: '#475569', fontSize: '10px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.game.none')}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {plan !== 'pro' && secondsRemaining > 0 && (
              <div style={{ color: isLowTime ? '#ef4444' : '#475569', fontSize: '12px', fontFamily: 'Orbitron, sans-serif', animation: isLowTime ? 'pulse-red 1s ease infinite' : 'none' }}>
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
              </div>
            )}
            {plan === 'pro' && <div style={{ color: '#a855f7', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.plan.unlimited')}</div>}
            {virtualDeviceId && <div style={{ color: '#22c55e', fontSize: '10px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.mic.active')}</div>}
            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#475569', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>
              {rightPanelOpen ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {updateDownloaded && (
          <div style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid #22c55e33', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ color: '#22c55e', fontSize: '12px' }}>{t('translate.update.ready')} {updateVersion} {t('translate.update.ready2')}</span>
            <button onClick={() => window.electron.updater.install()} style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.update.install')}</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Sélecteur langue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.12em', marginBottom: '5px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.speak')}</div>
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
            <button onClick={swapLanguages} style={{ marginTop: '18px', background: '#0d1424', border: '1px solid #1e2d45', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', flexShrink: 0 }}>⇄</button>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.12em', marginBottom: '5px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.hear')}</div>
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Bouton LIVE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '24px', background: '#0d1424', borderRadius: '16px', border: `1px solid ${liveState !== 'inactive' ? liveColors[liveState] + '44' : '#1e2d45'}`, transition: 'border-color 0.3s' }}>
            <button onClick={toggleLive} disabled={isLocked} style={{ width: '100px', height: '100px', borderRadius: '50%', background: liveState === 'listening' ? 'rgba(6,182,212,0.1)' : '#111827', border: `2px solid ${liveColors[liveState]}`, cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s', opacity: isLocked ? 0.7 : 1, animation: liveState === 'listening' ? 'pulse-cyan 2s ease infinite' : 'none' }}>
              <span style={{ fontSize: '28px', color: liveColors[liveState] }}>◉</span>
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: liveColors[liveState], letterSpacing: '0.15em' }}>LIVE</span>
            </button>
            <div style={{ color: liveColors[liveState], fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              {liveState === 'inactive' ? t('translate.live.start') : liveLabels[liveState]}
            </div>
            {currentTranscript && (
              <div style={{ width: '100%', padding: '8px 14px', background: 'rgba(6,182,212,0.05)', borderRadius: '8px', fontSize: '13px', color: '#06b6d4', fontStyle: 'italic', border: '1px solid rgba(6,182,212,0.12)', textAlign: 'center' }}>
                {currentTranscript}
              </div>
            )}
            {errorMsg && <div style={{ color: '#ef4444', fontSize: '12px' }}>{errorMsg}</div>}

            {/* AUTRES JOUEURS */}
            <div style={{ width: '100%', paddingTop: '12px', borderTop: '1px solid #1e2d45' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🖥️</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.other.title')}</div>
                    <div style={{ color: otherColors[otherPlayersState], fontSize: '10px' }}>
                      {otherPlayersState === 'inactive' ? t('translate.other.inactive') : otherPlayersState === 'listening' ? t('translate.other.listening') : t('translate.other.processing')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setOtherPlayersTTS(!otherPlayersTTS)}
                    title={otherPlayersTTS ? 'Désactiver la voix' : 'Activer la voix'}
                    style={{ background: otherPlayersTTS ? 'rgba(6,182,212,0.15)' : 'rgba(71,85,105,0.15)', border: `1px solid ${otherPlayersTTS ? '#06b6d4' : '#1e2d45'}`, color: otherPlayersTTS ? '#06b6d4' : '#475569', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {otherPlayersTTS ? '🔊' : '🔇'}
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px' }}>{otherPlayersTTS ? 'VOIX' : 'TEXTE'}</span>
                  </button>
                  <button onClick={toggleOtherPlayers} style={{ background: otherPlayersState !== 'inactive' ? 'rgba(168,85,247,0.15)' : 'transparent', border: `1px solid ${otherPlayersState !== 'inactive' ? '#a855f7' : '#1e2d45'}`, color: otherPlayersState !== 'inactive' ? '#a855f7' : canUseFeature('otherPlayers') ? '#94a3b8' : '#334155', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', transition: 'all 0.2s', opacity: canUseFeature('otherPlayers') ? 1 : 0.5 }}>
                    {otherPlayersState !== 'inactive' ? t('translate.other.stop') : canUseFeature('otherPlayers') ? t('translate.other.capture') : t('translate.other.upgrade')}
                  </button>
                </div>
              </div>
              {currentOtherTranscript && (
                <div style={{ width: '100%', padding: '6px 12px', background: 'rgba(168,85,247,0.05)', borderRadius: '6px', fontSize: '12px', color: '#a855f7', fontStyle: 'italic' }}>
                  {currentOtherTranscript}
                </div>
              )}
              {otherError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{otherError}</div>}
            </div>
          </div>

          {/* Feed tabs */}
          <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1e2d45' }}>
              <button onClick={() => setActiveTab('my')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: activeTab === 'my' ? '#06b6d4' : '#475569', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', borderBottom: activeTab === 'my' ? '2px solid #06b6d4' : '2px solid transparent', transition: 'all 0.2s' }}>
                {t('translate.feed.my')} {myFeed.length > 0 && <span style={{ background: 'rgba(6,182,212,0.2)', borderRadius: '99px', padding: '1px 6px', marginLeft: '4px' }}>{myFeed.length}</span>}
              </button>
              <button onClick={() => setActiveTab('other')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: activeTab === 'other' ? '#a855f7' : '#475569', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em', borderBottom: activeTab === 'other' ? '2px solid #a855f7' : '2px solid transparent', transition: 'all 0.2s' }}>
                {t('translate.feed.other')} {otherFeed.length > 0 && <span style={{ background: 'rgba(168,85,247,0.2)', borderRadius: '99px', padding: '1px 6px', marginLeft: '4px' }}>{otherFeed.length}</span>}
              </button>
            </div>
            <div ref={activeTab === 'my' ? myFeedRef : otherFeedRef} style={{ height: '220px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTab === 'my' ? (
                myFeed.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '70px' }}>{t('translate.feed.empty')}</div>
                ) : (
                  myFeed.map(item => (
                    <div key={item.id} className="feed-item" style={{ background: '#111827', borderRadius: '8px', padding: '9px 12px', border: '1px solid #1e2d45' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '3px' }}>{item.original}</div>
                      <div style={{ color: '#06b6d4', fontSize: '12px', marginBottom: '2px' }}>→ {item.translated}</div>
                      <div style={{ color: '#334155', fontSize: '10px' }}>{item.timestamp}</div>
                    </div>
                  ))
                )
              ) : (
                otherFeed.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '70px' }}>
                    {canUseFeature('otherPlayers') ? t('translate.feed.other.empty') : t('translate.feed.other.locked')}
                  </div>
                ) : (
                  otherFeed.map(item => (
                    <div key={item.id} className="feed-item" style={{ background: '#111827', borderRadius: '8px', padding: '9px 12px', border: '1px solid #1e2d45' }}>
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '3px' }}>{item.original}</div>
                      <div style={{ color: '#a855f7', fontSize: '12px', marginBottom: '2px' }}>→ {item.translated}</div>
                      <div style={{ color: '#334155', fontSize: '10px' }}>{item.timestamp}</div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PANNEAU DROIT */}
      <div style={{ width: rightPanelOpen ? '280px' : '0px', overflow: 'hidden', transition: 'width 0.28s ease', background: '#080d18', borderLeft: '1px solid #0f1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ width: '280px', height: '100%', overflowY: 'auto', padding: '16px 14px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#06b6d4', letterSpacing: '0.1em' }}>{t('translate.effects.title')}</div>
              {canUseFeature('voiceEffects') && <span style={{ color: '#475569', fontSize: '10px' }}>{activeEffect !== 'normal' ? `✅ ${EFFECTS.find(e => e.id === activeEffect)?.name}` : 'Normal'}</span>}
            </div>
            {!canUseFeature('voiceEffects') ? (
              <button onClick={() => navigate('/pricing')} style={{ width: '100%', background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{t('translate.effects.unlock')}</button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? 'rgba(6,182,212,0.15)' : 'transparent', border: `1px solid ${selectedCategory === cat ? '#06b6d4' : '#1e2d45'}`, color: selectedCategory === cat ? '#06b6d4' : '#475569', padding: '2px 8px', borderRadius: '99px', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s' }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {filteredEffects.map((effect: VoiceEffect) => {
                    const isActive = activeEffect === effect.id
                    const isPreviewing = previewingEffect === effect.id
                    return (
                      <div key={effect.id} className="effect-card" onClick={() => setActiveEffect(effect.id)} style={{ position: 'relative', background: isActive ? 'rgba(6,182,212,0.15)' : '#111827', border: `1px solid ${isActive ? '#06b6d4' : '#1e2d45'}`, borderRadius: '10px', padding: '8px 4px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '18px', lineHeight: 1 }}>{effect.emoji}</div>
                        <div style={{ color: isActive ? '#06b6d4' : '#94a3b8', fontSize: '9px', textAlign: 'center', fontFamily: 'Orbitron, sans-serif', lineHeight: 1.2 }}>{effect.name}</div>
                        {isActive && <div style={{ position: 'absolute', top: '3px', right: '3px', width: '5px', height: '5px', background: '#06b6d4', borderRadius: '50%' }} />}
                        {effect.id !== 'normal' && (
                          <button className="preview-btn" onClick={(e) => previewEffect(effect, e)} style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', background: isPreviewing ? '#06b6d4' : '#1e2d45', border: `1px solid ${isPreviewing ? '#06b6d4' : '#334155'}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#fff', opacity: isPreviewing ? 1 : 0, transition: 'all 0.2s', zIndex: 2 }}>
                            {isPreviewing ? <div style={{ width: '7px', height: '7px', border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : '▶'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#06b6d4', letterSpacing: '0.1em' }}>{t('translate.phrases.title')}</div>
              {detectedGame && <span style={{ color: '#a855f7', fontSize: '9px', fontFamily: 'Orbitron, sans-serif' }}>{detectedGameEmoji} {detectedGame}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {quickPhrases.map(phrase => (
                <button key={phrase} onClick={() => handleQuickPhrase(phrase)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#94a3b8', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', textAlign: 'left', transition: 'all 0.15s' }}>{phrase}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel onClose={(mic, headset, virtual) => { setMicDeviceId(mic); setHeadsetDeviceId(headset); setVirtualDeviceId(virtual); setShowSettings(false) }} />
      )}
      {showTheme && <ThemeSelector onClose={() => setShowTheme(false)} />}
    </div>
  )
}