import { useNavigate } from 'react-router-dom'
import { GameGrid } from '../components/GameGrid'
import { HowItWorks } from '../components/HowItWorks'
import { Security } from '../components/Security'
import { LatencyMap } from '../components/LatencyMap'
import { Reviews } from '../components/Reviews'
import { FooterCTA } from '../components/FooterCTA'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid #1e2d45',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎮</span>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#fff', fontSize: '16px',
            fontWeight: 700, letterSpacing: '0.1em',
          }}>GGTRANSLATE</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['FEATURES', 'PRICING', 'REVIEWS'].map(item => (
            <span key={item} style={{
              color: '#94a3b8', fontSize: '12px',
              letterSpacing: '0.1em', cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
            }}>{item}</span>
          ))}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none', color: '#fff',
              padding: '10px 20px', borderRadius: '99px',
              cursor: 'pointer', fontSize: '13px',
              fontFamily: 'Orbitron, sans-serif', fontWeight: 600,
            }}>Se connecter →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        textAlign: 'center', padding: '80px 48px 60px',
        maxWidth: '900px', margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: '99px', padding: '6px 16px',
          marginBottom: '32px',
        }}>
          <span style={{ color: '#06b6d4', fontSize: '8px' }}>●</span>
          <span style={{
            color: '#06b6d4', fontSize: '11px',
            letterSpacing: '0.12em',
            fontFamily: 'Orbitron, sans-serif',
          }}>TRADUCTION VOCALE GAMING — TEMPS RÉEL</span>
        </div>

        <h1 style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '64px', fontWeight: 900,
          lineHeight: 1.1, marginBottom: '24px', color: '#fff',
        }}>
          Joue avec{' '}
          <span style={{ color: '#06b6d4' }}>n&apos;importe qui</span>
          {' '}sur Terre.
        </h1>

        <p style={{
          color: '#94a3b8', fontSize: '18px',
          lineHeight: 1.6, marginBottom: '40px',
          maxWidth: '600px', margin: '0 auto 40px',
        }}>
          Tu parles, ils comprennent. Instantanément, dans leur langue.
          Fini les barrières linguistiques en ranked.
        </p>

        {/* WAVEFORM DEMO */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '16px',
          marginBottom: '40px',
        }}>
          <div style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '99px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>fr</span>
            <span style={{ color: '#fff', fontSize: '11px' }}>TU PARLES</span>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {[4,7,5,8,6,9,5,7,4].map((h, i) => (
                <div key={i} style={{
                  width: '3px', height: `${h * 2}px`,
                  background: '#06b6d4', borderRadius: '2px',
                  animation: `wave ${0.6 + i * 0.1}s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                  transformOrigin: 'center',
                }}/>
              ))}
            </div>
          </div>

          <div style={{ color: '#f97316', fontSize: '20px' }}>⚡</div>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>&lt;1s</span>

          <div style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '99px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>kr</span>
            <span style={{ color: '#fff', fontSize: '11px' }}>ILS ENTENDENT</span>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {[5,8,6,9,7,5,8,6,4].map((h, i) => (
                <div key={i} style={{
                  width: '3px', height: `${h * 2}px`,
                  background: '#06b6d4', borderRadius: '2px',
                  animation: `wave ${0.5 + i * 0.12}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1 + 0.3}s`,
                  transformOrigin: 'center',
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div style={{
          display: 'flex', gap: '16px',
          justifyContent: 'center', marginBottom: '16px',
        }}>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none', color: '#fff',
              padding: '16px 32px', borderRadius: '99px',
              cursor: 'pointer', fontSize: '16px',
              fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
            🎤 Commencer gratuitement →
          </button>
          <button style={{
            background: 'transparent',
            border: '1px solid #1e2d45',
            color: '#fff', padding: '16px 32px',
            borderRadius: '99px', cursor: 'pointer', fontSize: '16px',
          }}>Voir la démo</button>
        </div>

        <p style={{
          color: '#475569', fontSize: '11px', letterSpacing: '0.08em',
        }}>
          7 JOURS GRATUITS · AUCUNE CARTE BANCAIRE · ANNULATION EN 1 CLIC
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: '64px', padding: '40px 48px',
        borderTop: '1px solid #1e2d45',
        borderBottom: '1px solid #1e2d45',
      }}>
        {[
          { value: '10K+', label: 'GAMERS ACTIFS' },
          { value: '40+', label: 'LANGUES' },
          { value: '<1s', label: 'LATENCE' },
          { value: '99.9%', label: 'UPTIME' },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#06b6d4', fontSize: '28px', fontWeight: 700,
            }}>{stat.value}</div>
            <div style={{
              color: '#475569', fontSize: '11px',
              letterSpacing: '0.12em', marginTop: '4px',
            }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* SECTIONS */}
      <GameGrid />
      <HowItWorks />
      <Security />
      <LatencyMap />
      <Reviews />
      <FooterCTA />

    </div>
  )
}