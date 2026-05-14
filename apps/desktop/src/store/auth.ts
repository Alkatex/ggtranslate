import { create } from 'zustand'
import { supabase, Profile, Subscription, Plan, PLAN_LIMITS } from '../lib/supabase'

type AuthStateStatus = 'loading' | 'authenticated' | 'unauthenticated'

let profileLoading = false

interface AuthState {
  authState: AuthStateStatus
  session: any | null
  user: any | null
  profile: Profile | null
  subscription: Subscription | null
  plan: Plan
  secondsRemaining: number
  isLoading: boolean
  isAuthenticated: boolean
  authInitialized: boolean

  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  consumeSeconds: (seconds: number) => Promise<void>
  canUseFeature: (feature: 'otherPlayers' | 'voiceEffects' | 'voiceCloning') => boolean
  canUseLanguage: (langCode: string) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  authState: 'loading',
  session: null,
  user: null,
  profile: null,
  subscription: null,
  plan: 'free',
  secondsRemaining: -1,
  isLoading: false,
  isAuthenticated: false,
  authInitialized: false,

  signInWithEmail: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ isLoading: false }); throw error }
    set({ user: data.user, session: data.session, isAuthenticated: true, authState: 'authenticated' })
    await get().loadProfile()
    set({ isLoading: false })
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { set({ isLoading: false }); throw error }
    set({ user: data.user, isAuthenticated: !!data.user, authState: data.user ? 'authenticated' : 'unauthenticated' })
    if (data.user) await get().loadProfile()
    set({ isLoading: false })
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, skipBrowserRedirect: false }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    set({
      user: null, session: null, profile: null,
      subscription: null, plan: 'free',
      secondsRemaining: -1, isAuthenticated: false,
      authState: 'unauthenticated',
    })
  },

  loadProfile: async () => {
    if (profileLoading) return
    profileLoading = true

    try {
      const { user } = get()
      if (!user) return

      let profile = null
      let subscription = null

      for (let i = 0; i < 3; i++) {
        const { data: p } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()

        const { data: s } = await supabase
          .from('subscriptions').select('*')
          .eq('user_id', user.id).eq('status', 'active').single()

        profile = p
        subscription = s

        if (subscription?.plan) break
        if (i < 2) await new Promise(r => setTimeout(r, 800))
      }

      let plan: Plan = 'free'
      if (subscription?.plan === 'pro') plan = 'pro'
      else if (subscription?.plan === 'starter') plan = 'starter'
      else if (profile && !profile.trial_used) plan = 'trial'

      let secondsRemaining: number
      if (plan === 'pro') {
        secondsRemaining = -1
      } else {
        const limits = PLAN_LIMITS[plan]
        const secondsUsed = profile?.minutes_used_today ? profile.minutes_used_today * 60 : 0
        secondsRemaining = Math.max(0, limits.secondsPerDay - secondsUsed)
      }

      set({ profile, subscription, plan, secondsRemaining })
    } finally {
      profileLoading = false
    }
  },

  consumeSeconds: async (seconds: number) => {
    const { user, profile, secondsRemaining, plan } = get()
    if (!user || !profile) return
    if (plan === 'pro') return

    const newRemaining = Math.max(0, secondsRemaining - seconds)
    set({ secondsRemaining: newRemaining })

    const newMinutesUsed = profile.minutes_used_today + Math.ceil(seconds / 60)
    await supabase.from('profiles')
      .update({ minutes_used_today: newMinutesUsed })
      .eq('id', user.id)
  },

  canUseFeature: (feature) => {
    const { plan } = get()
    const limits = PLAN_LIMITS[plan]
    if (feature === 'otherPlayers') return limits.otherPlayers
    if (feature === 'voiceCloning') return limits.voiceCloning
    if (feature === 'voiceEffects') return limits.voiceEffects > 0
    return false
  },

  canUseLanguage: (langCode) => {
    const { plan } = get()
    const limits = PLAN_LIMITS[plan]
    if (limits.languages === -1) return true
    return ['fr', 'en'].includes(langCode)
  },
}))