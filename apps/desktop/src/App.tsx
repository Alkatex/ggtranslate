import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ParticleBackground } from './components/ParticleBackground'
import { HomePage } from './pages/Home'
import { OnboardingPage } from './pages/Onboarding'
import { TranslatePage } from './pages/Translate'
import { GroupsPage } from './pages/Groups'
import { PricingPage } from './pages/Pricing'
import { LoginPage } from './pages/Login'
import { SplashPage } from './pages/Splash'
import { useAuthStore } from './store/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, refreshSession } = useAuthStore()

  useEffect(() => {
    refreshSession()
  }, [])

  return (
    <HashRouter>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Splash screen — première page */}
          <Route path="/" element={<SplashPage />} />

          {/* Routes publiques */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated
              ? <Navigate to="/translate" replace />
              : <LoginPage />
          } />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Routes protégées */}
          <Route path="/translate" element={
            <ProtectedRoute>
              <TranslatePage />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            isAuthenticated
              ? <Navigate to="/translate" replace />
              : <Navigate to="/" replace />
          } />
        </Routes>
      </div>
    </HashRouter>
  )
}