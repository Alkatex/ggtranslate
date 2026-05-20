import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ou clé manquante dans .env')
}

// La fenêtre OCR select est une fenêtre secondaire — elle ne doit pas écrire dans
// le localStorage ni rafraîchir le token, sinon ça déclenche SIGNED_IN/TOKEN_REFRESHED
// dans la fenêtre principale et corrompt l'état Stats/Profile.
const isSecondaryWindow = typeof window !== 'undefined'
  && (window.location.hash.startsWith('#/ocr-select') || window.location.hash.startsWith('#/overlay'))

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isSecondaryWindow,
    autoRefreshToken: !isSecondaryWindow,
    detectSessionInUrl: false,
  }
})

export interface Profile {
  id: string
  display_name: string | null
  created_at: string
  source_language: string
  target_language: string
  trial_used: boolean
  trial_minutes_remaining: number
  minutes_used_today: number
  streak_days: number
  last_session_date: string | null
  elevenlabs_voice_id: string | null
  onboarding_done: boolean // ← nouveau
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'starter' | 'pro'
  status: 'active' | 'inactive' | 'canceled'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
}

export type Plan = 'free' | 'starter' | 'pro' | 'trial'

export const PLAN_LIMITS = {
  free: { secondsPerDay: 600, languages: 2, otherPlayers: false, voiceEffects: 0, voiceCloning: false },
  starter: { secondsPerDay: 10800, languages: 7, otherPlayers: true, voiceEffects: 10, voiceCloning: false },
  pro: { secondsPerDay: -1, languages: -1, otherPlayers: true, voiceEffects: 50, voiceCloning: true },
  trial: { secondsPerDay: 900, languages: -1, otherPlayers: true, voiceEffects: 50, voiceCloning: false },
}