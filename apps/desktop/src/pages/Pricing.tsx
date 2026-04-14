import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useState } from 'react'

const PLANS = [
  {
    id: 'free',
    label: '🆓 FREE',
    price: '0$',
    period: 'pour toujours',
    color: '#64748b',
    featured: false,
    features: [
      { text: '10 min/jour', included: true },
      { text: '2 langues (FR + EN)', included: true },
      { text: 'Ma Voix', included: true },
      { text: 'Other Players', included: false },
      { text: 'Effets de voix', included: false },
      { text: 'Voice Cloning', included: false },
      { text: 'Historique illimité', included: false },
    ],
    cta: 'Plan actuel',
  },
  {
    id: 'starter',
    label: '🚀 STARTER',
    price: '7,99$',
    period: '/mois',
    color: '#3b82f6',
    featured: true,
    features: [
      { text: '3h/jour', included: true },
      { text: '7 langues', included: true },
      { text: 'Ma Voix', included: true },
      { text: 'Other Players ✅', included: true },
      { text: '10 effets de voix', included: true },
      { text: 'Voice Cloning', included: false },
      { text: 'Historique 7 jours', included: true },
    ],
    cta: 'Choisir Starter',
  },
  {
    id: 'pro',
    label: '⚡ PRO',
    price: '14,99$',
    period: '/mois',
    color: '#a855f7',
    featured: false,
    features: [
      { text: 'Illimité', included: true },
      { text: 'Toutes les langues (30+)', included: true },
      { text: 'Ma Voix', included: true },
      { text: 'Other Players ✅', included: true },
      { text: '50+ effets de voix', included: true },
      { text: 'Voice Cloning ✅', included: true },
      { text: 'Historique illimité', included: true },
    ],
    cta: 'Choisir Pro',
  },
]

export function PricingPage() {
  const navigate = useNavigate()
  const { plan, user } = useAuthStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return
    if (!user) { navigate('/login'); return }

    setLoadingPlan(planId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/billing/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          email: user.email,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err) {
      console.error('Erreur checkout:', err)
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => plan === planId

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '48px 24px',
      maxWidth: '1000px', margin: '0 auto',
    }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#06b6d4', fontSize: '24px',
          letterSpacing: '0.15em', marginBottom: '12px',
        }}>GG TRANSLATE</div>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#fff', fontSize: '20px',
          marginBottom: '12px',
        }}>Choisis ton plan</div>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Traduis tes coéquipiers en temps réel — sans barrière de langue
        </p>
        {plan === 'trial' && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '10px', padding: '10px 20px',
            color: '#06b6d4', fontSize: '13px',
            display: 'inline-block',
          }}>
            ⭐ Tu utilises actuellement le Trial Pro — 15 min offertes
          </div>
        )}
      </div>

      {/* PLANS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px', marginBottom: '32px',
      }}>
        {PLANS.map(p => (
          <div key={p.id} style={{
            background: '#0d1424',
            border: `2px solid ${isCurrentPlan(p.id) ? p.color : p.featured ? p.color + '66' : '#1e2d45'}`,
            borderRadius: '16px', padding: '24px',
            position: 'relative',
            transition: 'border-color 0.2s',
          }}>
            {p.featured && (
              <div style={{
                position: 'absolute', top: '-12px',
                left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                color: '#fff', padding: '4px 16px',
                borderRadius: '99px', fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                whiteSpace: 'nowrap',
              }}>★ PLUS POPULAIRE</div>
            )}

            {isCurrentPlan(p.id) && (
              <div style={{
                position: 'absolute', top: '-12px',
                right: '16px',
                background: p.color,
                color: '#fff', padding: '4px 12px',
                borderRadius: '99px', fontSize: '10px',
                fontFamily: 'Orbitron, sans-serif',
              }}>✓ ACTUEL</div>
            )}

            <div style={{
              display: 'inline-block',
              background: `${p.color}22`,
              border: `1px solid ${p.color}44`,
              color: p.color, padding: '4px 12px',
              borderRadius: '6px', fontSize: '11px',
              fontFamily: 'Orbitron, sans-serif',
              marginBottom: '16px',
            }}>{p.label}</div>

            <div style={{ marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                color: '#fff', fontSize: '32px', fontWeight: 700,
              }}>{p.price}</span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}> {p.period}</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {p.features.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 0', fontSize: '12px',
                  color: f.included ? '#94a3b8' : '#334155',
                }}>
                  <span style={{ color: f.included ? '#22c55e' : '#334155', fontSize: '14px' }}>
                    {f.included ? '✓' : '✗'}
                  </span>
                  {f.text}
                </div>
              ))}
            </div>

            <button
              onClick={() => !isCurrentPlan(p.id) && handleUpgrade(p.id)}
              disabled={isCurrentPlan(p.id) || loadingPlan === p.id}
              style={{
                width: '100%', padding: '12px',
                borderRadius: '10px',
                cursor: isCurrentPlan(p.id) ? 'default' : 'pointer',
                fontSize: '13px',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 700,
                background: isCurrentPlan(p.id)
                  ? `${p.color}22`
                  : p.featured
                  ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
                  : p.id === 'pro'
                  ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                  : 'transparent',
                border: isCurrentPlan(p.id)
                  ? `1px solid ${p.color}44`
                  : p.featured || p.id === 'pro' ? 'none' : '1px solid #1e2d45',
                color: isCurrentPlan(p.id) ? p.color : '#fff',
                opacity: loadingPlan === p.id ? 0.7 : 1,
                transition: 'all 0.2s',
              }}>
              {loadingPlan === p.id
                ? '⟳ Chargement...'
                : isCurrentPlan(p.id)
                ? '✓ Plan actuel'
                : p.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45',
        borderRadius: '12px', padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#fff', fontSize: '13px',
          marginBottom: '16px',
        }}>Questions fréquentes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { q: 'Puis-je annuler à tout moment ?', a: 'Oui — aucun engagement, annulation en 1 clic depuis ton profil.' },
            { q: 'Quelles langues sont supportées ?', a: 'Free: FR + EN. Starter: 7 langues. Pro: 30+ langues incluant KO, JA, ZH.' },
            { q: "Le Voice Cloning c'est quoi ?", a: 'Tu enregistres 30 secondes de ta voix — le TTS utilise ensuite ta vraie voix.' },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: i < 2 ? '1px solid #1e2d45' : 'none', paddingBottom: '12px' }}>
              <div style={{ color: '#fff', fontSize: '13px', marginBottom: '4px' }}>{item.q}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BACK */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => navigate('/translate')}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: '13px',
          }}>← Retour au traducteur</button>
      </div>
    </div>
  )
}