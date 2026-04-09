import { useState } from 'react'

const STEPS = [
  {
    num: '01',
    icon: '🎤',
    title: 'Tu parles',
    desc: 'Parle dans ton micro. GGTranslate capture ta voix en temps réel.',
  },
  {
    num: '02',
    icon: '⚡',
    title: 'Traduction instantanée',
    desc: 'Ta voix est analysée et traduite en moins d\'une seconde dans la langue de ton équipe.',
  },
  {
    num: '03',
    icon: '🔊',
    title: 'Ils entendent',
    desc: 'Tes coéquipiers entendent la traduction dans leur langue maternelle.',
  },
]

const FEATURES = [
  {
    icon: '🎤',
    title: 'Voix en temps réel',
    desc: 'Chaque joueur est identifié séparément. Tu sais exactement qui parle, même dans un squad de 5.',
    color: '#06b6d4',
  },
  {
    icon: '⚡',
    title: 'Traduction instantanée',
    desc: 'Traduction naturelle et précise en moins d\'une seconde. Pas de robot, pas de charabia.',
    color: '#f97316',
  },
  {
    icon: '👥',
    title: 'Multi-joueurs',
    desc: 'Capturez l\'audio Discord ou en jeu. Chaque joueur traduit dans sa langue.',
    color: '#a855f7',
  },
  {
    icon: '🎛️',
    title: 'Effets de voix',
    desc: 'Modifiez votre voix en temps réel : robot, alien, pitch shift et plus encore.',
    color: '#3b82f6',
  },
]

export function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  return (
    <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* BADGE */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          color: '#06b6d4', padding: '6px 16px',
          borderRadius: '99px', fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '0.12em',
        }}>COMMENT ÇA MARCHE</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '36px',
        textAlign: 'center', marginBottom: '48px',
      }}>3 étapes. C&apos;est tout.</h2>

      {/* 3 ÉTAPES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px', marginBottom: '80px',
      }}>
        {STEPS.map(step => (
          <div
            key={step.num}
            onMouseEnter={() => setHoveredStep(step.num)}
            onMouseLeave={() => setHoveredStep(null)}
            style={{
              background: hoveredStep === step.num ? '#111827' : '#0d1424',
              border: `1px solid ${hoveredStep === step.num
                ? 'rgba(6,182,212,0.5)' : '#1e2d45'}`,
              borderRadius: '12px', padding: '28px',
              textAlign: 'center', cursor: 'default',
              transition: 'all 0.2s',
              transform: hoveredStep === step.num ? 'translateY(-4px)' : 'none',
              boxShadow: hoveredStep === step.num
                ? '0 8px 24px rgba(6,182,212,0.15)' : 'none',
            }}>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '50%',
              background: hoveredStep === step.num
                ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.1)',
              border: `1px solid ${hoveredStep === step.num
                ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.2)'}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 12px',
              transition: 'all 0.2s',
            }}>{step.icon}</div>
            <div style={{
              color: '#475569', fontSize: '11px',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.1em', marginBottom: '8px',
            }}>{step.num}</div>
            <h3 style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#fff', fontSize: '16px',
              marginBottom: '12px',
            }}>{step.title}</h3>
            <p style={{
              color: '#94a3b8', fontSize: '13px',
              lineHeight: 1.6,
            }}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* FEATURES BADGE */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          color: '#06b6d4', padding: '6px 16px',
          borderRadius: '99px', fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '0.12em',
        }}>FEATURES</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '32px',
        textAlign: 'center', marginBottom: '48px',
      }}>Built for gamers. Powered by AI.</h2>

      {/* FEATURES GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
      }}>
        {FEATURES.map(f => (
          <div
            key={f.title}
            onMouseEnter={() => setHoveredFeature(f.title)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              background: hoveredFeature === f.title ? '#111827' : '#0d1424',
              border: `1px solid ${hoveredFeature === f.title
                ? f.color : '#1e2d45'}`,
              borderRadius: '12px', padding: '24px',
              display: 'flex', gap: '16px',
              cursor: 'default', transition: 'all 0.2s',
              transform: hoveredFeature === f.title ? 'translateY(-4px)' : 'none',
              boxShadow: hoveredFeature === f.title
                ? `0 8px 24px ${f.color}25` : 'none',
            }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '10px', flexShrink: 0,
              background: hoveredFeature === f.title
                ? `${f.color}20` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hoveredFeature === f.title
                ? f.color : 'transparent'}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '22px',
              transition: 'all 0.2s',
            }}>{f.icon}</div>
            <div>
              <h3 style={{
                color: '#fff', fontSize: '15px',
                fontWeight: 600, marginBottom: '8px',
              }}>{f.title}</h3>
              <p style={{
                color: '#94a3b8', fontSize: '13px',
                lineHeight: 1.6,
              }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}