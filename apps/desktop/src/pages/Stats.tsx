import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAppLanguage } from '../store/appLanguage'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import tokens from '../styles/tokens'

interface UserStats {
  total_phrases: number
  total_sessions: number
  total_minutes: number
  top_languages: { code: string; flag: string; name: string; count: number }[]
  top_games: { name: string; emoji: string; count: number }[]
}

const ACHIEVEMENTS = [
  { id: 'first_phrase', emoji: '🎤', label: 'Première phrase', desc: 'Traduis ta première phrase', req: (s: UserStats) => s.total_phrases >= 1 },
  { id: 'phrases_10', emoji: '🗣️', label: 'Bavard', desc: '10 phrases traduites', req: (s: UserStats) => s.total_phrases >= 10 },
  { id: 'phrases_50', emoji: '💬', label: 'Communicatif', desc: '50 phrases traduites', req: (s: UserStats) => s.total_phrases >= 50 },
  { id: 'phrases_100', emoji: '🏆', label: 'Pro de la comm', desc: '100 phrases traduites', req: (s: UserStats) => s.total_phrases >= 100 },
  { id: 'phrases_500', emoji: '⚡', label: 'Légende', desc: '500 phrases traduites', req: (s: UserStats) => s.total_phrases >= 500 },
  { id: 'first_session', emoji: '🎮', label: 'Premier game', desc: 'Première session de jeu', req: (s: UserStats) => s.total_sessions >= 1 },
  { id: 'sessions_10', emoji: '🔥', label: 'Régulier', desc: '10 sessions jouées', req: (s: UserStats) => s.total_sessions >= 10 },
  { id: 'sessions_50', emoji: '💎', label: 'Hardcore', desc: '50 sessions jouées', req: (s: UserStats) => s.total_sessions >= 50 },
  { id: 'minutes_60', emoji: '⏱️', label: 'Une heure', desc: '60 minutes de traduction', req: (s: UserStats) => s.total_minutes >= 60 },
  { id: 'minutes_600', emoji: '🌟', label: 'Dix heures', desc: '10 heures de traduction', req: (s: UserStats) => s.total_minutes >= 600 },
  { id: 'multilingual', emoji: '🌍', label: 'Multilingue', desc: '3 langues différentes utilisées', req: (s: UserStats) => s.top_languages.length >= 3 },
  { id: 'gamer', emoji: '🕹️', label: 'Gamer', desc: '3 jeux différents joués', req: (s: UserStats) => s.top_games.length >= 3 },
]

// Cache module-level — survit aux démontages/remontages du composant
let _statsCache: UserStats | null = null
let _statsCacheUserId: string | null = null

export function StatsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useAppLanguage()

  const hasCache = _statsCache !== null && _statsCacheUserId === user?.id
  const [stats, setStats] = useState<UserStats | null>(hasCache ? _statsCache : null)
  const [loading, setLoading] = useState(!hasCache)

  useEffect(() => {
    if (user?.id) loadStats()
  }, [user?.id])

  async function loadStats() {
    if (!user) return
    try {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        const loaded: UserStats = {
          total_phrases: data.total_phrases || 0,
          total_sessions: data.total_sessions || 0,
          total_minutes: data.total_minutes || 0,
          top_languages: data.top_languages || [],
          top_games: data.top_games || [],
        }
        _statsCache = loaded
        _statsCacheUserId = user.id
        setStats(loaded)
      }
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayStats = stats ?? {
    total_phrases: 0, total_sessions: 0, total_minutes: 0,
    top_languages: [], top_games: [],
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.req(displayStats))
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.req(displayStats))
  const progress = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)
  const hours = Math.floor(displayStats.total_minutes / 60)
  const minutes = displayStats.total_minutes % 60

  const statCards = [
    { value: displayStats.total_phrases, label: t('stats.total.phrases'), color: tokens.colors.cyan },
    { value: displayStats.total_sessions, label: t('stats.total.sessions'), color: tokens.colors.purple },
    { value: hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`, label: t('stats.total.minutes'), color: tokens.colors.green },
  ]

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 24px 24px', maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${tokens.colors.border}`, marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '18px', fontWeight: tokens.fontWeights.bold, letterSpacing: tokens.letterSpacing.wide }}>GG TRANSLATE</div>
          <div style={{ color: tokens.colors.dim, fontSize: '10px', letterSpacing: tokens.letterSpacing.widest, marginTop: '2px' }}>{t('stats.title')}</div>
        </div>
        <button onClick={() => navigate('/translate')}
          style={{ background: 'transparent', border: 'none', color: tokens.colors.muted, cursor: 'pointer', fontSize: '13px', transition: tokens.transitions.normal }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.colors.text}
          onMouseLeave={e => e.currentTarget.style.color = tokens.colors.muted}
        >{t('stats.back')}</button>
      </div>

      {loading && !stats ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: tokens.colors.dim, textAlign: 'center', padding: '60px', fontFamily: tokens.fonts.display, fontSize: '12px' }}>
          ⟳ {t('splash.loading')}
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {statCards.map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px', textAlign: 'center' }}>
                  <div style={{ color: card.color, fontSize: '32px', fontWeight: tokens.fontWeights.bold, fontFamily: tokens.fonts.display }}>{card.value}</div>
                  <div style={{ color: tokens.colors.dim, fontSize: '11px', marginTop: '6px' }}>{card.label}</div>
                </motion.div>
              ))}
            </div>

            {displayStats.top_languages.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}
                style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px', marginBottom: '20px' }}>
                <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide, marginBottom: '16px' }}>{t('stats.top.langs')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {displayStats.top_languages.slice(0, 5).map((lang, i) => {
                    const max = displayStats.top_languages[0]?.count || 1
                    const pct = Math.round((lang.count / max) * 100)
                    const barColor = i === 0 ? tokens.colors.cyan : i === 1 ? tokens.colors.purple : tokens.colors.blue
                    return (
                      <div key={lang.code}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: tokens.colors.muted, fontSize: '13px' }}>{lang.flag} {lang.name}</span>
                          <span style={{ color: tokens.colors.dim, fontSize: '11px' }}>{lang.count} phrases</span>
                        </div>
                        <div style={{ background: tokens.colors.bg3, borderRadius: tokens.radius.full, height: '6px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: tokens.radius.full, background: barColor }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {displayStats.top_games.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.32 }}
                style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px', marginBottom: '20px' }}>
                <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide, marginBottom: '16px' }}>{t('stats.top.games')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {displayStats.top_games.slice(0, 6).map((game, i) => (
                    <motion.div key={game.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: 0.35 + i * 0.06 }}
                      style={{ background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.lg, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{game.emoji}</span>
                      <div>
                        <div style={{ color: tokens.colors.text, fontSize: '12px' }}>{game.name}</div>
                        <div style={{ color: tokens.colors.dim, fontSize: '10px' }}>{game.count} sessions</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}
              style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide }}>🏆 ACHIEVEMENTS</div>
                <span style={{ color: tokens.colors.dim, fontSize: '11px' }}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
              </div>
              <div style={{ background: tokens.colors.bg3, borderRadius: tokens.radius.full, height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: tokens.radius.full, background: tokens.gradients.primaryR }} />
              </div>

              {unlockedAchievements.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: tokens.colors.green, fontSize: '11px', marginBottom: '10px' }}>✅ Débloqués</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {unlockedAchievements.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: 0.55 + i * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ background: tokens.alpha.greenDim, border: `1px solid rgba(34,197,94,0.3)`, borderRadius: tokens.radius.lg, padding: '12px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{a.emoji}</div>
                        <div style={{ color: tokens.colors.green, fontSize: '11px', fontWeight: tokens.fontWeights.bold, fontFamily: tokens.fonts.display }}>{a.label}</div>
                        <div style={{ color: tokens.colors.dim, fontSize: '10px', marginTop: '2px' }}>{a.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {lockedAchievements.length > 0 && (
                <div>
                  <div style={{ color: tokens.colors.veryDim, fontSize: '11px', marginBottom: '10px' }}>🔒 À débloquer</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {lockedAchievements.map(a => (
                      <div key={a.id} style={{ background: tokens.colors.bg3, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.lg, padding: '12px', opacity: 0.45 }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px', filter: 'grayscale(1)' }}>{a.emoji}</div>
                        <div style={{ color: tokens.colors.dim, fontSize: '11px', fontFamily: tokens.fonts.display }}>{a.label}</div>
                        <div style={{ color: tokens.colors.veryDim, fontSize: '10px', marginTop: '2px' }}>{a.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats && displayStats.total_phrases === 0 && displayStats.total_sessions === 0 && (
                <div style={{ color: tokens.colors.dim, fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  {t('stats.no.data')}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}