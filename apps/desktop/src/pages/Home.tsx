import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (!data.session?.user) {
        // Session invalide ou expirée — clear tout et login
        useAuthStore.getState().signOut()
        navigate('/login', { replace: true })
        return
      }

      // Session valide — charge le profil
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