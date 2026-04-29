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
import { useAuthStore } from './store/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, refreshSession } = useAuthStore()
  const location = useLocation()
  const isOCRSelect = location.pathname === '/ocr-select'

  useEffect(() => {
    refreshSession()
  }, [])

  if (isOCRSelect) {
    return <OCRSelectPage />
  }

  return (
    <>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
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