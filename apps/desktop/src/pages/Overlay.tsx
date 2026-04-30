import { useState, useEffect, useRef } from 'react'

interface Translation {
  original: string
  translated: string
  timestamp: string
  type: 'my' | 'other'
}

export function OverlayPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right')
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    window.electron.overlay?.onTranslation((data: Translation) => {
      setTranslations(prev => {
        const updated = [...prev, data]
        return updated.slice(-5)
      })

      const t = setTimeout(() => {
        setTranslations(prev => prev.slice(1))
      }, 6000)
      timeoutsRef.current.push(t)
    })

    return () => {
      window.electron.overlay?.removeListeners()
      timeoutsRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // ─── Auto-position selon le coin ─────────────────────────────────────────
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right':    { top: 8, right: 8, bottom: 'auto', left: 'auto' },
    'top-left':     { top: 8, left: 8, bottom: 'auto', right: 'auto' },
    'bottom-right': { bottom: 8, right: 8, top: 'auto', left: 'auto' },
    'bottom-left':  { bottom: 8, left: 8, top: 'auto', right: 'auto' },
  }

  const corners: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'> = [
    'top-right', 'top-left', 'bottom-right', 'bottom-left'
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'transparent',
      userSelect: 'none',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent !important; }
        @keyframes slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        width: '300px',
        ...positionStyles[position],
      }}>
        {/* HANDLE DRAG + CONTRÔLES */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          style={{
            background: 'rgba(6,182,212,0.15)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '8px 8px 0 0',
            padding: '4px 8px',
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

          <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' } as any}>
            {/* Boutons changement de coin */}
            {corners.map(corner => (
              <button
                key={corner}
                onClick={() => setPosition(corner)}
                title={corner}
                style={{
                  background: position === corner ? 'rgba(6,182,212,0.3)' : 'transparent',
                  border: `1px solid ${position === corner ? '#06b6d4' : 'rgba(6,182,212,0.2)'}`,
                  color: '#06b6d4', cursor: 'pointer',
                  width: '14px', height: '14px',
                  borderRadius: '3px', fontSize: '7px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0,
                }}
              >
                {corner === 'top-left' ? '↖' :
                 corner === 'top-right' ? '↗' :
                 corner === 'bottom-left' ? '↙' : '↘'}
              </button>
            ))}
            <button
              onClick={() => window.electron.overlay?.close()}
              style={{
                background: 'transparent', border: 'none',
                color: '#475569', cursor: 'pointer', fontSize: '12px',
                WebkitAppRegion: 'no-drag',
              } as any}
            >✕</button>
          </div>
        </div>

        {/* TRADUCTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                border: `1px solid ${t.type === 'my'
                  ? 'rgba(6,182,212,0.4)'
                  : 'rgba(168,85,247,0.4)'}`,
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
    </div>
  )
}