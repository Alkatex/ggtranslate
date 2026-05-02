import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_done')
    if (onboardingDone) {
      navigate('/translate', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }, [])

  return null
}