import { useState, useEffect, useRef } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { TranslationPipeline, PipelineState } from '../lib/pipeline'
import { startOtherPlayers, stopOtherPlayers, OtherPlayersState } from '../lib/otherPlayersPipeline'
import { useAuthStore } from '../store/auth'

const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
]

const EFFECTS = ['Normal', 'Robot', 'Deep', 'Chipmunk', 'Alien', 'Ghost']

interface FeedItem {
  id: number
  original: string
  translated: string
  timestamp: string
}

let feedCounter = 0

export function TranslatePage() {
  const { plan, secondsRemaining, canUseFeature, signOut } = useAuthStore()

  const [sourceLang, setSourceLang] = useState('fr')
  const [targetLang, setTargetLang] = useState('en')
  const [liveState, setLiveState] = useState<PipelineState>('inactive')
  const [activeEffect, setActiveEffect] = useState('normal')
  const [showSettings, setShowSettings] = useState(false)
  const [micDeviceId, setMicDeviceId] = useState<string | null>(null)
  const [headsetDeviceId, setHeadsetDeviceId] = useState<string | null>(null)

  const [currentTranscript, setCurrentTranscript] = useState('')
  const [myFeed, setMyFeed] = useState<FeedItem[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const [otherPlayersState, setOtherPlayersState] = useState<OtherPlayersState>('inactive')
  const [currentOtherTranscript, setCurrentOtherTranscript] = useState('')
  const [otherFeed, setOtherFeed] = useState<FeedItem[]>([])
  const [otherError, setOtherError] = useState('')

  const pipelineRef = useRef<TranslationPipeline | null>(null)
  const myFeedRef = useRef<HTMLDivElement>(null)
  const otherFeedRef = useRef<HTMLDivElement>(null)
  const currentTranscriptRef = useRef('')
  const currentOtherTranscriptRef = useRef('')

  useEffect(() => {
    pipelineRef.current = new TranslationPipeline()
    async function loadSavedDevices() {
      const savedMic = await window.electron.settings.get('micDeviceId') as string
      const savedHeadset = await window.electron.settings.get('headsetDeviceId') as string
      if (savedMic) setMicDeviceId(savedMic)
      if (savedHeadset) setHeadsetDeviceId(savedHeadset)
    }
    loadSavedDevices()
    return () => {
      pipelineRef.current?.stop()
      stopOtherPlayers()
    }
  }, [])

  useEffect(() => {
    if (myFeedRef.current) {
      myFeedRef.current.scrollTop = myFeedRef.current.scrollHeight
    }
  }, [myFeed])

  useEffect(() => {
    if (otherFeedRef.current) {
      otherFeedRef.current.scrollTop = otherFeedRef.current.scrollHeight
    }
  }, [otherFeed])

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const toggleLive = async () => {
    if (liveState === 'inactive') {
      setCurrentTranscript('')
      currentTranscriptRef.current = ''
      setErrorMsg('')
      await pipelineRef.current?.start({
        micDeviceId,
        headsetDeviceId,
        sourceLang,
        targetLang,
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
        headsetDeviceId,
        sourceLang: targetLang,
        targetLang: sourceLang,
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

  const liveColors: Record<PipelineState, string> = {
    inactive:   '#475569',
    listening:  '#06b6d4',
    processing: '#3b82f6',
    translated: '#22c55e',
    error:      '#ef4444',
  }

  const liveLabels: Record<PipelineState, string> = {
    inactive:   'SESSION INACTIVE',
    listening:  '● ÉCOUTE EN COURS',
    processing: '⟳ TRADUCTION...',
    translated: '✓ TRADUIT',
    error:      '! ERREUR',
  }

  const otherColors: Record<OtherPlayersState, string> = {
    inactive:   '#475569',
    listening:  '#a855f7',
    processing: '#3b82f6',
    error:      '#ef4444',
  }

  const otherLabels: Record<OtherPlayersState, string> = {
    inactive:   'INACTIF',
    listening:  '● CAPTURE EN COURS',
    processing: '⟳ TRADUCTION...',
    error:      '! ERREUR',
  }

  const isLocked = liveState === 'processing'

  const planColor = plan === 'pro' ? '#a855f7'
    : plan === 'starter' ? '#3b82f6'
    : plan === 'trial' ? '#06b6d4'
    : '#64748b'

  const planLabel = plan === 'pro' ? '⚡ PRO'
    : plan === 'starter' ? '🚀 STARTER'
    : plan === 'trial' ? '⭐ TRIAL'
    : '🆓 FREE'

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      padding: '0 24px 24px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>

      {/* NAVBAR */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid #1e2d45',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '18px',
            fontWeight: 700, letterSpacing: '0.1em',
          }}>GG TRANSLATE</div>
          <div style={{
            color: '#475569', fontSize: '10px',
            letterSpacing: '0.15em', marginTop: '2px',
          }}>TRADUCTION VOCALE GAMING</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'transparent',
              border: '1px solid #1e2d45',
              color: '#94a3b8', padding: '6px 14px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '16px',
            }}>⚙️</button>
          {['Groupes', 'Plans'].map(item => (
            <button key={item} style={{
              background: 'transparent',
              border: '1px solid #1e2d45',
              color: '#94a3b8', padding: '6px 14px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
            }}>{item}</button>
          ))}
        </div>
      </div>

      {/* PLAN STATUS */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '16px',
        marginBottom: '20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            background: `${planColor}22`,
            color: planColor,
            padding: '4px 12px',
            borderRadius: '99px', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            border: `1px solid ${planColor}44`,
          }}>
            {planLabel}
          </span>

          {secondsRemaining < 999999 && (
            <div style={{
              color: secondsRemaining < 120 ? '#ef4444' : '#94a3b8',
              fontSize: '12px',
              fontWeight: secondsRemaining < 120 ? 700 : 400,
            }}>
              <span style={{
                color: secondsRemaining < 120 ? '#ef4444' : '#fff',
                fontWeight: 600,
              }}>
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
              </span> restantes
            </div>
          )}

          {plan === 'pro' && (
            <div style={{ color: '#a855f7', fontSize: '12px' }}>
              ∞ Illimité
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(plan === 'free' || plan === 'trial') && (
            <button style={{
              background: 'transparent', border: 'none',
              color: '#06b6d4', cursor: 'pointer', fontSize: '12px',
            }}>Upgrade →</button>
          )}
          <button
            onClick={signOut}
            style={{
              background: 'transparent', border: 'none',
              color: '#475569', cursor: 'pointer', fontSize: '12px',
            }}>Déconnexion</button>
        </div>
      </div>

      {/* LANGUAGE SELECTOR */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '12px', marginBottom: '20px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#06b6d4', fontSize: '11px',
            letterSpacing: '0.1em', marginBottom: '8px',
            fontFamily: 'Orbitron, sans-serif',
          }}>JE PARLE</div>
          <select
            value={sourceLang}
            onChange={e => setSourceLang(e.target.value)}
            style={{
              width: '100%', background: '#0d1424',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '12px 16px', borderRadius: '10px',
              fontSize: '14px', cursor: 'pointer',
            }}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={swapLanguages} style={{
          marginTop: '24px', background: '#0d1424',
          border: '1px solid #1e2d45', color: '#94a3b8',
          width: '40px', height: '40px', borderRadius: '50%',
          cursor: 'pointer', fontSize: '16px',
        }}>⇄</button>

        <div style={{ flex: 1 }}>
          <div style={{
            color: '#06b6d4', fontSize: '11px',
            letterSpacing: '0.1em', marginBottom: '8px',
            fontFamily: 'Orbitron, sans-serif',
          }}>J&apos;ENTENDS</div>
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            style={{
              width: '100%', background: '#0d1424',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '12px 16px', borderRadius: '10px',
              fontSize: '14px', cursor: 'pointer',
            }}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MA VOIX */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#06b6d4', fontSize: '16px' }}>🎤</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '12px', color: '#fff',
                letterSpacing: '0.1em',
              }}>MA VOIX</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>
                {micDeviceId ? '✅ Micro configuré' : 'Micro par défaut'}
              </div>
            </div>
          </div>
          <div style={{
            color: liveColors[liveState], fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
          }}>
            {liveState === 'inactive' ? '● APPUIE POUR DÉMARRER' : liveLabels[liveState]}
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
          padding: '20px 0',
          borderBottom: '1px solid #1e2d45',
          marginBottom: '16px',
        }}>
          <button
            onClick={toggleLive}
            disabled={isLocked}
            style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#111827',
              border: `2px solid ${liveColors[liveState]}`,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px', transition: 'all 0.2s',
              boxShadow: liveState === 'listening'
                ? '0 0 20px rgba(6,182,212,0.3)' : 'none',
              opacity: isLocked ? 0.7 : 1,
            }}>
            <span style={{ fontSize: '24px', color: liveColors[liveState] }}>◉</span>
            <span style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '10px', color: liveColors[liveState],
              letterSpacing: '0.15em',
            }}>LIVE</span>
          </button>

          <div style={{
            color: liveColors[liveState], fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
          }}>{liveLabels[liveState]}</div>

          {currentTranscript && (
            <div style={{
              width: '100%', padding: '8px 16px',
              background: 'rgba(6,182,212,0.05)',
              borderRadius: '8px', fontSize: '13px',
              color: '#06b6d4', fontStyle: 'italic',
              border: '1px solid rgba(6,182,212,0.15)',
            }}>
              {currentTranscript}
            </div>
          )}

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '12px' }}>{errorMsg}</div>
          )}
        </div>

        {/* FEED MA VOIX */}
        <div
          ref={myFeedRef}
          style={{
            maxHeight: '200px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '8px',
            marginBottom: '16px',
          }}>
          {myFeed.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
              Les traductions apparaîtront ici
            </div>
          ) : (
            myFeed.map(item => (
              <div key={item.id} style={{
                background: '#111827', borderRadius: '8px',
                padding: '10px 14px', border: '1px solid #1e2d45',
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  {item.original}
                </div>
                <div style={{ color: '#06b6d4', fontSize: '13px', marginBottom: '4px' }}>
                  → {item.translated}
                </div>
                <div style={{ color: '#475569', fontSize: '10px' }}>
                  {item.timestamp}
                </div>
              </div>
            ))
          )}
        </div>

        {/* EFFETS DE VOIX */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px',
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '11px', color: '#06b6d4',
              letterSpacing: '0.1em',
            }}>🎛️ EFFETS DE VOIX</div>
            {!canUseFeature('voiceEffects') && (
              <span style={{ color: '#475569', fontSize: '11px', cursor: 'pointer' }}>
                🔒 Unlock Starter
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EFFECTS.map(effect => (
              <button
                key={effect}
                onClick={() => canUseFeature('voiceEffects') && setActiveEffect(effect.toLowerCase())}
                style={{
                  background: activeEffect === effect.toLowerCase()
                    ? 'rgba(6,182,212,0.15)' : 'transparent',
                  border: `1px solid ${activeEffect === effect.toLowerCase()
                    ? '#06b6d4' : '#1e2d45'}`,
                  color: activeEffect === effect.toLowerCase()
                    ? '#06b6d4'
                    : canUseFeature('voiceEffects') ? '#94a3b8' : '#334155',
                  padding: '6px 14px', borderRadius: '8px',
                  cursor: canUseFeature('voiceEffects') ? 'pointer' : 'not-allowed',
                  fontSize: '12px', transition: 'all 0.2s',
                  opacity: canUseFeature('voiceEffects') ? 1 : 0.5,
                }}>{effect}</button>
            ))}
          </div>
        </div>
      </div>

      {/* AUTRES JOUEURS */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🖥️</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '12px', color: '#fff',
                letterSpacing: '0.1em',
              }}>AUTRES JOUEURS</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>
                {canUseFeature('otherPlayers')
                  ? 'Capture audio système native Windows'
                  : '🔒 Disponible en Starter et Pro'}
              </div>
            </div>
          </div>
          <div style={{
            color: otherColors[otherPlayersState],
            fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
          }}>
            {otherLabels[otherPlayersState]}
          </div>
        </div>

        <button
          onClick={toggleOtherPlayers}
          style={{
            background: otherPlayersState !== 'inactive'
              ? 'rgba(168,85,247,0.15)' : 'transparent',
            border: `1px solid ${otherPlayersState !== 'inactive' ? '#a855f7' : '#1e2d45'}`,
            color: otherPlayersState !== 'inactive' ? '#a855f7'
              : canUseFeature('otherPlayers') ? '#94a3b8' : '#334155',
            padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: 'Orbitron, sans-serif',
            marginBottom: '12px', transition: 'all 0.2s',
            opacity: canUseFeature('otherPlayers') ? 1 : 0.6,
          }}>
          {otherPlayersState !== 'inactive' ? '⏹ ARRÊTER'
            : canUseFeature('otherPlayers') ? '🖥️ CAPTURER'
            : '🔒 UPGRADE REQUIS'}
        </button>

        {currentOtherTranscript && (
          <div style={{
            padding: '8px 16px', marginBottom: '8px',
            background: 'rgba(168,85,247,0.05)',
            borderRadius: '8px', fontSize: '13px',
            color: '#a855f7', fontStyle: 'italic',
            border: '1px solid rgba(168,85,247,0.15)',
          }}>
            {currentOtherTranscript}
          </div>
        )}

        <div
          ref={otherFeedRef}
          style={{
            maxHeight: '200px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
          {otherFeed.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
              {canUseFeature('otherPlayers')
                ? otherPlayersState === 'inactive'
                  ? 'Clique "Capturer" pour traduire les autres joueurs'
                  : 'En attente de voix...'
                : '⬆️ Upgrade vers Starter pour débloquer cette feature'}
            </div>
          ) : (
            otherFeed.map(item => (
              <div key={item.id} style={{
                background: '#111827', borderRadius: '8px',
                padding: '10px 14px', border: '1px solid #1e2d45',
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  {item.original}
                </div>
                <div style={{ color: '#a855f7', fontSize: '13px', marginBottom: '4px' }}>
                  → {item.translated}
                </div>
                <div style={{ color: '#475569', fontSize: '10px' }}>
                  {item.timestamp}
                </div>
              </div>
            ))
          )}
        </div>

        {otherError && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{otherError}</div>
        )}
      </div>

      {/* PHRASES RAPIDES */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '16px',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '11px', color: '#06b6d4',
          letterSpacing: '0.1em', marginBottom: '12px',
        }}>⚡ PHRASES RAPIDES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            '❌ Rush B', '💙 Couvrez-moi', '🎯 Ennemi repéré',
            '💉 Soins', '📦 On recule', '🏃 Suivez-moi',
            '💜 Grenade !', '✅ Bien joué', '🔫 Rechargement',
            '🔴 Regroupez-vous', '⚡ On pousse',
          ].map(phrase => (
            <button key={phrase} style={{
              background: 'transparent',
              border: '1px solid #1e2d45',
              color: '#94a3b8', padding: '6px 12px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px',
            }}>{phrase}</button>
          ))}
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <SettingsPanel
          onClose={(mic, headset) => {
            setMicDeviceId(mic)
            setHeadsetDeviceId(headset)
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}