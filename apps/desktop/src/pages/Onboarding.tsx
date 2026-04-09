import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    num: 1,
    icon: '🎮',
    title: 'Bienvenue sur GG Translate',
    subtitle: 'Parle ta langue, joue avec le monde entier',
    color: '#06b6d4',
    content: (
      <div>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          GG Translate traduit ta voix en temps réel pendant tes sessions de jeu.
          Plus de barrières de langue en partie.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '32px' }}>
          🇫🇷 🇬🇧 🇪🇸 🇩🇪 🇧🇷
        </div>
      </div>
    ),
  },
  {
    num: 2,
    icon: '🎤',
    title: 'Parle, on traduit',
    subtitle: 'Appuie sur le bouton et parle normalement',
    color: '#06b6d4',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px', textAlign: 'center' }}>
          Appuie sur le grand bouton LIVE, parle dans ta langue.
          GG Translate reconnaît ta voix et traduit instantanément.
        </p>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          border: '2px solid #06b6d4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>🎤</div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '8px' }}>
          {[4,6,8,5,9,7,6,8,5,7,4].map((h, i) => (
            <div key={i} style={{
              width: '4px', height: `${h * 3}px`,
              background: '#06b6d4', borderRadius: '2px', opacity: 0.8,
            }}/>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: 3,
    icon: '🔊',
    title: 'Tu entends la traduction',
    subtitle: 'La voix traduite sort dans tes écouteurs',
    color: '#06b6d4',
    content: (
      <div>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center' }}>
          La traduction est lue automatiquement dans la langue de ton coéquipier.
          Tu peux aussi ajouter des effets de voix fun.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎤</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Tu parles</div>
            <div style={{ color: '#06b6d4', fontSize: '12px' }}>Français</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔊</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Il entend</div>
            <div style={{ color: '#06b6d4', fontSize: '12px' }}>English</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: 4,
    icon: '👥',
    title: 'Joue en groupe',
    subtitle: 'Crée ou rejoins une salle multilingue',
    color: '#f97316',
    content: (
      <div>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center' }}>
          Avec les Groupes, plusieurs joueurs parlant des langues différentes
          peuvent communiquer ensemble en temps réel.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {[
            { code: 'FR', lang: 'FR', color: '#3b82f6' },
            { code: 'GB', lang: 'EN', color: '#3b82f6' },
            { code: 'ES', lang: 'ES', color: '#f97316' },
          ].map(l => (
            <div key={l.code} style={{
              width: '64px', height: '64px',
              border: `2px solid ${l.color}`,
              borderRadius: '10px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px',
            }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>{l.code}</span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>{l.lang}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const current = STEPS[step]

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* TITRE */}
      <h1 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#06b6d4', fontSize: '24px',
        letterSpacing: '0.15em', marginBottom: '24px',
      }}>GG TRANSLATE</h1>

      {/* PROGRESS DOTS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            height: '6px',
            width: i === step ? '24px' : '6px',
            borderRadius: '99px',
            background: i === step ? '#3b82f6' : '#1e2d45',
            transition: 'all 0.3s',
          }}/>
        ))}
      </div>

      {/* CARD */}
      <div style={{
        background: '#0d1424',
        border: `1px solid ${step === 3 ? 'rgba(249,115,22,0.3)' : '#1e2d45'}`,
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '480px',
        marginBottom: '16px',
      }}>
        {/* BADGE ÉTAPE */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: '99px', padding: '4px 12px',
          marginBottom: '16px',
        }}>
          <span>{current.icon}</span>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '11px',
            letterSpacing: '0.1em',
          }}>ÉTAPE {current.num} / 4</span>
        </div>

        {/* TITRE ÉTAPE */}
        <h2 style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#fff', fontSize: '18px',
          marginBottom: '8px',
        }}>{current.title}</h2>

        {/* SOUS-TITRE */}
        <p style={{
          color: current.color, fontSize: '14px',
          marginBottom: '24px',
        }}>{current.subtitle}</p>

        {/* CONTENU */}
        {current.content}
      </div>

      {/* BOUTONS */}
      <div style={{
        display: 'flex', gap: '12px',
        width: '100%', maxWidth: '480px',
      }}>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              flex: 1, background: 'transparent',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '14px', borderRadius: '10px',
              cursor: 'pointer', fontSize: '14px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Précédent</button>
        )}
        <button
          onClick={() => {
            if (step < 3) setStep(step + 1)
            else navigate('/translate')
          }}
          style={{
            flex: 1,
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', color: '#fff',
            padding: '14px', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
          }}>
          {step < 3 ? 'Suivant →' : 'Commencer ⚡'}
        </button>
      </div>

      {/* SKIP */}
      <button
        onClick={() => navigate('/translate')}
        style={{
          background: 'transparent', border: 'none',
          color: '#475569', cursor: 'pointer',
          fontSize: '13px', marginTop: '12px',
        }}>Passer l&apos;intro →</button>
    </div>
  )
}