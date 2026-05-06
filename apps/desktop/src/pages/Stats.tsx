import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAppLanguage } from '../store/appLanguage'
import { supabase } from '../lib/supabase'

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

export function StatsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useAppLanguage()
  const [stats, setStats] = useState<UserStats>({ total_phrases: 0, total_sessions: 0, total_minutes: 0, top_languages: [], top_games: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('user_stats').select('*').eq('id', user.id).single()
    if (data) {
      setStats({
        total_phrases: data.total_phrases || 0,
        total_sessions: data.total_sessions || 0,
        total_minutes: data.total_minutes || 0,
        top_languages: data.top_languages || [],
        top_games: data.top_games || [],
      })
    }
    setLoading(false)
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.req(stats))
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.req(stats))
  const progress = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)
  const hours = Math.floor(stats.total_minutes / 60)
  const minutes = stats.total_minutes % 60

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 24px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        @keyframes fill { from { width: 0%; } to { width: var(--w); } }
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1e2d45', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px' }}>{t('stats.title')}</div>
        </div>
        <button onClick={() => navigate('/translate')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>{t('stats.back')}</button>
      </div>

      {loading ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: '60px', fontFamily: 'Orbitron, sans-serif', fontSize: '12px' }}>⟳ {t('splash.loading')}</div>
      ) : (
        <>
          {/* STATS PRINCIPALES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: '#06b6d4', fontSize: '32px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{stats.total_phrases}</div>
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>{t('stats.total.phrases')}</div>
            </div>
            <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: '#a855f7', fontSize: '32px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{stats.total_sessions}</div>
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>{t('stats.total.sessions')}</div>
            </div>
            <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: '#22c55e', fontSize: '32px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
                {hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`}
              </div>
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>{t('stats.total.minutes')}</div>
            </div>
          </div>

          {/* TOP LANGUES */}
          {stats.top_languages.length > 0 && (
            <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '16px' }}>{t('stats.top.langs')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.top_languages.slice(0, 5).map((lang, i) => {
                  const max = stats.top_languages[0]?.count || 1
                  const pct = Math.round((lang.count / max) * 100)
                  return (
                    <div key={lang.code}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>{lang.flag} {lang.name}</span>
                        <span style={{ color: '#475569', fontSize: '11px' }}>{lang.count} phrases</span>
                      </div>
                      <div style={{ background: '#111827', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '99px', background: i === 0 ? '#06b6d4' : i === 1 ? '#a855f7' : '#3b82f6', width: `${pct}%`, transition: 'width 1s ease' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TOP JEUX */}
          {stats.top_games.length > 0 && (
            <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '16px' }}>{t('stats.top.games')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {stats.top_games.slice(0, 6).map(game => (
                  <div key={game.name} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{game.emoji}</span>
                    <div>
                      <div style={{ color: '#fff', fontSize: '12px' }}>{game.name}</div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>{game.count} sessions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS */}
          <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em' }}>🏆 ACHIEVEMENTS</div>
              <span style={{ color: '#475569', fontSize: '11px' }}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <div style={{ background: '#111827', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', width: `${progress}%`, transition: 'width 1s ease' }}/>
            </div>

            {unlockedAchievements.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#22c55e', fontSize: '11px', marginBottom: '10px' }}>✅ Débloqués</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {unlockedAchievements.map(a => (
                    <div key={a.id} style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '12px', animation: 'pop 0.3s ease' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{a.emoji}</div>
                      <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{a.label}</div>
                      <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lockedAchievements.length > 0 && (
              <div>
                <div style={{ color: '#334155', fontSize: '11px', marginBottom: '10px' }}>🔒 À débloquer</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {lockedAchievements.map(a => (
                    <div key={a.id} style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '10px', padding: '12px', opacity: 0.5 }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px', filter: 'grayscale(1)' }}>{a.emoji}</div>
                      <div style={{ color: '#475569', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{a.label}</div>
                      <div style={{ color: '#334155', fontSize: '10px', marginTop: '2px' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.total_phrases === 0 && stats.total_sessions === 0 && (
              <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                {t('stats.no.data')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}