import { useNavigate } from 'react-router-dom'

export function GroupsPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '24px 48px',
      maxWidth: '800px', margin: '0 auto',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '20px',
            letterSpacing: '0.1em',
          }}>GG TRANSLATE</h1>
          <p style={{
            color: '#475569', fontSize: '11px',
            letterSpacing: '0.15em', marginTop: '2px',
          }}>GROUPES VOCAUX</p>
        </div>
        <button
          onClick={() => navigate('/translate')}
          style={{
            background: 'transparent', border: 'none',
            color: '#94a3b8', cursor: 'pointer', fontSize: '13px',
          }}>← Traducteur</button>
      </div>

      {/* LANGUE */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          color: '#94a3b8', fontSize: '11px',
          letterSpacing: '0.1em', marginBottom: '8px',
          fontFamily: 'Orbitron, sans-serif',
        }}>MA LANGUE DANS LES GROUPES</p>
        <select style={{
          width: '100%', background: '#0d1424',
          border: '1px solid #1e2d45', color: '#fff',
          padding: '12px 16px', borderRadius: '10px',
          fontSize: '14px', cursor: 'pointer',
        }}>
          <option>🇫🇷 Français</option>
          <option>🇬🇧 English</option>
          <option>🇪🇸 Español</option>
        </select>
      </div>

      {/* BOUTONS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button style={{
          flex: 1,
          background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
          border: 'none', color: '#fff',
          padding: '14px', borderRadius: '10px',
          cursor: 'pointer', fontSize: '14px',
          fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
        }}>+ Créer un groupe</button>
        <button style={{
          flex: 1, background: 'transparent',
          border: '1px solid #1e2d45', color: '#fff',
          padding: '14px', borderRadius: '10px',
          cursor: 'pointer', fontSize: '14px',
          fontFamily: 'Orbitron, sans-serif',
        }}># Rejoindre par code</button>
      </div>

      {/* GROUPES PUBLICS */}
      <p style={{
        color: '#94a3b8', fontSize: '11px',
        letterSpacing: '0.1em', marginBottom: '12px',
        fontFamily: 'Orbitron, sans-serif',
      }}>👥 GROUPES PUBLICS</p>
      <div style={{
        border: '1px dashed #1e2d45', borderRadius: '12px',
        padding: '40px', textAlign: 'center',
        color: '#475569', fontSize: '14px',
      }}>
        Aucun groupe public disponible
      </div>
    </div>
  )
}