import { useNavigate } from 'react-router-dom'

export function FooterCTA() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '0 48px 80px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* CTA CARD */}
      <div style={{
        background: '#0d1424',
        border: '1px solid #1e2d45',
        borderRadius: '24px', padding: '60px 48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🎮✨</div>

        <h2 style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#fff', fontSize: '40px',
          marginBottom: '12px', lineHeight: 1.2,
        }}>
          Prêt à dominer{' '}
          <span style={{ color: '#06b6d4' }}>toutes les langues?</span>
        </h2>

        <p style={{
          color: '#94a3b8', fontSize: '16px',
          marginBottom: '32px',
        }}>
          Rejoins 10,000+ gamers qui jouent sans barrières linguistiques.
          Essai gratuit 7 jours.
        </p>

        <button
          onClick={() => navigate('/onboarding')}
          style={{
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', color: '#fff',
            padding: '16px 40px', borderRadius: '99px',
            cursor: 'pointer', fontSize: '16px',
            fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
          🎤 Commencer l&apos;essai gratuit →
        </button>
      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
        marginTop: '40px',
        paddingTop: '24px',
        borderTop: '1px solid #1e2d45',
      }}>
        <span style={{ fontSize: '16px' }}>🎮</span>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#475569', fontSize: '12px',
          letterSpacing: '0.15em',
        }}>GGTRANSLATE</span>
      </div>
      <p style={{
        color: '#475569', fontSize: '11px',
        textAlign: 'center', marginTop: '8px',
        letterSpacing: '0.08em',
      }}>© 2026 GG TRANSLATE · TOUS DROITS RÉSERVÉS</p>
    </div>
  )
}