import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ParticleBackground } from './components/ParticleBackground'
import { TranslatePage } from './pages/Translate'
import { HomePage } from './pages/Home'

export default function App() {
  return (
    <HashRouter>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}