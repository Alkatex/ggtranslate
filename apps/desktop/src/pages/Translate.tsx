import { useState, useEffect, useRef } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { TranslationPipeline, PipelineState } from '../lib/pipeline'
import { startOtherPlayers, stopOtherPlayers, OtherPlayersState } from '../lib/otherPlayersPipeline'

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

export function TranslatePage() {
  const [sourceLang, setSourceLang] = useState('fr')
  const [targetLang, setTargetLang] = useState('en')
  const [liveState, setLiveState] = useState<PipelineState>('inactive')
  const [activeEffect, setActiveEffect] = useState('normal')
  const [showSettings, setShowSettings] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [translated, setTranslated] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [micDeviceId, setMicDeviceId] = useState<string | null>(null)
  const [headsetDeviceId, setHeadsetDeviceId] = useState<string | null>(null)
  const [otherPlayersState, setOtherPlayersState] = useState<OtherPlayersState>('inactive')
  const [otherTranscript, setOtherTranscript] = useState('')
  const [otherTranslated, setOtherTranslated] = useState('')
  const [otherError, setOtherError] = useState('')

  const pipelineRef = useRef<TranslationPipeline | null>(null)

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

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const toggleLive = async () => {
    if (liveState === 'inactive') {
      setTranscript('')
      setTranslated('')
      setErrorMsg('')
      await pipelineRef.current?.start({
        micDeviceId,
        headsetDeviceId,
        sourceLang,
        targetLang,
        onStateChange: (state) => setLiveState(state),
        onTranscript: (text, _isFinal) => setTranscript(text),
        onTranslated: (text) => setTranslated(text),
        onError: (error) => {
          setErrorMsg(error)
          setLiveState('error')
        },
      })
    } else {
      pipelineRef.current?.stop()
      setLiveState('inactive')
    }
  }

  const toggleOtherPlayers = async () => {
    if (otherPlayersState === 'inactive') {
      setOtherTranscript('')
      setOtherTranslated('')
      setOtherError('')
      await startOtherPlayers({
        headsetDeviceId,
        sourceLang: targetLang,
        targetLang: sourceLang,
        onStateChange: setOtherPlayersState,
        onTranscript: (text, _isFinal) => setOtherTranscript(text),
        onTranslated: (text) => setOtherTranslated(text),
        onError: (error) => {
          setOtherError(error)
          setOtherPlayersState('error')
        },
      })
    } else {
      stopOtherPlayers()
      setOtherPlayersState('inactive')
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
            background: 'rgba(6,182,212,0.15)',
            color: '#06b6d4', padding: '4px 12px',
            borderRadius: '99px', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            border: '1px solid rgba(6,182,212,0.3)',
          }}>⭐ FREE TRIAL</span>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>30</span> min restantes
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>3</span> langues
          </div>
        </div>
        <button style={{
          background: 'transparent', border: 'none',
          color: '#06b6d4', cursor: 'pointer', fontSize: '12px',
        }}>Upgrade →</button>
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

        <button
          onClick={swapLanguages}
          style={{
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

      {/* MA VOIX + EFFETS */}
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
            letterSpacing: '0.08em',
          }}>
            {liveState === 'inactive'
              ? '● APPUIE POUR DÉMARRER'
              : liveLabels[liveState]}
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
          padding: '20px 0',
          borderBottom: '1px solid #1e2d45',
          marginBottom: '20px',
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
            letterSpacing: '0.1em',
          }}>{liveLabels[liveState]}</div>

          <div style={{
            width: '100%', minHeight: '60px',
            background: '#111827', borderRadius: '8px',
            padding: '12px 16px', fontSize: '14px',
            color: '#94a3b8', lineHeight: 1.6,
          }}>
            {liveState === 'inactive' && !transcript && (
              <span style={{ color: '#475569' }}>— — — — — — — — —</span>
            )}
            {transcript && (
              <div>
                <span style={{ color: '#fff' }}>{transcript}</span>
                {translated && (
                  <div style={{
                    marginTop: '8px', paddingTop: '8px',
                    borderTop: '1px solid #1e2d45',
                    color: '#06b6d4', fontSize: '14px',
                  }}>→ {translated}</div>
                )}
              </div>
            )}
            {errorMsg && (
              <span style={{ color: '#ef4444' }}>{errorMsg}</span>
            )}
          </div>
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
            <span style={{ color: '#475569', fontSize: '11px', cursor: 'pointer' }}>
              🔒 Unlock Starter
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EFFECTS.map(effect => (
              <button
                key={effect}
                onClick={() => setActiveEffect(effect.toLowerCase())}
                style={{
                  background: activeEffect === effect.toLowerCase()
                    ? 'rgba(6,182,212,0.15)' : 'transparent',
                  border: `1px solid ${activeEffect === effect.toLowerCase()
                    ? '#06b6d4' : '#1e2d45'}`,
                  color: activeEffect === effect.toLowerCase()
                    ? '#06b6d4' : '#94a3b8',
                  padding: '6px 14px', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '12px',
                  transition: 'all 0.2s',
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
                Capture audio système native Windows
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
            color: otherPlayersState !== 'inactive' ? '#a855f7' : '#94a3b8',
            padding: '8px 16px',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '12px', display: 'flex',
            alignItems: 'center', gap: '8px',
            fontFamily: 'Orbitron, sans-serif',
            marginBottom: '12px',
            transition: 'all 0.2s',
          }}>
          {otherPlayersState !== 'inactive' ? '⏹ ARRÊTER' : '🖥️ CAPTURER'}
        </button>

        <div style={{
          padding: '12px', background: '#111827',
          borderRadius: '8px', fontSize: '13px',
          color: '#94a3b8', lineHeight: 1.6,
          border: '1px solid #1e2d45',
          minHeight: '60px',
        }}>
          {otherPlayersState === 'inactive' && !otherTranscript && (
            <span style={{ color: '#475569', fontSize: '12px' }}>
              Clique "Capturer" pour traduire les autres joueurs en temps réel.
            </span>
          )}
          {otherTranscript && (
            <div>
              <span style={{ color: '#fff' }}>{otherTranscript}</span>
              {otherTranslated && (
                <div style={{
                  marginTop: '8px', paddingTop: '8px',
                  borderTop: '1px solid #1e2d45',
                  color: '#a855f7', fontSize: '13px',
                }}>→ {otherTranslated}</div>
              )}
            </div>
          )}
          {otherError && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{otherError}</span>
          )}
        </div>
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