import { useThemeStore, THEMES } from '../store/theme'

interface Props {
  onClose: () => void
}

const THEME_COLORS: Record<string, string> = {
  cyber:  'linear-gradient(to right, #06b6d4, #3b82f6)',
  clean:  'linear-gradient(to right, #5865f2, #7289da)',
  neon:   'linear-gradient(to right, #22c55e, #16a34a)',
  blood:  'linear-gradient(to right, #ef4444, #991b1b)',
  aurora: 'linear-gradient(to right, #8b5cf6, #6366f1)',
  sunset: 'linear-gradient(to right, #f97316, #ec4899)',
  ghost:  'linear-gradient(to right, #e2e8f0, #94a3b8)',
  pro:    'linear-gradient(to right, #6366f1, #4f46e5)',
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
          {THEMES.map(theme => {
            const isActive = themeId === theme.id
            const previewColor = THEME_COLORS[theme.id] || THEME_COLORS.cyber
            return (
              <div
                key={theme.id}
                onClick={() => { setTheme(theme.id); onClose() }}
                style={{
                  background: isActive ? 'rgba(6,182,212,0.1)' : '#111827',
                  border: `2px solid ${isActive ? '#06b6d4' : '#1e2d45'}`,
                  borderRadius: '12px', padding: '14px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {isActive && (
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
                <div style={{
                  marginTop: '10px', height: '4px', borderRadius: '99px',
                  background: previewColor,
                }}/>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}