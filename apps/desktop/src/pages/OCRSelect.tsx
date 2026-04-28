import { useEffect, useRef } from 'react'

export function OCRSelectPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    document.documentElement.focus()

    // Auto-fermeture après 15 secondes
    const timeout = setTimeout(() => {
      window.electron.ocr.closeSelection()
    }, 15000)

    return () => clearTimeout(timeout)
  }, [])

  function getCtx() {
    return canvasRef.current?.getContext('2d') ?? null
  }

  function redraw(x: number, y: number) {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx || !startPos.current) return

    const sx = startPos.current.x
    const sy = startPos.current.y
    const w = x - sx
    const h = y - sy

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.clearRect(sx, sy, w, h)
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 2
    ctx.strokeRect(sx, sy, w, h)

    ctx.fillStyle = '#06b6d4'
    ctx.font = 'bold 13px monospace'
    const label = `${Math.abs(Math.round(w))} × ${Math.abs(Math.round(h))}`
    ctx.fillText(label, sx + (w > 0 ? 4 : w + 4), sy + (h > 0 ? -6 : h - 6))
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    startPos.current = { x: e.clientX, y: e.clientY }
    isDrawing.current = true
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDrawing.current) return
    redraw(e.clientX, e.clientY)
  }

  async function handleMouseUp(e: React.MouseEvent) {
    if (!isDrawing.current || !startPos.current) return
    isDrawing.current = false

    const x = Math.min(e.clientX, startPos.current.x)
    const y = Math.min(e.clientY, startPos.current.y)
    const w = Math.abs(e.clientX - startPos.current.x)
    const h = Math.abs(e.clientY - startPos.current.y)

    if (w < 20 || h < 20) {
      await window.electron.ocr.closeSelection()
      return
    }

    const scale = window.devicePixelRatio || 1
    const screenLeft = window.screenX || 0
    const screenTop = window.screenY || 0

    const zone = {
      x: Math.round((x + screenLeft) * scale),
      y: Math.round((y + screenTop) * scale),
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    }

    console.log('[OCRSelect] Zone:', zone, 'screenLeft:', screenLeft, 'screenTop:', screenTop)
    await window.electron.ocr.zoneSelected(zone)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      window.electron.ocr.closeSelection()
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        cursor: 'crosshair',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as any}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <style>{`
        * { user-select: none !important; -webkit-user-select: none !important; }
        body { background: transparent !important; margin: 0; overflow: hidden; }
      `}</style>

      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}
      />

      <div style={{
        position: 'fixed', top: '20px', left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(6,182,212,0.95)',
        color: '#000', padding: '8px 24px',
        borderRadius: '99px', fontSize: '13px',
        fontFamily: 'Orbitron, sans-serif',
        pointerEvents: 'none',
        letterSpacing: '0.05em',
        fontWeight: 700,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        Clique et glisse pour sélectionner — ESC pour annuler
      </div>

      <button
        onClick={() => window.electron.ocr.closeSelection()}
        style={{
          position: 'fixed', bottom: '30px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.9)',
          color: '#fff', padding: '10px 24px',
          borderRadius: '99px', fontSize: '13px',
          fontFamily: 'Orbitron, sans-serif',
          border: 'none', cursor: 'pointer',
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        ✕ Annuler
      </button>
    </div>
  )
}