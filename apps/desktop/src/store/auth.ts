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

  // Actions
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  consumeSeconds: (seconds: number) => Promise<void>
  refreshSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      subscription: null,
      plan: 'free',
      secondsRemaining: 0,
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
          options: { redirectTo: 'ggtranslate://auth/callback' }
        })
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({
          user: null, profile: null,
          subscription: null, plan: 'free',
          secondsRemaining: 0, isAuthenticated: false,
        })
      },

      loadProfile: async () => {
        const { user } = get()
        if (!user) return

        // Charger le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Charger la subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        // Déterminer le plan
        let plan: Plan = 'free'
        if (subscription?.plan === 'pro') plan = 'pro'
        else if (subscription?.plan === 'starter') plan = 'starter'
        else if (profile && !profile.trial_used) plan = 'trial'

        // Calculer les secondes restantes aujourd'hui
        const limits = PLAN_LIMITS[plan]
        const secondsUsed = profile?.minutes_used_today ? profile.minutes_used_today * 60 : 0
        const secondsRemaining = limits.secondsPerDay === -1
          ? 999999
          : Math.max(0, limits.secondsPerDay - secondsUsed)

        set({ profile, subscription, plan, secondsRemaining })
      },

      consumeSeconds: async (seconds: number) => {
        const { user, profile, secondsRemaining } = get()
        if (!user || !profile) return

        const newRemaining = Math.max(0, secondsRemaining - seconds)
        set({ secondsRemaining: newRemaining })

        // Mettre à jour dans Supabase
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
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'ggtranslate-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)