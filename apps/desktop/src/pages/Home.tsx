import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.onboarding_done) {
      navigate('/translate', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }, [profile, navigate])

  return null
}