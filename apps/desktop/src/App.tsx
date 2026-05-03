import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ParticleBackground } from './components/ParticleBackground'
import { HomePage } from './pages/Home'
import { OnboardingPage } from './pages/Onboarding'
import { TranslatePage } from './pages/Translate'
import { GroupsPage } from './pages/Groups'
import { PricingPage } from './pages/Pricing'
import { LoginPage } from './pages/Login'
import { SplashPage } from './pages/Splash'
import { OverlayPage } from './pages/Overlay'
import { OCRPage } from './pages/OCR'
import { OCRSelectPage } from './pages/OCRSelect'
import { ProfilePage } from './pages/Profile'
import { StatsPage } from './pages/Stats'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import { supabase } from './lib/supabase'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, refreshSession } = useAuthStore()
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  const location = useLocation()
  const isOCRSelect = location.pathname === '/ocr-select'

  useEffect(() => {
    // Refresh session au démarrage
    refreshSession()

    // Écoute les changements auth — capte le retour Google OAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          await useAuthStore.getState().refreshSession()
        }
        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({ user: null, isAuthenticated: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (isOCRSelect) {
    return <OCRSelectPage />
  }

  return (
    <>
      <ParticleBackground />
      <div style={{
        position: 'relative', zIndex: 1,
        filter: theme.filter === 'none' ? undefined : theme.filter,
        minHeight: '100vh',
      }}>
        <Routes>
          <Route path="/overlay" element={<OverlayPage />} />
          <Route path="/ocr" element={<OCRPage />} />
          <Route path="/ocr-select" element={<OCRSelectPage />} />
          <Route path="/" element={<SplashPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated
              ? <Navigate to="/translate" replace />
              : <LoginPage />
          } />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/translate" element={
            <ProtectedRoute><TranslatePage /></ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute><GroupsPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/stats" element={
            <ProtectedRoute><StatsPage /></ProtectedRoute>
          } />
          <Route path="*" element={
            isAuthenticated
              ? <Navigate to="/translate" replace />
              : <Navigate to="/" replace />
          } />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}