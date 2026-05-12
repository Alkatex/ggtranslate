import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function checkSession() {
      // ← Clear préventif des clés Supabase corrompues
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          localStorage.removeItem(key)
        }
      })

      const { data } = await supabase.auth.getSession()

      if (!data.session?.user) {
        useAuthStore.getState().signOut()
        navigate('/login', { replace: true })
        return
      }

      await useAuthStore.getState().loadProfile()

      const onboardingDone = localStorage.getItem('onboarding_done')
      if (onboardingDone) {
        navigate('/translate', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }

    checkSession()
  }, [])

  return null
}