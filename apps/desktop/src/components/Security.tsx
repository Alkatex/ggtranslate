import { useState } from 'react'

const BADGES = [
  { icon: '🛡️', label: 'CONFORME RGPD' },
  { icon: '🎮', label: '0 MODIFICATION DU JEU' },
  { icon: '🔒', label: 'AUDIO CHIFFRÉ EN TRANSIT' },
  { icon: '🗑️', label: 'SUPPRESSION DES DONNÉES EN 1 CLIC' },
]

const FAQS = [
  {
    q: 'Est-ce que GGTranslate peut me faire bannir de mon jeu ?',
    a: 'Non. GGTranslate fonctionne en dehors du jeu et ne modifie aucun fichier. Il capture uniquement le son via le système audio — exactement comme Discord.',
  },
  {
    q: 'Est-ce que mes conversations sont enregistrées ou écoutées ?',
    a: 'Non. L\'audio est traité en temps réel et immédiatement supprimé. Zéro stockage, zéro enregistrement.',
  },
  {
    q: 'Puis-je utiliser GGTranslate en tournoi officiel ?',
    a: 'Oui dans la plupart des cas. GGTranslate ne donne aucun avantage en jeu — il traduit simplement la communication vocale.',
  },
  {
    q: 'Mes données sont-elles vendues à des tiers ?',
    a: 'Jamais. Nous ne vendons, partageons ou monétisons aucune donnée personnelle ou audio.',
  },
]

export function Security() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ padding: '80px 48px', maxWidth: '900px', margin: '0 auto' }}>

      {/* BADGE */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e', padding: '6px 16px',
          borderRadius: '99px', fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '0.12em',
        }}>🔒 CONFIDENTIALITÉ & SÉCURITÉ</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '36px',
        textAlign: 'center', marginBottom: '12px',
      }}>Ton audio t&apos;appartient.</h2>

      <p style={{
        color: '#94a3b8', textAlign: 'center',
        fontSize: '16px', marginBottom: '48px',
      }}>Zéro stockage, zéro espionnage, zéro risque de ban.</p>

      {/* BADGES SÉCURITÉ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '48px',
      }}>
        {BADGES.map(b => (
          <div key={b.label} style={{
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '10px', padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{b.icon}</div>
            <div style={{
              color: '#22c55e', fontSize: '10px',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.08em', lineHeight: 1.4,
            }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{
            background: '#0d1424',
            border: '1px solid #1e2d45',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', color: '#fff',
                padding: '16px 20px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', fontSize: '14px',
                textAlign: 'left',
              }}>
              {faq.q}
              <span style={{
                color: '#475569', fontSize: '18px',
                transform: openFaq === i ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>∨</span>
            </button>
            {openFaq === i && (
              <div style={{
                padding: '0 20px 16px',
                color: '#94a3b8', fontSize: '13px',
                lineHeight: 1.7,
                borderTop: '1px solid #1e2d45',
                paddingTop: '12px',
              }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}