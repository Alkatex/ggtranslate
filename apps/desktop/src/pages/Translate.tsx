import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPanel } from '../components/SettingsPanel'
import { TranslationPipeline, PipelineState } from '../lib/pipeline'
import { startOtherPlayers, stopOtherPlayers, OtherPlayersState } from '../lib/otherPlayersPipeline'
import { useAuthStore } from '../store/auth'
import { getAvailableLanguages } from '../lib/languages'
import { getAvailableEffects, VoiceEffect, applyVoiceEffect } from '../lib/voiceEffects'
import { translateText } from '../lib/translation'
import { speakTranslation } from '../lib/tts'

const API_URL = 'https://ggtranslatebackend-production.up.railway.app'

interface FeedItem {
  id: number
  original: string
  translated: string
  timestamp: string
}

let feedCounter = 0

export function TranslatePage() {
  const navigate = useNavigate()
  const { plan, secondsRemaining, canUseFeature, signOut } = useAuthStore()
  const LANGUAGES = getAvailableLanguages(plan)
  const EFFECTS = getAvailableEffects(plan)

  const [sourceLang, setSourceLang] = useState('fr')
  const [targetLang, setTargetLang] = useState('en')
  const [liveState, setLiveState] = useState<PipelineState>('inactive')
  const [activeEffect, setActiveEffect] = useState('normal')
  const [previewingEffect, setPreviewingEffect] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
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

  const pipelineRef = useRef<TranslationPipeline | null>(null)
  const myFeedRef = useRef<HTMLDivElement>(null)
  const otherFeedRef = useRef<HTMLDivElement>(null)
  const currentTranscriptRef = useRef('')
  const currentOtherTranscriptRef = useRef('')

  const categories = ['Tous', ...Array.from(new Set(EFFECTS.map(e => e.category)))]
  const filteredEffects = selectedCategory === 'Tous'
    ? EFFECTS
    : EFFECTS.filter(e => e.category === selectedCategory)

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
    return () => {
      pipelineRef.current?.stop()
      stopOtherPlayers()
    }
  }, [])

  useEffect(() => {
    if (myFeedRef.current) myFeedRef.current.scrollTop = myFeedRef.current.scrollHeight
  }, [myFeed])

  useEffect(() => {
    if (otherFeedRef.current) otherFeedRef.current.scrollTop = otherFeedRef.current.scrollHeight
  }, [otherFeed])

  useEffect(() => {
    if (plan === 'pro') return
    if (liveState !== 'listening' && liveState !== 'processing') return
    const interval = setInterval(() => {
      useAuthStore.getState().consumeSeconds(1)
    }, 1000)
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
    window.electron.updater?.onUpdateAvailable((version: string) => {
      setUpdateVersion(version)
    })
    window.electron.updater?.onUpdateDownloaded(() => {
      setUpdateDownloaded(true)
    })
    return () => window.electron.updater?.removeListeners()
  }, [])

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const previewEffect = async (effect: VoiceEffect, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canUseFeature('voiceEffects')) return
    if (previewingEffect === effect.id) return

    setPreviewingEffect(effect.id)
    try {
      const sampleText = targetLang === 'fr' ? 'Bonjour ceci est un test' : 'Hello this is a test'
      const voice = targetLang === 'fr' ? 'aura-2-agathe-fr' : 'aura-2-thalia-en'

      const res = await fetch(`${API_URL}/ai/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        await audio.play()
        return
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
    } catch (err) {
      console.error('Preview error:', err)
      setPreviewingEffect(null)
    }
  }

  const toggleLive = async () => {
    if (liveState === 'inactive') {
      setCurrentTranscript('')
      currentTranscriptRef.current = ''
      setErrorMsg('')
      await pipelineRef.current?.start({
        micDeviceId, headsetDeviceId, virtualDeviceId,
        sourceLang, targetLang, voiceEffect: activeEffect,
        onStateChange: (state) => setLiveState(state),
        onTranscript: (text, _isFinal) => {
          setCurrentTranscript(text)
          currentTranscriptRef.current = text
        },
        onTranslated: (text) => {
          setMyFeed(prev => [...prev, {
            id: ++feedCounter,
            original: currentTranscriptRef.current,
            translated: text,
            timestamp: new Date().toLocaleTimeString(),
          }])
          setCurrentTranscript('')
          currentTranscriptRef.current = ''
          setSessionPhrases(prev => prev + 1)
        },
        onError: (error) => {
          setErrorMsg(error)
          setLiveState('error')
        },
      })
    } else {
      pipelineRef.current?.stop()
      setLiveState('inactive')
      setCurrentTranscript('')
      currentTranscriptRef.current = ''
    }
  }

  const toggleOtherPlayers = async () => {
    if (!canUseFeature('otherPlayers')) {
      setOtherError('⬆️ Upgrade vers Starter pour traduire les autres joueurs')
      return
    }
    if (otherPlayersState === 'inactive') {
      setCurrentOtherTranscript('')
      currentOtherTranscriptRef.current = ''
      setOtherError('')
      await startOtherPlayers({
        headsetDeviceId, virtualDeviceId,
        sourceLang: targetLang, targetLang: sourceLang,
        onStateChange: setOtherPlayersState,
        onTranscript: (text, _isFinal) => {
          setCurrentOtherTranscript(text)
          currentOtherTranscriptRef.current = text
        },
        onTranslated: (text) => {
          setOtherFeed(prev => [...prev, {
            id: ++feedCounter,
            original: currentOtherTranscriptRef.current,
            translated: text,
            timestamp: new Date().toLocaleTimeString(),
          }])
          setCurrentOtherTranscript('')
          currentOtherTranscriptRef.current = ''
          setSessionPhrases(prev => prev + 1)
        },
        onError: (error) => {
          setOtherError(error)
          setOtherPlayersState('error')
        },
      })
    } else {
      stopOtherPlayers()
      setOtherPlayersState('inactive')
      setCurrentOtherTranscript('')
      currentOtherTranscriptRef.current = ''
    }
  }

  const handleQuickPhrase = async (phrase: string) => {
    const text = phrase.replace(/^\S+\s/, '')
    try {
      const translated = await translateText(text, sourceLang, targetLang)
      const outputDevice = virtualDeviceId || headsetDeviceId
      await speakTranslation(translated, outputDevice, targetLang, activeEffect)
      setMyFeed(prev => [...prev, {
        id: ++feedCounter,
        original: text, translated,
        timestamp: new Date().toLocaleTimeString(),
      }])
      setSessionPhrases(prev => prev + 1)
    } catch (err) {
      console.error('Erreur phrase rapide:', err)
    }
  }

  const liveColors: Record<PipelineState, string> = {
    inactive: '#475569', listening: '#06b6d4',
    processing: '#3b82f6', translated: '#22c55e', error: '#ef4444',
  }
  const liveLabels: Record<PipelineState, string> = {
    inactive: 'SESSION INACTIVE', listening: '● ÉCOUTE EN COURS',
    processing: '⟳ TRADUCTION...', translated: '✓ TRADUIT', error: '! ERREUR',
  }
  const otherColors: Record<OtherPlayersState, string> = {
    inactive: '#475569', listening: '#a855f7',
    processing: '#3b82f6', error: '#ef4444',
  }
  const otherLabels: Record<OtherPlayersState, string> = {
    inactive: 'INACTIF', listening: '● CAPTURE EN COURS',
    processing: '⟳ TRADUCTION...', error: '! ERREUR',
  }

  const isLocked = liveState === 'processing'
  const isLowTime = plan !== 'pro' && secondsRemaining > 0 && secondsRemaining <= 120
  const planColor = plan === 'pro' ? '#a855f7' : plan === 'starter' ? '#3b82f6' : plan === 'trial' ? '#06b6d4' : '#64748b'
  const planLabel = plan === 'pro' ? '⚡ PRO' : plan === 'starter' ? '🚀 STARTER' : plan === 'trial' ? '⭐ TRIAL' : '🆓 FREE'

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '0 24px 24px',
      maxWidth: '800px', margin: '0 auto',
    }}>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes badge-pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .effect-card:hover { border-color: #06b6d4 !important; background: rgba(6,182,212,0.08) !important; }
        .effect-card:hover .preview-btn { opacity: 1 !important; }
      `}</style>

      {/* BADGE SESSION */}
      {showSessionBadge && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
          borderRadius: '99px', padding: '10px 20px',
          zIndex: 200, animation: 'badge-pop 0.4s ease',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>
            {sessionPhrases} phrases traduites cette session !
          </span>
        </div>
      )}

      {/* POPUP UPGRADE */}
      {showUpgradePopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#0d1424', border: '1px solid rgba(249,115,22,0.5)',
            borderRadius: '20px', padding: '32px',
            maxWidth: '420px', width: '100%', textAlign: 'center',
            animation: 'slide-down 0.3s ease',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
              Ton trial est terminé
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              Tu as traduit <strong style={{ color: '#06b6d4' }}>{sessionPhrases} phrases</strong> cette session.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => { setShowUpgradePopup(false); navigate('/pricing') }} style={{
                background: 'linear-gradient(to right, #f97316, #ef4444)',
                border: 'none', color: '#fff', padding: '14px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
              }}>⚡ Upgrade maintenant</button>
              <button onClick={() => setShowUpgradePopup(false)} style={{
                background: 'transparent', border: '1px solid #1e2d45', color: '#475569',
                padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
              }}>Continuer en Free (10 min/jour)</button>
            </div>
            <div style={{ color: '#475569', fontSize: '11px' }}>
              Starter à 7,99$/mois · Pro à 14,99$/mois · Annulation en 1 clic
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 0', borderBottom: '1px solid #1e2d45', marginBottom: '24px',
      }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px' }}>TRADUCTION VOCALE GAMING</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>⚙️</button>
          <button onClick={() => window.electron.overlay.open()} title="Mode overlay" style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>⧉</button>
          <button onClick={() => navigate('/groups')} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif' }}>Groupes</button>
          <button onClick={() => navigate('/pricing')} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif' }}>Plans</button>
        </div>
      </div>

      {/* BANNIÈRE AUTO-UPDATE */}
      {updateDownloaded && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#22c55e', fontSize: '13px' }}>
            🚀 Mise à jour {updateVersion} prête à installer
          </span>
          <button onClick={() => window.electron.updater.install()} style={{
            background: '#22c55e', border: 'none', color: '#fff',
            padding: '6px 14px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif',
          }}>Installer →</button>
        </div>
      )}

      {/* PLAN STATUS */}
      <div style={{
        background: '#0d1424', border: `1px solid ${isLowTime ? 'rgba(239,68,68,0.5)' : '#1e2d45'}`,
        borderRadius: '12px', padding: '16px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: isLowTime ? 'pulse-red 1s ease infinite' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ background: `${planColor}22`, color: planColor, padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', border: `1px solid ${planColor}44` }}>{planLabel}</span>
          {plan !== 'pro' && secondsRemaining > 0 && (
            <div style={{ color: isLowTime ? '#ef4444' : '#94a3b8', fontSize: '12px', fontWeight: isLowTime ? 700 : 400 }}>
              <span style={{ color: isLowTime ? '#ef4444' : '#fff', fontWeight: 600 }}>
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
              </span> restantes
            </div>
          )}
          {plan === 'pro' && <div style={{ color: '#a855f7', fontSize: '12px' }}>∞ Illimité</div>}
          {virtualDeviceId && <div style={{ color: '#22c55e', fontSize: '11px' }}>🎮 GGTranslate Mic actif</div>}
          {sessionPhrases > 0 && <div style={{ color: '#475569', fontSize: '11px' }}>🗣️ {sessionPhrases} phrases</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(plan === 'free' || plan === 'trial') && (
            <button onClick={() => navigate('/pricing')} style={{ background: 'transparent', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '12px' }}>Upgrade →</button>
          )}
          <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px' }}>Déconnexion</button>
        </div>
      </div>

      {/* LANGUAGE SELECTOR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>JE PARLE</div>
          <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <button onClick={swapLanguages} style={{ marginTop: '24px', background: '#0d1424', border: '1px solid #1e2d45', color: '#94a3b8', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>⇄</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>J&apos;ENTENDS</div>
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
      </div>

      {/* MA VOIX */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#06b6d4', fontSize: '16px' }}>🎤</span>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#fff', letterSpacing: '0.1em' }}>MA VOIX</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>
                {micDeviceId ? '✅ Micro configuré' : 'Micro par défaut'}
                {virtualDeviceId ? ' · 🎮 Sortie Discord active' : ''}
              </div>
            </div>
          </div>
          <div style={{ color: liveColors[liveState], fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>
            {liveState === 'inactive' ? '● APPUIE POUR DÉMARRER' : liveLabels[liveState]}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0', borderBottom: '1px solid #1e2d45', marginBottom: '16px' }}>
          <button onClick={toggleLive} disabled={isLocked} style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background: '#111827', border: `2px solid ${liveColors[liveState]}`,
            cursor: isLocked ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '4px', transition: 'all 0.2s',
            boxShadow: liveState === 'listening' ? '0 0 20px rgba(6,182,212,0.3)' : 'none',
            opacity: isLocked ? 0.7 : 1,
          }}>
            <span style={{ fontSize: '24px', color: liveColors[liveState] }}>◉</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: liveColors[liveState], letterSpacing: '0.15em' }}>LIVE</span>
          </button>
          <div style={{ color: liveColors[liveState], fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{liveLabels[liveState]}</div>
          {currentTranscript && (
            <div style={{ width: '100%', padding: '8px 16px', background: 'rgba(6,182,212,0.05)', borderRadius: '8px', fontSize: '13px', color: '#06b6d4', fontStyle: 'italic', border: '1px solid rgba(6,182,212,0.15)' }}>
              {currentTranscript}
            </div>
          )}
          {errorMsg && <div style={{ color: '#ef4444', fontSize: '12px' }}>{errorMsg}</div>}
        </div>

        {/* FEED */}
        <div ref={myFeedRef} style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {myFeed.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '16px' }}>Les traductions apparaîtront ici</div>
          ) : (
            myFeed.map(item => (
              <div key={item.id} style={{ background: '#111827', borderRadius: '8px', padding: '10px 14px', border: '1px solid #1e2d45' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{item.original}</div>
                <div style={{ color: '#06b6d4', fontSize: '13px', marginBottom: '4px' }}>→ {item.translated}</div>
                <div style={{ color: '#475569', fontSize: '10px' }}>{item.timestamp}</div>
              </div>
            ))
          )}
        </div>

        {/* EFFETS DE VOIX */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em' }}>🎛️ EFFETS DE VOIX</div>
            {!canUseFeature('voiceEffects') ? (
              <span onClick={() => navigate('/pricing')} style={{ color: '#475569', fontSize: '11px', cursor: 'pointer' }}>🔒 Unlock Starter</span>
            ) : (
              <span style={{ color: '#06b6d4', fontSize: '11px' }}>
                {activeEffect !== 'normal' ? `✅ ${EFFECTS.find(e => e.id === activeEffect)?.emoji} ${EFFECTS.find(e => e.id === activeEffect)?.name}` : 'Normal'}
              </span>
            )}
          </div>

          {canUseFeature('voiceEffects') && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  background: selectedCategory === cat ? 'rgba(6,182,212,0.15)' : 'transparent',
                  border: `1px solid ${selectedCategory === cat ? '#06b6d4' : '#1e2d45'}`,
                  color: selectedCategory === cat ? '#06b6d4' : '#475569',
                  padding: '3px 10px', borderRadius: '99px',
                  cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s',
                }}>{cat}</button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
            {filteredEffects.map((effect: VoiceEffect) => {
              const isActive = activeEffect === effect.id
              const isPreviewing = previewingEffect === effect.id
              const effectLocked = !canUseFeature('voiceEffects')

              return (
                <div key={effect.id} className="effect-card" onClick={() => !effectLocked && setActiveEffect(effect.id)} style={{
                  position: 'relative',
                  background: isActive ? 'rgba(6,182,212,0.15)' : '#111827',
                  border: `1px solid ${isActive ? '#06b6d4' : '#1e2d45'}`,
                  borderRadius: '12px', padding: '10px 6px 8px',
                  cursor: effectLocked ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  transition: 'all 0.2s', opacity: effectLocked ? 0.4 : 1,
                  boxShadow: isActive ? '0 0 12px rgba(6,182,212,0.2)' : 'none',
                }}>
                  <div style={{ fontSize: '20px', lineHeight: 1 }}>{effect.emoji}</div>
                  <div style={{ color: isActive ? '#06b6d4' : '#94a3b8', fontSize: '10px', textAlign: 'center', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em', lineHeight: 1.2 }}>{effect.name}</div>
                  {isActive && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: '#06b6d4', borderRadius: '50%' }}/>}
                  {!effectLocked && effect.id !== 'normal' && (
                    <button className="preview-btn" onClick={(e) => previewEffect(effect, e)} style={{
                      position: 'absolute', bottom: '-4px', right: '-4px',
                      width: '20px', height: '20px',
                      background: isPreviewing ? '#06b6d4' : '#1e2d45',
                      border: `1px solid ${isPreviewing ? '#06b6d4' : '#334155'}`,
                      borderRadius: '50%', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', color: '#fff',
                      opacity: isPreviewing ? 1 : 0,
                      transition: 'all 0.2s', zIndex: 2,
                    }}>
                      {isPreviewing ? (
                        <div style={{ width: '8px', height: '8px', border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                      ) : '▶'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {!canUseFeature('voiceEffects') && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={() => navigate('/pricing')} style={{
                background: 'transparent', border: '1px solid #06b6d4',
                color: '#06b6d4', padding: '8px 20px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif',
              }}>🔒 Débloquer les effets — Starter</button>
            </div>
          )}
        </div>
      </div>

      {/* AUTRES JOUEURS */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🖥️</span>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#fff', letterSpacing: '0.1em' }}>AUTRES JOUEURS</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>
                {canUseFeature('otherPlayers') ? 'Capture audio système native Windows' : '🔒 Disponible en Starter et Pro'}
              </div>
            </div>
          </div>
          <div style={{ color: otherColors[otherPlayersState], fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{otherLabels[otherPlayersState]}</div>
        </div>

        <button onClick={toggleOtherPlayers} style={{
          background: otherPlayersState !== 'inactive' ? 'rgba(168,85,247,0.15)' : 'transparent',
          border: `1px solid ${otherPlayersState !== 'inactive' ? '#a855f7' : '#1e2d45'}`,
          color: otherPlayersState !== 'inactive' ? '#a855f7' : canUseFeature('otherPlayers') ? '#94a3b8' : '#334155',
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
          fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'Orbitron, sans-serif', marginBottom: '12px',
          transition: 'all 0.2s', opacity: canUseFeature('otherPlayers') ? 1 : 0.6,
        }}>
          {otherPlayersState !== 'inactive' ? '⏹ ARRÊTER' : canUseFeature('otherPlayers') ? '🖥️ CAPTURER' : '🔒 UPGRADE REQUIS'}
        </button>

        {currentOtherTranscript && (
          <div style={{ padding: '8px 16px', marginBottom: '8px', background: 'rgba(168,85,247,0.05)', borderRadius: '8px', fontSize: '13px', color: '#a855f7', fontStyle: 'italic', border: '1px solid rgba(168,85,247,0.15)' }}>
            {currentOtherTranscript}
          </div>
        )}

        <div ref={otherFeedRef} style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {otherFeed.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
              {canUseFeature('otherPlayers')
                ? otherPlayersState === 'inactive' ? 'Clique "Capturer" pour traduire les autres joueurs' : 'En attente de voix...'
                : '⬆️ Upgrade vers Starter pour débloquer cette feature'}
            </div>
          ) : (
            otherFeed.map(item => (
              <div key={item.id} style={{ background: '#111827', borderRadius: '8px', padding: '10px 14px', border: '1px solid #1e2d45' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{item.original}</div>
                <div style={{ color: '#a855f7', fontSize: '13px', marginBottom: '4px' }}>→ {item.translated}</div>
                <div style={{ color: '#475569', fontSize: '10px' }}>{item.timestamp}</div>
              </div>
            ))
          )}
        </div>

        {otherError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{otherError}</div>}
      </div>

      {/* PHRASES RAPIDES */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '12px' }}>⚡ PHRASES RAPIDES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré', '💉 Soins', '📦 On recule', '🏃 Suivez-moi', '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement', '🔴 Regroupez-vous', '⚡ On pousse'].map(phrase => (
            <button key={phrase} onClick={() => handleQuickPhrase(phrase)} style={{
              background: 'transparent', border: '1px solid #1e2d45',
              color: '#94a3b8', padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s',
            }}>{phrase}</button>
          ))}
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <SettingsPanel
          onClose={(mic, headset, virtual) => {
            setMicDeviceId(mic)
            setHeadsetDeviceId(headset)
            setVirtualDeviceId(virtual)
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}