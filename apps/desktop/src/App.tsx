import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

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

let authInitGuard = false
let lastProfileLoad = 0

// -------------------------
// VERSION MIGRATION
// -------------------------
async function handleVersionMigration() {
  const saved = localStorage.getItem('app_version')
  if (saved !== APP_VERSION) {
    await supabase.auth.signOut()
    Object.keys(localStorage).forEach((k) => {
      if (k.includes('supabase') || k.includes('sb-')) {
        localStorage.removeItem(k)
      }
    })
    localStorage.setItem('app_version', APP_VERSION)
  }
}

// -------------------------
// PROFILE SAFE LOADER
// -------------------------
async function safeLoadProfile(isBoot = false) {
  const now = Date.now()
  if (!isBoot && now - lastProfileLoad < 4000) return
  lastProfileLoad = now
  await useAuthStore.getState().loadProfile()
}

// -------------------------
// ROUTE RESOLVER
// -------------------------
function resolveRoute(profile: any, session: any): string {
  if (!session?.user) return '/login'
  if (!profile?.onboarding_done) return '/onboarding'
  return '/translate'
}

// -------------------------
// PROTECTED ROUTE
// -------------------------
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuthStore()
  if (authState === 'loading') return <SplashPage />
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />
  return <>{children}</>
}

// -------------------------
// APP ROUTES
// -------------------------
function AppRoutes() {
  const { authState, profile, session } = useAuthStore()
  const { getTheme } = useThemeStore()
  const theme = getTheme()

  const [booting, setBooting] = useState(true)
  const [route, setRoute] = useState<string | null>(null)

  // -------------------------
  // INIT AUTH
  // -------------------------
  useEffect(() => {
    if (authInitGuard) return
    authInitGuard = true

    async function init() {
      // ← Splash minimum 5 secondes
      const minSplash = new Promise(r => setTimeout(r, 5000))

      try {
        handleVersionMigration().catch(console.error)

        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          useAuthStore.setState({
            user: session.user,
            session,
            authState: 'authenticated',
          })
          await safeLoadProfile(true)
        } else {
          useAuthStore.setState({
            user: null,
            session: null,
            authState: 'unauthenticated',
          })
        }
      } catch (e) {
        console.error(e)
        useAuthStore.setState({
          user: null,
          session: null,
          authState: 'unauthenticated',
        })
      } finally {
        // ← Attend 5s minimum avant de cacher le splash
        await minSplash
        setBooting(false)
        useAuthStore.setState({ authInitialized: true })
      }
    }

    init()

    // -------------------------
    // AUTH EVENTS
    // -------------------------
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          useAuthStore.setState({
            user: session.user,
            session,
            authState: 'authenticated',
          })
          await safeLoadProfile(false)
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          useAuthStore.setState({
            session,
            user: session.user,
          })
        }

        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({
            user: null,
            session: null,
            authState: 'unauthenticated',
            profile: null,
            subscription: null,
            plan: 'free',
            secondsRemaining: -1,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // -------------------------
  // ROUTE REACTIVE
  // -------------------------
  useEffect(() => {
    if (authState === 'loading') return
    setRoute(resolveRoute(profile, session))
  }, [profile, session, authState])

  // -------------------------
  // BOOT SCREEN
  // -------------------------
  if (booting || authState === 'loading' || route === null) return <SplashPage />

  return (
    <>
      <ParticleBackground />
      <div style={{
        position: 'relative',
        zIndex: 1,
        filter: theme.filter === 'none' ? undefined : theme.filter,
        minHeight: '100vh',
      }}>
        <Routes>
          <Route path="/" element={<Navigate to={route} replace />} />

          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route path="/login" element={
            authState === 'authenticated'
              ? <Navigate to={route} replace />
              : <LoginPage />
          } />

          <Route path="/pricing" element={<PricingPage />} />

          <Route path="/overlay" element={<OverlayPage />} />
          <Route path="/ocr" element={<OCRPage />} />
          <Route path="/ocr-select" element={<OCRSelectPage />} />

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
            authState === 'authenticated'
              ? <Navigate to="/translate" replace />
              : <Navigate to="/login" replace />
          } />
        </Routes>
      </div>
    </>
  )
}

// -------------------------
// ROOT APP
// -------------------------
export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}