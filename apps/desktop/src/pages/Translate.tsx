import { useState } from 'react'

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

type LiveState = 'inactive' | 'listening' | 'processing' | 'translated' | 'error'

export function TranslatePage() {
  const [sourceLang, setSourceLang] = useState('fr')
  const [targetLang, setTargetLang] = useState('en')
  const [liveState, setLiveState] = useState<LiveState>('inactive')

  const source = LANGUAGES.find(l => l.code === sourceLang)!
  const target = LANGUAGES.find(l => l.code === targetLang)!

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const toggleLive = () => {
    if (liveState === 'inactive') setLiveState('listening')
    else setLiveState('inactive')
  }

  const liveColors: Record<LiveState, string> = {
    inactive:   '#475569',
    listening:  '#06b6d4',
    processing: '#3b82f6',
    translated: '#22c55e',
    error:      '#ef4444',
  }

  const liveLabels: Record<LiveState, string> = {
    inactive:   'SESSION INACTIVE',
    listening:  '● ÉCOUTE EN COURS',
    processing: '⟳ TRADUCTION...',
    translated: '✓ TRADUIT',
    error:      '! ERREUR',
  }

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
          {['Groupes', 'Plans'].map(item => (
            <button key={item} style={{
              background: 'transparent',
              border: '1px solid #1e2d45',
              color: '#94a3b8', padding: '6px 14px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'Orbitron, sans-serif',
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
            }}
          >
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
          }}>J'ENTENDS</div>
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            style={{
              width: '100%', background: '#0d1424',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '12px 16px', borderRadius: '10px',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MA VOIX PANEL */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#06b6d4', fontSize: '16px' }}>🎤</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '12px', color: '#fff', letterSpacing: '0.1em',
              }}>MA VOIX</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>Microphone local</div>
            </div>
          </div>
          <div style={{
            color: liveColors[liveState],
            fontSize: '11px', fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '0.08em',
          }}>
            {liveState === 'inactive' ? '● APPUIE POUR DÉMARRER' : liveLabels[liveState]}
          </div>
        </div>

        {/* LIVE BUTTON */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px', padding: '20px 0',
        }}>
          <button
            onClick={toggleLive}
            style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#111827',
              border: `2px solid ${liveColors[liveState]}`,
              cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '4px',
              transition: 'all 0.2s',
              boxShadow: liveState === 'listening'
                ? `0 0 20px rgba(6,182,212,0.3)` : 'none',
            }}
          >
            <span style={{ fontSize: '24px', color: liveColors[liveState] }}>◉</span>
            <span style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '10px', color: liveColors[liveState],
              letterSpacing: '0.15em',
            }}>LIVE</span>
          </button>

          <div style={{
            color: liveColors[liveState],
            fontSize: '11px', fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '0.1em',
          }}>{liveLabels[liveState]}</div>
        </div>

        {/* TRANSCRIPT AREA */}
        <div style={{
          minHeight: '60px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#475569', fontSize: '13px',
        }}>
          {liveState === 'inactive' && '— — — — — — — — —'}
          {liveState === 'listening' && (
            <span style={{ color: '#06b6d4' }}>En attente de ta voix...</span>
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
    </div>
  )
}