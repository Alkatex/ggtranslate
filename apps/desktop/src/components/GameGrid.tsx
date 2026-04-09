import { useState } from 'react'

const GAMES = [
  { name: 'Valorant', icon: '🎯', badge: 'NATIF' },
  { name: 'League of Legends', icon: '⚔️', badge: 'NATIF' },
  { name: 'CS2', icon: '🔫', badge: 'NATIF' },
  { name: 'Fortnite', icon: '🏗️', badge: 'NATIF' },
  { name: 'Apex Legends', icon: '💪', badge: 'NATIF' },
  { name: 'Genshin Impact', icon: '✨', badge: 'UNIVERSEL' },
  { name: 'Dota 2', icon: '🛡️', badge: 'UNIVERSEL' },
  { name: 'Overwatch 2', icon: '💥', badge: 'UNIVERSEL' },
]

const PLATFORMS = [
  { name: 'PC Windows / Mac / Linux', sub: 'Installation en 2 minutes', icon: '✅' },
  { name: 'iOS & Android', sub: 'Fonctionne avec écouteurs', icon: '✅' },
  { name: 'PlayStation / Xbox', sub: 'En développement', icon: '→' },
]

export function GameGrid() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)

  return (
    <div style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          color: '#06b6d4', padding: '6px 16px',
          borderRadius: '99px', fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '0.12em',
        }}>COMPATIBILITÉ</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '36px',
        textAlign: 'center', marginBottom: '12px',
      }}>Ton jeu est supporté.</h2>

      <p style={{
        color: '#94a3b8', textAlign: 'center',
        fontSize: '16px', marginBottom: '48px',
      }}>
        Compatible avec tous les jeux via capture audio.
        Support natif pour les plus populaires.
      </p>

      {/* GRILLE JEUX */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {GAMES.map(game => (
          <div
            key={game.name}
            onMouseEnter={() => setHoveredGame(game.name)}
            onMouseLeave={() => setHoveredGame(null)}
            style={{
              background: hoveredGame === game.name ? '#111827' : '#0d1424',
              border: `1px solid ${hoveredGame === game.name
                ? game.badge === 'NATIF' ? '#22c55e' : '#06b6d4'
                : '#1e2d45'}`,
              borderRadius: '12px', padding: '20px',
              textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
              transform: hoveredGame === game.name ? 'translateY(-4px)' : 'none',
              boxShadow: hoveredGame === game.name
                ? `0 8px 24px ${game.badge === 'NATIF' ? 'rgba(34,197,94,0.15)' : 'rgba(6,182,212,0.15)'}`
                : 'none',
            }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{game.icon}</div>
            <div style={{
              color: '#fff', fontSize: '13px',
              fontWeight: 500, marginBottom: '8px',
            }}>{game.name}</div>
            <span style={{
              fontSize: '10px', padding: '3px 10px',
              borderRadius: '99px',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.08em',
              background: game.badge === 'NATIF'
                ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.1)',
              color: game.badge === 'NATIF' ? '#22c55e' : '#94a3b8',
              border: `1px solid ${game.badge === 'NATIF'
                ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.2)'}`,
            }}>{game.badge}</span>
          </div>
        ))}
      </div>

      <p style={{
        color: '#475569', textAlign: 'center',
        fontSize: '13px', marginBottom: '32px',
      }}>+45 autres jeux supportés via capture audio universelle</p>

      {/* PLATEFORMES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        {PLATFORMS.map(p => (
          <div key={p.name} style={{
            background: p.icon === '✅' ? 'rgba(6,182,212,0.05)' : 'transparent',
            border: `1px solid ${p.icon === '✅' ? 'rgba(6,182,212,0.2)' : '#1e2d45'}`,
            borderRadius: '10px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{
              color: p.icon === '✅' ? '#22c55e' : '#94a3b8',
              fontSize: '18px',
            }}>{p.icon}</span>
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                {p.name}
              </div>
              <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>
                {p.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}