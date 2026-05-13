import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppLanguage } from '../store/appLanguage'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'

function getSteps(t: (key: any) => string) {
  return [
    {
      num: 1, icon: '🎮',
      title: t('onboarding.s1.title'),
      subtitle: t('onboarding.s1.subtitle'),
      color: '#06b6d4',
      content: (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center' }}>
            {t('onboarding.s1.desc')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '32px', marginBottom: '16px' }}>
            🇫🇷 🇬🇧 🇪🇸 🇩🇪 🇧🇷 🇰🇷 🇯🇵
          </div>
          <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ color: '#06b6d4', fontSize: '24px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>10,000+</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{t('onboarding.s1.gamers')}</div>
          </div>
        </div>
      ),
    },
    {
      num: 2, icon: '🎤',
      title: t('onboarding.s2.title'),
      subtitle: t('onboarding.s2.subtitle'),
      color: '#06b6d4',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, textAlign: 'center' }}>
            {t('onboarding.s2.desc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(6,182,212,0.1)', border: '2px solid #06b6d4', borderRadius: '99px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>fr</span>
              <span style={{ color: '#fff', fontSize: '11px' }}>{t('onboarding.you')}</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[4,7,5,8,6,9,5,7,4].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h * 2}px`, background: '#06b6d4', borderRadius: '2px', animation: `wave ${0.6 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s`, transformOrigin: 'center' }}/>
                ))}
              </div>
            </div>
            <div style={{ color: '#f97316', fontSize: '20px' }}>⚡</div>
            <div style={{ background: 'rgba(6,182,212,0.1)', border: '2px solid #06b6d4', borderRadius: '99px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>en</span>
              <span style={{ color: '#fff', fontSize: '11px' }}>{t('onboarding.them')}</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[5,8,6,9,7,5,8,6,4].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h * 2}px`, background: '#06b6d4', borderRadius: '2px', animation: `wave ${0.5 + i * 0.12}s ease-in-out infinite`, animationDelay: `${i * 0.1 + 0.3}s`, transformOrigin: 'center' }}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
            {[
              { value: '40+', label: t('onboarding.langs') },
              { value: '<1s', label: t('onboarding.latency') },
              { value: '50+', label: t('onboarding.effects') },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#06b6d4', fontSize: '20px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</div>
                <div style={{ color: '#475569', fontSize: '11px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      num: 3, icon: '🖥️',
      title: t('onboarding.s3.title'),
      subtitle: t('onboarding.s3.subtitle'),
      color: '#a855f7',
      content: (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center' }}>
            {t('onboarding.s3.desc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🎮', text: 'Valorant, League of Legends, CSGO...', color: '#06b6d4' },
              { icon: '🎧', text: 'Discord, TeamSpeak, in-game voice', color: '#a855f7' },
              { icon: '🌍', text: t('onboarding.s3.langs'), color: '#22c55e' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111827', borderRadius: '10px', padding: '12px', border: `1px solid ${item.color}33` }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.text}</span>
                <span style={{ color: item.color, marginLeft: 'auto' }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      num: 4, icon: '⚡',
      title: t('onboarding.s4.title'),
      subtitle: t('onboarding.s4.subtitle'),
      color: '#f97316',
      content: (
        <div>
          <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(6,182,212,0.15))', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#f97316', fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>15 MIN</div>
            <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>{t('onboarding.s4.trial')}</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{t('onboarding.s4.unlocked')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              t('onboarding.s4.f1'),
              t('onboarding.s4.f2'),
              t('onboarding.s4.f3'),
              t('onboarding.s4.f4'),
            ].map((feature, i) => (
              <div key={i} style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>{feature}</div>
            ))}
          </div>
        </div>
      ),
    },
  ]
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { t, lang, setLang } = useAppLanguage()
  const { user } = useAuthStore()
  const STEPS = getSteps(t)
  const current = STEPS[step]

  const finish = async () => {
    // ← Sauvegarde onboarding_done dans DB au lieu de localStorage
    if (user) {
      await supabase.from('profiles')
        .update({ onboarding_done: true })
        .eq('id', user.id)
    }
    navigate('/login')
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['fr', 'en', 'es'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? 'rgba(6,182,212,0.15)' : 'transparent', border: `1px solid ${lang === l ? '#06b6d4' : '#1e2d45'}`, color: lang === l ? '#06b6d4' : '#475569', padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', transition: 'all 0.2s' }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '24px', letterSpacing: '0.15em', marginBottom: '24px' }}>GG TRANSLATE</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ height: '6px', width: i === step ? '24px' : '6px', borderRadius: '99px', background: i <= step ? '#3b82f6' : '#1e2d45', transition: 'all 0.3s' }}/>
        ))}
      </div>

      <div style={{ background: '#0d1424', border: `1px solid ${step === 3 ? 'rgba(249,115,22,0.3)' : step === 2 ? 'rgba(168,85,247,0.3)' : '#1e2d45'}`, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', marginBottom: '16px', transition: 'border-color 0.3s' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '99px', padding: '4px 12px', marginBottom: '16px' }}>
          <span>{current.icon}</span>
          <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '11px', letterSpacing: '0.1em' }}>{t('onboarding.step')} {current.num} / 4</span>
        </div>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '18px', marginBottom: '8px' }}>{current.title}</h2>
        <p style={{ color: current.color, fontSize: '14px', marginBottom: '24px' }}>{current.subtitle}</p>
        {current.content}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px' }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e2d45', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif' }}>{t('onboarding.prev')}</button>
        )}
        <button
          onClick={() => { if (step < 3) setStep(step + 1); else finish() }}
          style={{ flex: 1, background: step === 3 ? 'linear-gradient(to right, #f97316, #ef4444)' : 'linear-gradient(to right, #3b82f6, #06b6d4)', border: 'none', color: '#fff', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>
          {step < 3 ? t('onboarding.next') : t('onboarding.start')}
        </button>
      </div>

      <button onClick={finish} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px', marginTop: '12px' }}>
        {t('onboarding.skip')}
      </button>
    </div>
  )
}