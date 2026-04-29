import { useEffect, useRef } from 'react'
import { useThemeStore } from '../store/theme'

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { getTheme } = useThemeStore()
  const theme = getTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number

    // ─── CYBER (cyan/bleu) ────────────────────────────────────────────────────
    if (theme.bgStyle === 'cyber') {
      const particles: Array<{ x: number; y: number; size: number; opacity: number; speed: number; offset: number }> = []

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

        const g1 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.9, 0, canvas.width * 0.8, canvas.height * 0.9, canvas.width * 0.5)
        g1.addColorStop(0, 'rgba(6,182,212,0.08)')
        g1.addColorStop(1, 'transparent')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const g2 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.1, 0, canvas.width * 0.2, canvas.height * 0.1, canvas.width * 0.4)
        g2.addColorStop(0, 'rgba(59,130,246,0.06)')
        g2.addColorStop(1, 'transparent')
        ctx.fillStyle = g2
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
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── BLOOD (rouge intense) ────────────────────────────────────────────────
    if (theme.bgStyle === 'blood') {
      const particles: Array<{ x: number; y: number; size: number; opacity: number; speed: number; offset: number }> = []

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
        ctx.fillStyle = '#0a0000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const g1 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.9, 0, canvas.width * 0.8, canvas.height * 0.9, canvas.width * 0.6)
        g1.addColorStop(0, 'rgba(220,38,38,0.12)')
        g1.addColorStop(1, 'transparent')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const g2 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.1, 0, canvas.width * 0.2, canvas.height * 0.1, canvas.width * 0.4)
        g2.addColorStop(0, 'rgba(153,27,27,0.08)')
        g2.addColorStop(1, 'transparent')
        ctx.fillStyle = g2
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (const p of particles) {
          const twinkle = Math.sin(t * p.speed * 10 + p.offset) * 0.3 + 0.7
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(239,68,68,${p.opacity * twinkle})`
          ctx.fill()
          p.y -= p.speed * 0.1
          if (p.y < -2) p.y = canvas.height + 2
        }

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── SUNSET (orange/rose) ─────────────────────────────────────────────────
    if (theme.bgStyle === 'sunset') {
      const particles: Array<{ x: number; y: number; size: number; opacity: number; speed: number; offset: number }> = []

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
            opacity: Math.random() * 0.5 + 0.1,
            speed: Math.random() * 0.3 + 0.05,
            offset: Math.random() * Math.PI * 2,
          })
        }
      }

      let t = 0
      const draw = () => {
        t += 0.008
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#0c0805'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const g1 = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.8, 0, canvas.width * 0.7, canvas.height * 0.8, canvas.width * 0.6)
        g1.addColorStop(0, 'rgba(249,115,22,0.1)')
        g1.addColorStop(1, 'transparent')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const g2 = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.2, 0, canvas.width * 0.3, canvas.height * 0.2, canvas.width * 0.4)
        g2.addColorStop(0, 'rgba(236,72,153,0.07)')
        g2.addColorStop(1, 'transparent')
        ctx.fillStyle = g2
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (const p of particles) {
          const twinkle = Math.sin(t * p.speed * 10 + p.offset) * 0.3 + 0.7
          const colors = ['249,115,22', '236,72,153', '251,146,60']
          const color = colors[Math.floor(p.offset) % colors.length]
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${color},${p.opacity * twinkle})`
          ctx.fill()
          p.y -= p.speed * 0.1
          if (p.y < -2) p.y = canvas.height + 2
        }

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── MATRIX (vert) ────────────────────────────────────────────────────────
    if (theme.bgStyle === 'matrix') {
      const fontSize = 13
      let cols: number[] = []

      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        cols = Array(Math.floor(canvas.width / fontSize)).fill(1)
      }

      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF'
      const draw = () => {
        ctx.fillStyle = 'rgba(0,5,0,0.05)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(34,197,94,0.75)'
        ctx.font = `${fontSize}px monospace`

        for (let i = 0; i < cols.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)]
          ctx.fillText(char, i * fontSize, cols[i] * fontSize)
          if (cols[i] * fontSize > canvas.height && Math.random() > 0.975) cols[i] = 0
          cols[i]++
        }
        animFrame = requestAnimationFrame(draw)
      }

      resize()
      ctx.fillStyle = '#000500'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── AURORA (violet/bleu) ─────────────────────────────────────────────────
    if (theme.bgStyle === 'aurora') {
      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      let t = 0
      const draw = () => {
        t += 0.005
        ctx.fillStyle = '#06040f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const colors = [
          'rgba(139,92,246,',
          'rgba(99,102,241,',
          'rgba(168,85,247,',
          'rgba(79,70,229,',
        ]

        for (let i = 0; i < 5; i++) {
          const x = canvas.width * (0.15 + i * 0.18 + Math.sin(t + i * 1.3) * 0.12)
          const y = canvas.height * (0.3 + Math.sin(t * 0.6 + i * 1.1) * 0.25)
          const r = canvas.width * (0.28 + Math.sin(t * 0.8 + i * 0.5) * 0.08)
          const g = ctx.createRadialGradient(x, y, 0, x, y, r)
          g.addColorStop(0, `${colors[i % colors.length]}0.14)`)
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── GRID / PRO (indigo) ──────────────────────────────────────────────────
    if (theme.bgStyle === 'grid') {
      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      let t = 0
      const draw = () => {
        t += 0.003
        ctx.fillStyle = '#05050f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const gridSize = 40
        ctx.strokeStyle = 'rgba(99,102,241,0.1)'
        ctx.lineWidth = 1

        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
        }

        for (let x = 0; x < canvas.width; x += gridSize) {
          for (let y = 0; y < canvas.height; y += gridSize) {
            const pulse = Math.sin(t * 2 + x * 0.01 + y * 0.01) * 0.5 + 0.5
            if (pulse > 0.85) {
              ctx.beginPath()
              ctx.arc(x, y, 2, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(99,102,241,${pulse * 0.7})`
              ctx.fill()
            }
          }
        }

        const g = ctx.createRadialGradient(canvas.width * 0.5, canvas.height, 0, canvas.width * 0.5, canvas.height, canvas.width * 0.7)
        g.addColorStop(0, 'rgba(99,102,241,0.06)')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── MINIMAL / CLEAN (blurple Discord) ───────────────────────────────────
    if (theme.bgStyle === 'minimal') {
      const particles: Array<{ x: number; y: number; size: number; opacity: number; speed: number; offset: number }> = []

      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        particles.length = 0
        const count = Math.floor((canvas.width * canvas.height) / 15000)
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.2 + 0.3,
            opacity: Math.random() * 0.25 + 0.05,
            speed: Math.random() * 0.2 + 0.03,
            offset: Math.random() * Math.PI * 2,
          })
        }
      }

      let t = 0
      const draw = () => {
        t += 0.006
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
        bg.addColorStop(0, '#1e1f22')
        bg.addColorStop(1, '#111214')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const glow1 = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.4, 0, canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.5)
        glow1.addColorStop(0, 'rgba(88,101,242,0.07)')
        glow1.addColorStop(1, 'transparent')
        ctx.fillStyle = glow1
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const glow2 = ctx.createRadialGradient(canvas.width * 0.75, canvas.height * 0.7, 0, canvas.width * 0.75, canvas.height * 0.7, canvas.width * 0.4)
        glow2.addColorStop(0, 'rgba(88,101,242,0.05)')
        glow2.addColorStop(1, 'transparent')
        ctx.fillStyle = glow2
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (const p of particles) {
          const twinkle = Math.sin(t * p.speed * 8 + p.offset) * 0.3 + 0.7
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(88,101,242,${p.opacity * twinkle})`
          ctx.fill()
          p.y -= p.speed * 0.08
          if (p.y < -2) p.y = canvas.height + 2
        }

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }

    // ─── GHOST (blanc sur noir) ───────────────────────────────────────────────
    if (theme.bgStyle === 'ghost') {
      const particles: Array<{ x: number; y: number; size: number; opacity: number; speed: number; offset: number }> = []

      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        particles.length = 0
        const count = Math.floor((canvas.width * canvas.height) / 10000)
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1 + 0.3,
            opacity: Math.random() * 0.4 + 0.05,
            speed: Math.random() * 0.2 + 0.03,
            offset: Math.random() * Math.PI * 2,
          })
        }
      }

      let t = 0
      const draw = () => {
        t += 0.006
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (const p of particles) {
          const twinkle = Math.sin(t * p.speed * 10 + p.offset) * 0.3 + 0.7
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${p.opacity * twinkle})`
          ctx.fill()
          p.y -= p.speed * 0.08
          if (p.y < -2) p.y = canvas.height + 2
        }

        animFrame = requestAnimationFrame(draw)
      }

      resize()
      draw()
      window.addEventListener('resize', resize)
      return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize) }
    }
  }, [theme.id])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  )
}