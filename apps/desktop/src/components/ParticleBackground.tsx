import { useEffect, useRef } from 'react'

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    const particles: Array<{
      x: number; y: number; size: number
      opacity: number; speed: number; offset: number
    }> = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      const count = Math.floor((canvas.width * canvas.height) / 8000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.1,
          speed: Math.random() * 0.3 + 0.05,
          offset: Math.random() * Math.PI * 2,
        })
      }
    }

    let t = 0
    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#06080f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const gTeal = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.9, 0,
        canvas.width * 0.8, canvas.height * 0.9, canvas.width * 0.5
      )
      gTeal.addColorStop(0, 'rgba(6,182,212,0.07)')
      gTeal.addColorStop(1, 'transparent')
      ctx.fillStyle = gTeal
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const gBlue = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.95, 0,
        canvas.width * 0.2, canvas.height * 0.95, canvas.width * 0.4
      )
      gBlue.addColorStop(0, 'rgba(59,130,246,0.05)')
      gBlue.addColorStop(1, 'transparent')
      ctx.fillStyle = gBlue
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        const twinkle = Math.sin(t * p.speed * 10 + p.offset) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${p.opacity * twinkle})`
        ctx.fill()
        p.y -= p.speed * 0.1
        if (p.y < -2) p.y = canvas.height + 2
      }

      animFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}