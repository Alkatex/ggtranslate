import { supabase } from './supabase'

export async function updateStats(userId: string, opts: {
  phrases?: number
  minutes?: number
  sourceLang?: { code: string; flag: string; name: string }
  targetLang?: { code: string; flag: string; name: string }
  game?: { name: string; emoji: string } | null
  newSession?: boolean
}) {
  try {
    // ─── Charger les stats actuelles depuis user_stats ────────────────────────
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single()

    const topLanguages: { code: string; flag: string; name: string; count: number }[] = current?.top_languages || []
    const topGames: { name: string; emoji: string; count: number }[] = current?.top_games || []

    // ─── Mettre à jour les langues ────────────────────────────────────────────
    if (opts.targetLang) {
      const existing = topLanguages.find(l => l.code === opts.targetLang!.code)
      if (existing) {
        existing.count += opts.phrases || 1
      } else {
        topLanguages.push({ ...opts.targetLang, count: opts.phrases || 1 })
      }
      topLanguages.sort((a, b) => b.count - a.count)
    }

    // ─── Mettre à jour les jeux ───────────────────────────────────────────────
    if (opts.game) {
      const existing = topGames.find(g => g.name === opts.game!.name)
      if (existing) {
        existing.count += 1
      } else {
        topGames.push({ ...opts.game, count: 1 })
      }
      topGames.sort((a, b) => b.count - a.count)
    }

    // ─── Mise à jour user_stats (stats totales à vie) ─────────────────────────
    await supabase.from('user_stats').upsert({
      id: userId,
      total_phrases: (current?.total_phrases || 0) + (opts.phrases || 0),
      total_sessions: (current?.total_sessions || 0) + (opts.newSession ? 1 : 0),
      total_minutes: (current?.total_minutes || 0) + (opts.minutes || 0),
      top_languages: topLanguages,
      top_games: topGames,
      updated_at: new Date().toISOString(),
    })

    // ─── FIX: Sync minutes_used_today dans profiles avec UPDATE ──────────────
    // UPDATE au lieu de upsert pour ne pas écraser les autres colonnes
    if (opts.minutes && opts.minutes > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('minutes_used_today')
        .eq('id', userId)
        .single()

      const currentMinutes = profileData?.minutes_used_today ?? 0

      await supabase
        .from('profiles')
        .update({ minutes_used_today: currentMinutes + opts.minutes })
        .eq('id', userId)
    }

  } catch (err) {
    console.error('[Stats] Erreur mise à jour:', err)
  }
}