import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ParticleBackground } from './components/ParticleBackground'

function HomePage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      zIndex: 1,
    }}>
      <h1 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#06b6d4',
        fontSize: '48px',
        letterSpacing: '0.1em',
      }}>
        GG TRANSLATE
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>
        Traduction vocale gaming — temps réel
      </p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}