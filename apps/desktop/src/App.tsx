import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h1 style={{ 
        fontFamily: 'Orbitron, sans-serif', 
        color: '#06b6d4',
        fontSize: '48px'
      }}>
        GG TRANSLATE
      </h1>
      <p style={{ color: '#94a3b8' }}>
        Phase 1 — Shell opérationnel ✓
      </p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}