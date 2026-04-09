import { useState, useEffect } from 'react'

const REVIEWS = [
  {
    name: 'xXSniper_ProXx',
    flag: '🇫🇷',
    stars: 5,
    text: 'Incroyable. Je joue avec des Coréens sur Valorant et on se comprend parfaitement. La latence est vraiment sous 1 seconde.',
  },
  {
    name: 'GamingWithLukas',
    flag: '🇩🇪',
    stars: 5,
    text: 'Finally an app that works! I play with French and Spanish players now without any issues. Best purchase of the year.',
  },
  {
    name: 'TacticalMaria',
    flag: '🇪🇸',
    stars: 5,
    text: 'Lo uso cada día en mis partidas de CS2. La traducción es natural, no suena a robot. Mis compañeros piensan que hablo inglés.',
  },
  {
    name: 'ProGamer_BR',
    flag: '🇧🇷',
    stars: 4,
    text: 'Muito bom! Consigo jogar com jogadores do mundo inteiro agora. A qualidade da tradução é impressionante.',
  },
]

export function Reviews() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % REVIEWS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const r = REVIEWS[current]

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
        }}>REVIEWS</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '36px',
        textAlign: 'center', marginBottom: '12px',
      }}>Ce qu&apos;ils disent</h2>

      {/* STARS */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px',
        marginBottom: '48px',
      }}>
        <span style={{ color: '#f59e0b', fontSize: '20px' }}>★★★★★</span>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>4.9 / 5</span>
        <span style={{ color: '#475569', fontSize: '14px' }}>· 2,500+ avis</span>
      </div>

      {/* REVIEW CARD — une seule visible */}
      <div style={{
        background: '#0d1424',
        border: '1px solid #1e2d45',
        borderRadius: '16px', padding: '32px',
        maxWidth: '600px', margin: '0 auto 32px',
        textAlign: 'center',
        transition: 'opacity 0.3s',
      }}>
        <div style={{
          fontSize: '40px', marginBottom: '16px',
        }}>{r.flag}</div>
        <p style={{
          color: '#94a3b8', fontSize: '15px',
          lineHeight: 1.8, fontStyle: 'italic',
          marginBottom: '20px',
        }}>&ldquo;{r.text}&rdquo;</p>
        <div style={{
          color: '#fff', fontSize: '14px', fontWeight: 600,
          marginBottom: '4px',
        }}>{r.name}</div>
        <div style={{ color: '#f59e0b', fontSize: '14px' }}>
          {'★'.repeat(r.stars)}
        </div>
      </div>

      {/* DOTS */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '8px',
      }}>
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px', borderRadius: '99px',
              background: i === current ? '#06b6d4' : '#1e2d45',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}