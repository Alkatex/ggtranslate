import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import tokens from '../styles/tokens'

interface Translation {
  id: number
  original: string
  translated: string
  timestamp: string
  type: 'my' | 'other'
}

let translationCounter = 0

export function OverlayPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [position, setPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right')
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    window.electron.overlay?.onTranslation((data: Omit<Translation, 'id'>) => {
      const id = ++translationCounter
      setTranslations(prev => {
        const updated = [...prev, { ...data, id }]
        return updated.slice(-5)
      })
      const t = setTimeout(() => {
        setTranslations(prev => prev.filter(tr => tr.id !== id))
      }, 6000)
      timeoutsRef.current.push(t)
    })
    return () => {
      window.electron.overlay?.removeListeners()
      timeoutsRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right':    { top: 8, right: 8, bottom: 'auto', left: 'auto' },
    'top-left':     { top: 8, left: 8, bottom: 'auto', right: 'auto' },
    'bottom-right': { bottom: 8, right: 8, top: 'auto', left: 'auto' },
    'bottom-left':  { bottom: 8, left: 8, top: 'auto', right: 'auto' },
  }

  const corners: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'> = [
    'top-right', 'top-left', 'bottom-right', 'bottom-left',
  ]

  const isRight = position.includes('right')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent', userSelect: 'none' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { background: transparent !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ position: 'fixed', width: '300px', ...positionStyles[position] }}>

        {/* ─── HANDLE ──────────────────────────────────────────────────────── */}
        <div
          style={{
            // ─── FIX: Fond semi-transparent — visible mais laisse voir à travers
            background: 'rgba(6,10,22,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(6,182,212,0.35)',
            borderRadius: '10px 10px 0 0',
            padding: '5px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'grab',
            marginBottom: '3px',
            WebkitAppRegion: 'drag',
          } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', background: tokens.colors.cyan, borderRadius: '50%', boxShadow: `0 0 6px ${tokens.colors.cyan}` }} />
            <span style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '9px', letterSpacing: tokens.letterSpacing.wide }}>
              GG TRANSLATE
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px', WebkitAppRegion: 'no-drag' } as any}>
            {corners.map(corner => (
              <button
                key={corner}
                onClick={() => setPosition(corner)}
                title={corner}
                style={{
                  background: position === corner ? 'rgba(6,182,212,0.25)' : 'transparent',
                  border: `1px solid ${position === corner ? tokens.colors.cyan : 'rgba(6,182,212,0.25)'}`,
                  color: tokens.colors.cyan, cursor: 'pointer',
                  width: '16px', height: '16px', borderRadius: '3px', fontSize: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  transition: tokens.transitions.fast,
                }}
              >
                {corner === 'top-left' ? '↖' : corner === 'top-right' ? '↗' : corner === 'bottom-left' ? '↙' : '↘'}
              </button>
            ))}
            <button
              onClick={() => window.electron.overlay?.close()}
              style={{
                background: 'transparent', border: 'none',
                color: tokens.colors.dim, cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '16px', height: '16px', transition: tokens.transitions.fast,
                WebkitAppRegion: 'no-drag',
              } as any}
              onMouseEnter={e => e.currentTarget.style.color = tokens.colors.red}
              onMouseLeave={e => e.currentTarget.style.color = tokens.colors.dim}
            >✕</button>
          </div>
        </div>

        {/* ─── TRADUCTIONS ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <AnimatePresence mode="popLayout">
            {translations.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  // ─── FIX: Fond semi-transparent lisible
                  background: 'rgba(6,10,22,0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', padding: '8px 12px',
                  color: tokens.colors.dim, fontSize: '11px',
                  fontFamily: tokens.fonts.display, textAlign: 'center',
                  letterSpacing: tokens.letterSpacing.tight,
                } as any}
              >
                En attente de traductions...
              </motion.div>
            ) : (
              translations.map(tr => (
                <motion.div
                  key={tr.id}
                  initial={{ opacity: 0, x: isRight ? 20 : -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isRight ? 20 : -20, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
                  style={{
                    // ─── FIX: Semi-transparent avec teinte couleur — lisible par-dessus jeu
                    background: tr.type === 'my'
                      ? 'rgba(6,10,22,0.72)'
                      : 'rgba(6,10,22,0.72)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1px solid ${tr.type === 'my'
                      ? 'rgba(6,182,212,0.5)'
                      : 'rgba(168,85,247,0.5)'}`,
                    borderRadius: '8px',
                    padding: '7px 10px',
                    borderLeft: `3px solid ${tr.type === 'my' ? tokens.colors.cyan : tokens.colors.purple}`,
                  } as any}
                >
                  <div style={{
                    color: tr.type === 'my' ? tokens.colors.cyan : tokens.colors.purple,
                    fontSize: '13px', fontWeight: tokens.fontWeights.medium,
                    marginBottom: '3px', lineHeight: 1.4,
                  }}>
                    {tr.translated}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: tokens.colors.muted, fontSize: '10px' }}>
                    <span style={{ fontSize: '9px' }}>{tr.type === 'my' ? '🎤' : '🖥️'}</span>
                    <span style={{ opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      {tr.original}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '9px', flexShrink: 0, color: tokens.colors.dim }}>
                      {tr.timestamp}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}