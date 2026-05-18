import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useState } from 'react'
import { motion } from 'motion/react'
import tokens from '../styles/tokens'

const PLANS = [
  {
    id: 'free',
    label: 'FREE',
    price: '0$',
    period: 'pour toujours',
    color: tokens.colors.planFree,
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
    label: 'STARTER',
    price: '7,99$',
    period: '/mois',
    color: tokens.colors.planStarter,
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
    label: 'PRO',
    price: '14,99$',
    period: '/mois',
    color: tokens.colors.planPro,
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

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui — aucun engagement, annulation en 1 clic depuis ton profil.' },
  { q: 'Quelles langues sont supportées ?', a: 'Free: FR + EN. Starter: 7 langues. Pro: 30+ langues incluant KO, JA, ZH.' },
  { q: "Le Voice Cloning c'est quoi ?", a: 'Tu enregistres 30 secondes de ta voix — le TTS utilise ensuite ta vraie voix.' },
]

export function PricingPage() {
  const navigate = useNavigate()
  const { plan, user } = useAuthStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return
    if (!user) { navigate('/login'); return }

    setLoadingPlan(planId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/billing/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email: user.email }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      console.error('Erreur checkout:', err)
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => plan === planId

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '48px 24px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', marginBottom: '48px' }}
      >
        <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '24px', letterSpacing: tokens.letterSpacing.widest, marginBottom: '12px' }}>
          GG TRANSLATE
        </div>
        <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.text, fontSize: '20px', marginBottom: '12px' }}>
          Choisis ton plan
        </div>
        <p style={{ color: tokens.colors.muted, fontSize: '14px' }}>
          Traduis tes coéquipiers en temps réel — sans barrière de langue
        </p>
        {plan === 'trial' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ marginTop: '16px', background: tokens.alpha.cyanLight, border: `1px solid ${tokens.alpha.cyanBorder}`, borderRadius: tokens.radius.lg, padding: '10px 20px', color: tokens.colors.cyan, fontSize: '13px', display: 'inline-block' }}
          >
            ⭐ Tu utilises actuellement le Trial Pro — 15 min offertes
          </motion.div>
        )}
      </motion.div>

      {/* PLANS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {PLANS.map((p, i) => {
          const isCurrent = isCurrentPlan(p.id)
          const isHovered = hoveredPlan === p.id
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
              onMouseEnter={() => setHoveredPlan(p.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                background: tokens.colors.bg2,
                border: `2px solid ${isCurrent ? p.color : isHovered ? p.color + '88' : p.featured ? p.color + '55' : tokens.colors.border}`,
                borderRadius: tokens.radius['3xl'],
                padding: '24px',
                position: 'relative',
                transition: tokens.transitions.medium,
                transform: isHovered && !isCurrent ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered ? `0 8px 28px ${p.color}18` : 'none',
              }}
            >
              {/* Badge populaire */}
              {p.featured && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: tokens.gradients.primaryR, color: tokens.colors.white, padding: '4px 16px', borderRadius: tokens.radius.full, fontSize: '11px', fontFamily: tokens.fonts.display, whiteSpace: 'nowrap' }}>
                  ★ PLUS POPULAIRE
                </div>
              )}

              {/* Badge plan actuel */}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-12px', right: '16px', background: p.color, color: tokens.colors.white, padding: '4px 12px', borderRadius: tokens.radius.full, fontSize: '10px', fontFamily: tokens.fonts.display }}>
                  ✓ ACTUEL
                </div>
              )}

              {/* Label plan */}
              <div style={{ display: 'inline-block', background: `${p.color}22`, border: `1px solid ${p.color}44`, color: p.color, padding: '4px 12px', borderRadius: tokens.radius.sm, fontSize: '11px', fontFamily: tokens.fonts.display, marginBottom: '16px' }}>
                {p.label}
              </div>

              {/* Prix */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontFamily: tokens.fonts.display, color: tokens.colors.text, fontSize: '32px', fontWeight: tokens.fontWeights.bold }}>{p.price}</span>
                <span style={{ color: tokens.colors.muted, fontSize: '13px' }}> {p.period}</span>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '24px' }}>
                {p.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', fontSize: '12px', color: f.included ? tokens.colors.muted : tokens.colors.veryDim }}>
                    <span style={{ color: f.included ? tokens.colors.green : tokens.colors.veryDim, fontSize: '14px' }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={() => !isCurrent && handleUpgrade(p.id)}
                disabled={isCurrent || loadingPlan === p.id}
                whileHover={isCurrent ? {} : { scale: 1.02 }}
                whileTap={isCurrent ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: tokens.radius.lg,
                  cursor: isCurrent ? 'default' : 'pointer',
                  fontSize: '13px',
                  fontFamily: tokens.fonts.display,
                  fontWeight: tokens.fontWeights.bold,
                  background: isCurrent
                    ? `${p.color}22`
                    : p.featured
                    ? tokens.gradients.primaryR
                    : p.id === 'pro'
                    ? tokens.gradients.pro
                    : 'transparent',
                  border: isCurrent
                    ? `1px solid ${p.color}44`
                    : p.featured || p.id === 'pro' ? 'none' : `1px solid ${tokens.colors.border}`,
                  color: isCurrent ? p.color : tokens.colors.white,
                  opacity: loadingPlan === p.id ? 0.7 : 1,
                  transition: tokens.transitions.normal,
                }}
              >
                {loadingPlan === p.id ? '⟳ Chargement...' : isCurrent ? '✓ Plan actuel' : p.cta}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px', marginBottom: '24px' }}
      >
        <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.text, fontSize: '13px', marginBottom: '16px' }}>
          Questions fréquentes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderRadius: tokens.radius.md, overflow: 'hidden', border: `1px solid ${openFaq === i ? tokens.alpha.cyanBorder : 'transparent'}`, transition: tokens.transitions.normal }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: openFaq === i ? tokens.alpha.cyanDim : 'transparent', border: 'none', borderBottom: i < FAQ.length - 1 && openFaq !== i ? `1px solid ${tokens.colors.border}` : 'none', color: tokens.colors.text, padding: '13px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontFamily: tokens.fonts.body, textAlign: 'left', transition: tokens.transitions.normal }}
                onMouseEnter={e => { if (openFaq !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (openFaq !== i) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{item.q}</span>
                <motion.span
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: tokens.colors.dim, fontSize: '12px', flexShrink: 0 }}
                >
                  ∨
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ color: tokens.colors.muted, fontSize: '12px', lineHeight: 1.7, padding: '0 16px 13px' }}>
                  {item.a}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* BACK */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <button
          onClick={() => navigate('/translate')}
          style={{ background: 'transparent', border: 'none', color: tokens.colors.dim, cursor: 'pointer', fontSize: '13px', transition: tokens.transitions.normal }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.colors.muted}
          onMouseLeave={e => e.currentTarget.style.color = tokens.colors.dim}
        >
          ← Retour au traducteur
        </button>
      </motion.div>
    </div>
  )
}