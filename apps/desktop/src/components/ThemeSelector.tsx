import { useThemeStore, THEMES } from '../store/theme'

interface Props {
  onClose: () => void
}

export function ThemeSelector({ onClose }: Props) {
  const { themeId, setTheme } = useThemeStore()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1424', border: '1px solid #1e2d45',
          borderRadius: '20px', padding: '28px',
          maxWidth: '520px', width: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em' }}>
              🎨 THÈME VISUEL
            </div>
            <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>
              Personnalise l'apparence de GGTranslate
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: '20px',
          }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {THEMES.map(theme => (
            <div
              key={theme.id}
              onClick={() => { setTheme(theme.id); onClose() }}
              style={{
                background: themeId === theme.id ? 'rgba(6,182,212,0.15)' : '#111827',
                border: `2px solid ${themeId === theme.id ? '#06b6d4' : '#1e2d45'}`,
                borderRadius: '12px', padding: '14px',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {themeId === theme.id && (
                <div style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '8px', height: '8px',
                  background: '#06b6d4', borderRadius: '50%',
                }}/>
              )}
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{theme.emoji}</div>
              <div style={{ color: '#fff', fontSize: '13px', fontFamily: 'Orbitron, sans-serif', marginBottom: '4px' }}>
                {theme.name}
              </div>
              <div style={{ color: '#475569', fontSize: '11px', lineHeight: 1.4 }}>
                {theme.description}
              </div>

              {/* Preview couleur */}
              <div style={{
                marginTop: '10px', height: '4px', borderRadius: '99px',
                background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                filter: theme.filter === 'none' ? 'none' : theme.filter,
              }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}