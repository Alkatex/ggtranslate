import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ParticleBackground } from './components/ParticleBackground'
import { HomePage } from './pages/Home'
import { OnboardingPage } from './pages/Onboarding'
import { TranslatePage } from './pages/Translate'
import { GroupsPage } from './pages/Groups'
import { PricingPage } from './pages/Pricing'

export default function App() {
  return (
    <HashRouter>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}