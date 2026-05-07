import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, Profile, Subscription, Plan, PLAN_LIMITS } from '../lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  subscription: Subscription | null
  plan: Plan
  secondsRemaining: number
  isLoading: boolean
  isAuthenticated: boolean

  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  consumeSeconds: (seconds: number) => Promise<void>
  refreshSession: () => Promise<void>
  canUseFeature: (feature: 'otherPlayers' | 'voiceEffects' | 'voiceCloning') => boolean
  canUseLanguage: (langCode: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      subscription: null,
      plan: 'free',
      secondsRemaining: -1,
      isLoading: false,
      isAuthenticated: false,

      signInWithEmail: async (email, password) => {
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { set({ isLoading: false }); throw error }
        set({ user: data.user, isAuthenticated: true })
        await get().loadProfile()
        set({ isLoading: false })
      },

      signUpWithEmail: async (email, password) => {
        set({ isLoading: true })
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) { set({ isLoading: false }); throw error }
        set({ user: data.user, isAuthenticated: !!data.user })
        if (data.user) await get().loadProfile()
        set({ isLoading: false })
      },

      signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: false,
          }
        })
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({
          user: null, profile: null,
          subscription: null, plan: 'free',
          secondsRemaining: -1, isAuthenticated: false,
        })
        // Force la navigation vers login
        window.location.hash = '#/login'
      },

      loadProfile: async () => {
        const { user } = get()
        if (!user) return

        // Retry 3 fois si subscription pas trouvée
        let profile = null
        let subscription = null

        for (let i = 0; i < 3; i++) {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          const { data: s } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

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
      },

      consumeSeconds: async (seconds: number) => {
        const { user, profile, secondsRemaining, plan } = get()
        if (!user || !profile) return
        if (plan === 'pro') return

        const newRemaining = Math.max(0, secondsRemaining - seconds)
        set({ secondsRemaining: newRemaining })

        const newMinutesUsed = profile.minutes_used_today + Math.ceil(seconds / 60)
        await supabase
          .from('profiles')
          .update({ minutes_used_today: newMinutesUsed })
          .eq('id', user.id)
      },

      refreshSession: async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          set({ user: data.session.user, isAuthenticated: true })
          await get().loadProfile()
        } else {
          await new Promise(r => setTimeout(r, 1000))
          const { data: retryData } = await supabase.auth.getSession()
          if (retryData.session?.user) {
            set({ user: retryData.session.user, isAuthenticated: true })
            await get().loadProfile()
          } else {
            set({ user: null, isAuthenticated: false })
          }
        }
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
        const freeLangs = ['fr', 'en']
        return freeLangs.includes(langCode)
      },
    }),
    {
      name: 'ggtranslate-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        plan: state.plan,
        subscription: state.subscription,
        secondsRemaining: state.secondsRemaining,
      }),
    }
  )
)