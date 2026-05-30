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
import tokens from '../styles/tokens'
import {
  ScalePop,
  SlideUp,
  SlideDown,
  FeedItem as AnimFeedItem,
  OverlayBackdrop,
  LivePulse,
  AnimatePresence,
} from '../components/Animated'

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

// ── ICÔNES SVG CUSTOM ──────────────────────────────────────────────────────
const IconMic = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M5 10a7 7 0 0 0 14 0"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>
)
const IconGroups = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3"/><circle cx="16" cy="7" r="2.5" opacity="0.7"/>
    <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
    <path d="M16 14c2.2.5 4 2.3 4 4.5" opacity="0.7"/>
  </svg>
)
const IconStats = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
    <circle cx="8.5" cy="10.5" r="1.5" fill={color} stroke="none"/>
    <circle cx="13.5" cy="15.5" r="1.5" fill={color} stroke="none"/>
  </svg>
)
const IconProfile = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconOCR = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="13" y2="8"/><line x1="8" y1="16" x2="11" y2="16"/>
  </svg>
)
const IconOverlay = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <rect x="6" y="7" width="8" height="6" rx="1" opacity="0.5"/>
    <line x1="2" y1="20" x2="22" y2="20" opacity="0.4"/>
    <line x1="12" y1="17" x2="12" y2="20" opacity="0.4"/>
    <circle cx="17" cy="10" r="2" fill={color} stroke="none" opacity="0.7"/>
  </svg>
)
const IconPricing = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconTheme = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
  </svg>
)
const IconSettings = ({ color = 'currentColor' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconSignOut = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ── NAV ITEM ──────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, color }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; color?: string
}) {
  const [hovered, setHovered] = useState(false)
  const activeColor = color || tokens.colors.cyan
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', width: '48px', height: '48px',
        borderRadius: tokens.radius.xl, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${activeColor}18` : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: active ? `1px solid ${activeColor}55` : '1px solid transparent',
        transition: tokens.transitions.fast,
        color: active ? activeColor : hovered ? tokens.colors.muted : tokens.colors.dim,
      }}
      title={label}
    >
      {icon}
      {active && (
        <div style={{ position: 'absolute', left: '-1px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: activeColor, borderRadius: '0 3px 3px 0' }} />
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
  const langsLoadedRef = useRef(false)

  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])
  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { detectedGameRef.current = detectedGame }, [detectedGame])
  useEffect(() => { detectedGameEmojiRef.current = detectedGameEmoji }, [detectedGameEmoji])
  useEffect(() => { setOtherPlayersTTSEnabled(otherPlayersTTS) }, [otherPlayersTTS])

  // ─── FIX: Sync activeEffect avec le pipeline mid-session ──────────────────
  useEffect(() => {
    pipelineRef.current?.setVoiceEffect(activeEffect)
  }, [activeEffect])

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
      langsLoadedRef.current = true
    }
    loadSavedLangs()
  }, [])

  useEffect(() => { if (!langsLoadedRef.current) return; window.electron.settings.set('sourceLang', sourceLang) }, [sourceLang])
  useEffect(() => { if (!langsLoadedRef.current) return; window.electron.settings.set('targetLang', targetLang) }, [targetLang])
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
      let arrayBuffer: ArrayBuffer
      if (window.electron?.railway) {
        const buf = await window.electron.railway.postBinary('/ai/tts', { text: sampleText, voice, targetLang })
        arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
      } else {
        const res = await fetch(`${API_URL}/ai/tts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sampleText, voice, targetLang }),
        })
        if (!res.ok) throw new Error('TTS failed')
        arrayBuffer = await (await res.blob()).arrayBuffer()
      }
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
      if (secondsRemaining === 0 && plan !== 'pro') {
        setShowUpgradePopup(true)
        return
      }
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

  const liveColors: Record<PipelineState, string> = {
    inactive: tokens.colors.stateInactive,
    listening: tokens.colors.stateListening,
    processing: tokens.colors.stateProcessing,
    translated: tokens.colors.stateTranslated,
    error: tokens.colors.stateError,
  }
  const liveLabels: Record<PipelineState, string> = {
    inactive: t('translate.live.inactive'),
    listening: t('translate.live.listening'),
    processing: t('translate.live.processing'),
    translated: t('translate.live.translated'),
    error: t('translate.live.error'),
  }
  const otherColors: Record<OtherPlayersState, string> = {
    inactive: tokens.colors.stateInactive,
    listening: tokens.colors.stateOther,
    processing: tokens.colors.stateProcessing,
    error: tokens.colors.stateError,
  }

  const isLocked = liveState === 'processing'
  const isLowTime = plan !== 'pro' && secondsRemaining > 0 && secondsRemaining <= 120
  const planColor = plan === 'pro' ? tokens.colors.planPro : plan === 'starter' ? tokens.colors.planStarter : plan === 'trial' ? tokens.colors.planTrial : tokens.colors.planFree

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1, filter: theme.filter === 'none' ? undefined : theme.filter }}>
      <style>{`
        @keyframes pulse-red { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-green { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse-cyan { 0%,100%{box-shadow:0 0 20px rgba(6,182,212,0.3)} 50%{box-shadow:0 0 40px rgba(6,182,212,0.6)} }
        .effect-card:hover { border-color: ${tokens.colors.cyan} !important; background: ${tokens.alpha.cyanLight} !important; }
        .effect-card:hover .preview-btn { opacity: 1 !important; }
        .quick-phrase-btn:hover { border-color: ${tokens.colors.border} !important; color: ${tokens.colors.text} !important; background: rgba(255,255,255,0.03) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${tokens.colors.border}; border-radius: 99px; }
      `}</style>

      {/* ─── SESSION BADGE — ScalePop ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSessionBadge && (
          <ScalePop style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
            <div style={{ background: tokens.gradients.primaryR, borderRadius: tokens.radius.full, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: tokens.shadows.cyanMd }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <span style={{ color: tokens.colors.white, fontSize: '13px', fontFamily: tokens.fonts.display, fontWeight: tokens.fontWeights.bold }}>{sessionPhrases} {t('translate.session.badge')}</span>
            </div>
          </ScalePop>
        )}
      </AnimatePresence>

      {/* ─── UPGRADE POPUP — OverlayBackdrop ──────────────────────────────── */}
      <AnimatePresence>
        {showUpgradePopup && (
          <OverlayBackdrop onClose={() => setShowUpgradePopup(false)}>
            <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.alpha.orangeDim}`, borderRadius: tokens.radius['4xl'], padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
              <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.text, fontSize: '20px', marginBottom: '8px' }}>{t('translate.trial.end')}</div>
              <div style={{ color: tokens.colors.muted, fontSize: '14px', marginBottom: '24px' }}>
                Tu as traduit <strong style={{ color: tokens.colors.cyan }}>{sessionPhrases}</strong> {t('translate.trial.phrases')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => { setShowUpgradePopup(false); navigate('/pricing') }} style={{ background: tokens.gradients.danger, border: 'none', color: tokens.colors.white, padding: '14px', borderRadius: tokens.radius.lg, cursor: 'pointer', fontSize: '14px', fontFamily: tokens.fonts.display, fontWeight: tokens.fontWeights.bold }}>{t('translate.upgrade.now')}</button>
                <button onClick={() => setShowUpgradePopup(false)} style={{ background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: tokens.colors.dim, padding: '12px', borderRadius: tokens.radius.lg, cursor: 'pointer', fontSize: '13px' }}>{t('translate.continue.free')}</button>
              </div>
            </div>
          </OverlayBackdrop>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div style={{ width: tokens.layout.sidebarWidth, height: '100vh', background: tokens.colors.bgSide, borderRight: `1px solid ${tokens.colors.borderDark}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '4px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: tokens.radius.lg, background: tokens.gradients.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: tokens.fonts.display, color: tokens.colors.white, fontSize: '12px', fontWeight: tokens.fontWeights.black }}>GG</span>
        </div>
        <NavItem icon={<IconMic />} label="Traduction" active onClick={() => {}} />
        <NavItem icon={<IconGroups />} label="Groupes" onClick={() => navigate('/groups')} />
        <NavItem icon={<IconStats />} label="Stats" onClick={() => navigate('/stats')} />
        <NavItem icon={<IconProfile />} label="Profil" onClick={() => navigate('/profile')} />
        <NavItem icon={<IconOCR />} label="OCR" onClick={() => navigate('/ocr')} />
        <NavItem icon={<IconOverlay />} label="Overlay" onClick={() => window.electron.overlay.open()} />
        <NavItem icon={<IconPricing />} label="Plans" onClick={() => navigate('/pricing')} color={tokens.colors.orange} />
        <div style={{ flex: 1 }} />
        <NavItem icon={<IconTheme />} label="Thème" onClick={() => setShowTheme(true)} />
        <NavItem icon={<IconSettings />} label="Paramètres" onClick={() => setShowSettings(true)} />
        <div
          style={{ width: '40px', height: '40px', borderRadius: tokens.radius.lg, background: `${planColor}22`, border: `1px solid ${planColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '4px', color: planColor, transition: tokens.transitions.normal }}
          onClick={() => navigate('/pricing')}
        >
          <IconPricing color={planColor} />
        </div>
        <div
          onClick={signOut}
          title={t('translate.signout')}
          style={{ width: '40px', height: '40px', borderRadius: tokens.radius.lg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s, color 0.2s', marginBottom: '4px', color: tokens.colors.dim }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = tokens.colors.red }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = tokens.colors.dim }}
        >
          <IconSignOut />
        </div>
      </div>

      {/* ZONE PRINCIPALE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: tokens.colors.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${tokens.colors.borderDark}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '13px', fontWeight: tokens.fontWeights.bold, letterSpacing: tokens.letterSpacing.wider }}>GG TRANSLATE</div>
            {detectedGame ? (
              <div style={{ background: tokens.alpha.purpleDim, border: `1px solid ${tokens.alpha.purpleDim}`, borderRadius: tokens.radius.sm, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', background: tokens.colors.green, borderRadius: '50%', animation: 'pulse-green 2s ease infinite' }} />
                <span style={{ fontSize: '12px' }}>{detectedGameEmoji}</span>
                <span style={{ color: tokens.colors.purple, fontSize: '10px', fontFamily: tokens.fonts.display }}>{detectedGame}</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(71,85,105,0.1)', border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.sm, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', background: tokens.colors.dim, borderRadius: '50%' }} />
                <span style={{ color: tokens.colors.dim, fontSize: '10px', fontFamily: tokens.fonts.display }}>{t('translate.game.none')}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {plan !== 'pro' && secondsRemaining > 0 && (
              <div style={{ color: isLowTime ? tokens.colors.red : tokens.colors.dim, fontSize: '12px', fontFamily: tokens.fonts.display, animation: isLowTime ? 'pulse-red 1s ease infinite' : 'none' }}>
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
              </div>
            )}
            {plan === 'pro' && <div style={{ color: tokens.colors.purple, fontSize: '11px', fontFamily: tokens.fonts.display }}>{t('translate.plan.unlimited')}</div>}
            {virtualDeviceId && <div style={{ color: tokens.colors.green, fontSize: '10px', fontFamily: tokens.fonts.display }}>{t('translate.mic.active')}</div>}
            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} style={{ background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: tokens.colors.dim, padding: '4px 10px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '12px', transition: tokens.transitions.normal }}>
              {rightPanelOpen ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {/* ─── UPDATE BANNER — SlideDown ──────────────────────────────────── */}
        <AnimatePresence>
          {updateDownloaded && (
            <SlideDown>
              <div style={{ background: tokens.alpha.greenDim, borderBottom: `1px solid ${tokens.colors.green}33`, padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ color: tokens.colors.green, fontSize: '12px' }}>{t('translate.update.ready')} {updateVersion} {t('translate.update.ready2')}</span>
                <button onClick={() => window.electron.updater.install()} style={{ background: tokens.colors.green, border: 'none', color: tokens.colors.white, padding: '4px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display }}>{t('translate.update.install')}</button>
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* SÉLECTEURS LANGUE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: tokens.colors.dim, fontSize: '10px', letterSpacing: tokens.letterSpacing.wider, marginBottom: '5px', fontFamily: tokens.fonts.display }}>{t('translate.speak')}</div>
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ width: '100%', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
            <button onClick={swapLanguages} style={{ marginTop: '18px', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.muted, width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', transition: tokens.transitions.normal, flexShrink: 0 }}>⇄</button>
            <div style={{ flex: 1 }}>
              <div style={{ color: tokens.colors.dim, fontSize: '10px', letterSpacing: tokens.letterSpacing.wider, marginBottom: '5px', fontFamily: tokens.fonts.display }}>{t('translate.hear')}</div>
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ width: '100%', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.md, fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* ZONE LIVE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '24px', background: tokens.colors.bg2, borderRadius: '16px', border: `1px solid ${liveState !== 'inactive' ? liveColors[liveState] + '44' : tokens.colors.border}`, transition: 'border-color 0.3s' }}>

            {/* ─── BOUTON LIVE — LivePulse ──────────────────────────────────── */}
            <div style={{ position: 'relative' }}>
              <LivePulse active={liveState === 'listening'} color={tokens.colors.cyan} />
              <button
                onClick={toggleLive}
                disabled={isLocked}
                style={{ width: '100px', height: '100px', borderRadius: '50%', background: liveState === 'listening' ? tokens.alpha.cyanLight : tokens.colors.bg3, border: `2px solid ${liveColors[liveState]}`, cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: tokens.transitions.normal, opacity: isLocked ? 0.7 : 1, animation: liveState === 'listening' ? 'pulse-cyan 2s ease infinite' : 'none', position: 'relative' }}
              >
                <span style={{ fontSize: '28px', color: liveColors[liveState] }}>◉</span>
                <span style={{ fontFamily: tokens.fonts.display, fontSize: '10px', color: liveColors[liveState], letterSpacing: '0.15em' }}>LIVE</span>
              </button>
            </div>

            <div style={{ color: liveColors[liveState], fontSize: '11px', fontFamily: tokens.fonts.display, letterSpacing: tokens.letterSpacing.wide }}>
              {liveState === 'inactive' ? t('translate.live.start') : liveLabels[liveState]}
            </div>

            <AnimatePresence>
              {currentTranscript && (
                <SlideUp style={{ width: '100%' }}>
                  <div style={{ padding: '8px 14px', background: tokens.alpha.cyanDim, borderRadius: tokens.radius.md, fontSize: '13px', color: tokens.colors.cyan, fontStyle: 'italic', border: `1px solid ${tokens.alpha.cyanBorder}`, textAlign: 'center' }}>
                    {currentTranscript}
                  </div>
                </SlideUp>
              )}
            </AnimatePresence>

            {errorMsg && <div style={{ color: tokens.colors.red, fontSize: '12px' }}>{errorMsg}</div>}

            {/* OTHER PLAYERS */}
            <div style={{ width: '100%', paddingTop: '12px', borderTop: `1px solid ${tokens.colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🖥️</span>
                  <div>
                    <div style={{ color: tokens.colors.text, fontSize: '11px', fontFamily: tokens.fonts.display }}>{t('translate.other.title')}</div>
                    <div style={{ color: otherColors[otherPlayersState], fontSize: '10px' }}>
                      {otherPlayersState === 'inactive' ? t('translate.other.inactive') : otherPlayersState === 'listening' ? t('translate.other.listening') : t('translate.other.processing')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setOtherPlayersTTS(!otherPlayersTTS)} style={{ background: otherPlayersTTS ? tokens.alpha.cyanMid : 'rgba(71,85,105,0.15)', border: `1px solid ${otherPlayersTTS ? tokens.colors.cyan : tokens.colors.border}`, color: otherPlayersTTS ? tokens.colors.cyan : tokens.colors.dim, padding: '4px 10px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '12px', transition: tokens.transitions.normal, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {otherPlayersTTS ? '🔊' : '🔇'}
                    <span style={{ fontFamily: tokens.fonts.display, fontSize: '9px' }}>{otherPlayersTTS ? 'VOIX' : 'TEXTE'}</span>
                  </button>
                  <button onClick={toggleOtherPlayers} style={{ background: otherPlayersState !== 'inactive' ? tokens.alpha.purpleMid : 'transparent', border: `1px solid ${otherPlayersState !== 'inactive' ? tokens.colors.purple : tokens.colors.border}`, color: otherPlayersState !== 'inactive' ? tokens.colors.purple : canUseFeature('otherPlayers') ? tokens.colors.muted : tokens.colors.veryDim, padding: '6px 14px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display, transition: tokens.transitions.normal, opacity: canUseFeature('otherPlayers') ? 1 : 0.5 }}>
                    {otherPlayersState !== 'inactive' ? t('translate.other.stop') : canUseFeature('otherPlayers') ? t('translate.other.capture') : t('translate.other.upgrade')}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {currentOtherTranscript && (
                  <SlideUp>
                    <div style={{ width: '100%', padding: '6px 12px', background: tokens.alpha.purpleDim, borderRadius: tokens.radius.sm, fontSize: '12px', color: tokens.colors.purple, fontStyle: 'italic' }}>
                      {currentOtherTranscript}
                    </div>
                  </SlideUp>
                )}
              </AnimatePresence>
              {otherError && <div style={{ color: tokens.colors.red, fontSize: '11px', marginTop: '4px' }}>{otherError}</div>}
            </div>
          </div>

          {/* FEED */}
          <div style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${tokens.colors.border}` }}>
              <button onClick={() => setActiveTab('my')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: activeTab === 'my' ? tokens.colors.cyan : tokens.colors.dim, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display, letterSpacing: tokens.letterSpacing.normal, borderBottom: activeTab === 'my' ? `2px solid ${tokens.colors.cyan}` : '2px solid transparent', transition: tokens.transitions.normal }}>
                {t('translate.feed.my')} {myFeed.length > 0 && <span style={{ background: tokens.alpha.cyanLight, borderRadius: tokens.radius.full, padding: '1px 6px', marginLeft: '4px' }}>{myFeed.length}</span>}
              </button>
              <button onClick={() => setActiveTab('other')} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: activeTab === 'other' ? tokens.colors.purple : tokens.colors.dim, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display, letterSpacing: tokens.letterSpacing.normal, borderBottom: activeTab === 'other' ? `2px solid ${tokens.colors.purple}` : '2px solid transparent', transition: tokens.transitions.normal }}>
                {t('translate.feed.other')} {otherFeed.length > 0 && <span style={{ background: tokens.alpha.purpleDim, borderRadius: tokens.radius.full, padding: '1px 6px', marginLeft: '4px' }}>{otherFeed.length}</span>}
              </button>
            </div>
            <div ref={activeTab === 'my' ? myFeedRef : otherFeedRef} style={{ height: '220px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTab === 'my' ? (
                myFeed.length === 0 ? (
                  <div style={{ color: tokens.colors.dim, fontSize: '12px', textAlign: 'center', marginTop: '70px' }}>{t('translate.feed.empty')}</div>
                ) : (
                  myFeed.map(item => (
                    <AnimFeedItem key={item.id} style={{ background: tokens.colors.bg3, borderRadius: tokens.radius.md, padding: '9px 12px', border: `1px solid ${tokens.colors.border}` }}>
                      <div style={{ color: tokens.colors.muted, fontSize: '11px', marginBottom: '3px' }}>{item.original}</div>
                      <div style={{ color: tokens.colors.cyan, fontSize: '12px', marginBottom: '2px' }}>→ {item.translated}</div>
                      <div style={{ color: tokens.colors.veryDim, fontSize: '10px' }}>{item.timestamp}</div>
                    </AnimFeedItem>
                  ))
                )
              ) : (
                otherFeed.length === 0 ? (
                  <div style={{ color: tokens.colors.dim, fontSize: '12px', textAlign: 'center', marginTop: '70px' }}>
                    {canUseFeature('otherPlayers') ? t('translate.feed.other.empty') : t('translate.feed.other.locked')}
                  </div>
                ) : (
                  otherFeed.map(item => (
                    <AnimFeedItem key={item.id} style={{ background: tokens.colors.bg3, borderRadius: tokens.radius.md, padding: '9px 12px', border: `1px solid ${tokens.colors.border}` }}>
                      <div style={{ color: tokens.colors.muted, fontSize: '11px', marginBottom: '3px' }}>{item.original}</div>
                      <div style={{ color: tokens.colors.purple, fontSize: '12px', marginBottom: '2px' }}>→ {item.translated}</div>
                      <div style={{ color: tokens.colors.veryDim, fontSize: '10px' }}>{item.timestamp}</div>
                    </AnimFeedItem>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PANNEAU DROIT */}
      <div style={{ width: rightPanelOpen ? tokens.layout.rightPanelWidth : '0px', overflow: 'hidden', transition: tokens.transitions.panel, background: tokens.colors.bgSide, borderLeft: `1px solid ${tokens.colors.borderDark}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ width: tokens.layout.rightPanelWidth, height: '100%', overflowY: 'auto', padding: '16px 14px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontFamily: tokens.fonts.display, fontSize: '10px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide }}>{t('translate.effects.title')}</div>
              {canUseFeature('voiceEffects') && <span style={{ color: tokens.colors.dim, fontSize: '10px' }}>{activeEffect !== 'normal' ? `✅ ${EFFECTS.find(e => e.id === activeEffect)?.name}` : 'Normal'}</span>}
            </div>
            {!canUseFeature('voiceEffects') ? (
              <button onClick={() => navigate('/pricing')} style={{ width: '100%', background: 'transparent', border: `1px solid ${tokens.colors.cyan}`, color: tokens.colors.cyan, padding: '8px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '11px', fontFamily: tokens.fonts.display }}>{t('translate.effects.unlock')}</button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? tokens.alpha.cyanMid : 'transparent', border: `1px solid ${selectedCategory === cat ? tokens.colors.cyan : tokens.colors.border}`, color: selectedCategory === cat ? tokens.colors.cyan : tokens.colors.dim, padding: '2px 8px', borderRadius: tokens.radius.full, cursor: 'pointer', fontSize: '10px', transition: tokens.transitions.normal }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {filteredEffects.map((effect: VoiceEffect) => {
                    const isActive = activeEffect === effect.id
                    const isPreviewing = previewingEffect === effect.id
                    return (
                      <div key={effect.id} className="effect-card" onClick={() => setActiveEffect(effect.id)} style={{ position: 'relative', background: isActive ? tokens.alpha.cyanMid : tokens.colors.bg3, border: `1px solid ${isActive ? tokens.colors.cyan : tokens.colors.border}`, borderRadius: tokens.radius.lg, padding: '8px 4px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transition: tokens.transitions.normal }}>
                        <div style={{ fontSize: '18px', lineHeight: 1 }}>{effect.emoji}</div>
                        <div style={{ color: isActive ? tokens.colors.cyan : tokens.colors.muted, fontSize: '9px', textAlign: 'center', fontFamily: tokens.fonts.display, lineHeight: 1.2 }}>{effect.name}</div>
                        {isActive && <div style={{ position: 'absolute', top: '3px', right: '3px', width: '5px', height: '5px', background: tokens.colors.cyan, borderRadius: '50%' }} />}
                        {effect.id !== 'normal' && (
                          <button className="preview-btn" onClick={(e) => previewEffect(effect, e)} style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', background: isPreviewing ? tokens.colors.cyan : tokens.colors.border, border: `1px solid ${isPreviewing ? tokens.colors.cyan : tokens.colors.borderMuted}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: tokens.colors.white, opacity: isPreviewing ? 1 : 0, transition: tokens.transitions.normal, zIndex: 2 }}>
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
              <div style={{ fontFamily: tokens.fonts.display, fontSize: '10px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide }}>{t('translate.phrases.title')}</div>
              {detectedGame && <span style={{ color: tokens.colors.purple, fontSize: '9px', fontFamily: tokens.fonts.display }}>{detectedGameEmoji} {detectedGame}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {quickPhrases.map(phrase => (
                <button key={phrase} className="quick-phrase-btn" onClick={() => handleQuickPhrase(phrase)} style={{ background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: tokens.colors.muted, padding: '6px 10px', borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: '11px', textAlign: 'left', transition: tokens.transitions.fast }}>{phrase}</button>
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