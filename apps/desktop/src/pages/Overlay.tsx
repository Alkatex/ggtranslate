import { useState, useEffect } from 'react'

interface Translation {
  original: string
  translated: string
  timestamp: string
  type: 'my' | 'other'
}

export function OverlayPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // Écouter les traductions depuis main.ts
    window.electron.overlay?.onTranslation((data: Translation) => {
      setTranslations(prev => {
        const updated = [...prev, data]
        // Garder seulement les 5 dernières
        return updated.slice(-5)
      })
      // Auto-effacer après 5 secondes
      setTimeout(() => {
        setTranslations(prev => prev.slice(1))
      }, 5000)
    })

    return () => window.electron.overlay?.removeListeners()
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'transparent',
        padding: '8px',
        userSelect: 'none',
        WebkitAppRegion: isDragging ? 'drag' : 'no-drag',
      } as any}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent !important; }
        @keyframes slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* HANDLE DRAG */}
      <div
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        style={{
          background: 'rgba(6,182,212,0.15)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: '8px 8px 0 0',
          padding: '4px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'grab', marginBottom: '4px',
          WebkitAppRegion: 'drag',
        } as any}
      >
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#06b6d4', fontSize: '9px',
          letterSpacing: '0.1em',
        }}>GG TRANSLATE</span>
        <button
          onClick={() => window.electron.overlay?.close()}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: '12px',
            WebkitAppRegion: 'no-drag',
          } as any}
        >✕</button>
      </div>

      {/* TRADUCTIONS */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {translations.length === 0 ? (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '8px', padding: '8px 12px',
            color: '#475569', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            textAlign: 'center',
          }}>
            En attente de traductions...
          </div>
        ) : (
          translations.map((t, i) => (
            <div key={i} style={{
              background: t.type === 'my'
                ? 'rgba(6,182,212,0.15)'
                : 'rgba(168,85,247,0.15)',
              border: `1px solid ${t.type === 'my' ? 'rgba(6,182,212,0.4)' : 'rgba(168,85,247,0.4)'}`,
              borderRadius: '8px', padding: '6px 10px',
              animation: 'slide-in 0.2s ease',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{
                color: t.type === 'my' ? '#06b6d4' : '#a855f7',
                fontSize: '12px', marginBottom: '2px',
              }}>{t.translated}</div>
              <div style={{ color: '#475569', fontSize: '10px' }}>
                {t.type === 'my' ? '🎤' : '🖥️'} {t.original}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}