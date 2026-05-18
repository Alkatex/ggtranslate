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

const APP_VERSION = '1.0.4'

let authInProgress = false

async function handleVersionMigration() {
  const savedVersion = localStorage.getItem('app_version')
  if (savedVersion !== APP_VERSION) {
    console.log('Nouvelle version détectée → nettoyage session')
    await supabase.auth.signOut()
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    localStorage.setItem('app_version', APP_VERSION)
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuthStore()
  if (authState === 'loading') return <SplashPage />
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, authState } = useAuthStore()
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  const location = useLocation()
  const isOCRSelect = location.pathname === '/ocr-select'

  // ─── FIX: Overlay — fond transparent forcé, hors du wrapper principal ────
  const isOverlay = location.pathname === '/overlay'

  useEffect(() => {
    if (authInProgress) return
    authInProgress = true

    async function initAuth() {
      try {
        await handleVersionMigration()

        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          useAuthStore.setState({
            user: session.user,
            session,
            isAuthenticated: true,
            authState: 'authenticated',
          })
          await useAuthStore.getState().loadProfile()
        } else {
          useAuthStore.setState({
            user: null, session: null,
            isAuthenticated: false,
            authState: 'unauthenticated',
          })
        }
      } catch (err) {
        console.error('initAuth error:', err)
        useAuthStore.setState({
          user: null, isAuthenticated: false,
          authState: 'unauthenticated',
        })
      } finally {
        useAuthStore.setState({ authInitialized: true })
        authInProgress = false
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const { authInitialized } = useAuthStore.getState()

        if (event === 'SIGNED_IN' && session) {
          if (authInitialized) {
            useAuthStore.setState({
              user: session.user,
              session,
              isAuthenticated: true,
              authState: 'authenticated',
            })
            await useAuthStore.getState().loadProfile()
          }
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          useAuthStore.setState({
            user: session.user,
            session,
            isAuthenticated: true,
          })
        }

        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({
            user: null, session: null, isAuthenticated: false,
            profile: null, subscription: null,
            plan: 'free', secondsRemaining: -1,
            authState: 'unauthenticated',
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (authState === 'loading') return <SplashPage />

  if (isOCRSelect) return <OCRSelectPage />

  // ─── FIX: Overlay rendu hors du wrapper — fond forcé transparent ──────────
  if (isOverlay) {
    document.body.style.backgroundColor = 'transparent'
    document.body.style.background = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
    document.documentElement.style.background = 'transparent'
    const root = document.getElementById('root')
    if (root) {
      root.style.backgroundColor = 'transparent'
      root.style.background = 'transparent'
    }
    return <OverlayPage />
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