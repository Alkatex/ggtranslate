import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'free',
    label: 'FREE TRIAL',
    price: 'CA$0',
    period: '7 jours',
    color: '#06b6d4',
    featured: false,
    features: [
      { text: '30 minutes de traduction', included: true },
      { text: 'English, Spanish & French', included: true },
      { text: 'Qualité voix standard', included: true },
      { text: 'Intégration Discord', included: true },
      { text: 'Support email', included: true },
      { text: 'Effets de voix', included: false },
      { text: 'API Access', included: false },
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'starter',
    label: 'STARTER',
    price: 'CA$9',
    period: '/month',
    color: '#06b6d4',
    featured: true,
    features: [
      { text: '300 minutes/mois', included: true },
      { text: '25 langues supportées', included: true },
      { text: 'Qualité voix HD', included: true },
      { text: 'Tous les chats', included: true },
      { text: 'Profils voix custom', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'API Access', included: false },
    ],
    cta: 'Choose Starter',
  },
  {
    id: 'pro',
    label: 'PRO',
    price: 'CA$29',
    period: '/month',
    color: '#f59e0b',
    featured: false,
    features: [
      { text: 'Minutes illimitées', included: true },
      { text: '40+ langues supportées', included: true },
      { text: 'Qualité voix Ultra-HD', included: true },
      { text: 'Tous les chats', included: true },
      { text: 'Profils voix custom', included: true },
      { text: 'Team management', included: true },
      { text: 'API access', included: true },
    ],
    cta: '✓ Current Plan',
  },
]

export function PricingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '48px 24px',
      maxWidth: '1000px', margin: '0 auto',
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>🎮</span>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '24px',
            letterSpacing: '0.15em',
          }}>GG TRANSLATE</h1>
          <span style={{ fontSize: '24px' }}>🎮</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Choose your plan and start breaking language barriers in-game.
        </p>
      </div>

      {/* PLANS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px', marginBottom: '32px',
      }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            background: '#0d1424',
            border: `1px solid ${plan.featured ? '#06b6d4' : plan.id === 'pro' ? '#f59e0b33' : '#1e2d45'}`,
            borderRadius: '16px', padding: '24px',
            position: 'relative',
          }}>
            {/* BADGE POPULAIRE */}
            {plan.featured && (
              <div style={{
                position: 'absolute', top: '-12px',
                left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                color: '#fff', padding: '4px 16px',
                borderRadius: '99px', fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                whiteSpace: 'nowrap',
              }}>★ MOST POPULAR</div>
            )}

            {/* PLAN LABEL */}
            <div style={{
              display: 'inline-block',
              background: `rgba(${plan.id === 'pro' ? '245,158,11' : '6,182,212'},0.1)`,
              border: `1px solid ${plan.color}33`,
              color: plan.color, padding: '4px 12px',
              borderRadius: '6px', fontSize: '11px',
              fontFamily: 'Orbitron, sans-serif',
              marginBottom: '16px',
            }}>{plan.label}</div>

            {/* PRIX */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                color: '#fff', fontSize: '36px', fontWeight: 700,
              }}>{plan.price}</span>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}> {plan.period}</span>
            </div>

            {/* FEATURES */}
            <div style={{ marginBottom: '24px' }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 0', fontSize: '13px',
                  color: f.included ? '#94a3b8' : '#475569',
                  textDecoration: f.included ? 'none' : 'line-through',
                }}>
                  <span style={{ color: f.included ? '#22c55e' : '#475569' }}>
                    {f.included ? '✓' : '✗'}
                  </span>
                  {f.text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/translate')}
              style={{
                width: '100%', padding: '12px',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '14px', fontFamily: 'Orbitron, sans-serif',
                fontWeight: plan.featured ? 700 : 400,
                background: plan.featured
                  ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
                  : 'transparent',
                border: plan.featured ? 'none' : '1px solid #1e2d45',
                color: '#fff',
              }}>{plan.cta}</button>
          </div>
        ))}
      </div>

      {/* BACK */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => navigate('/translate')}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: '13px',
          }}>← Back to Translator</button>
      </div>
    </div>
  )
}