import { useEffect, useRef, useState } from 'react'

const REGIONS = [
  { code: 'EU', name: 'Europe', ms: 280, label: 'EXCELLENT', color: '#22c55e', width: 90 },
  { code: 'US', name: 'USA / Canada', ms: 320, label: 'EXCELLENT', color: '#22c55e', width: 85 },
  { code: 'BR', name: 'Brésil', ms: 380, label: 'BON', color: '#06b6d4', width: 75 },
  { code: 'KR', name: 'Corée du Sud', ms: 420, label: 'BON', color: '#06b6d4', width: 70 },
  { code: 'JP', name: 'Japon', ms: 440, label: 'BON', color: '#06b6d4', width: 65 },
  { code: 'SA', name: 'Moyen-Orient', ms: 520, label: 'CORRECT', color: '#f59e0b', width: 55 },
  { code: 'AU', name: 'Australie', ms: 560, label: 'CORRECT', color: '#f59e0b', width: 50 },
  { code: 'IN', name: 'Inde', ms: 490, label: 'CORRECT', color: '#f59e0b', width: 58 },
]

export function LatencyMap() {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#f59e0b', padding: '6px 16px',
          borderRadius: '99px', fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '0.12em',
        }}>⚡ LATENCE PAR RÉGION</span>
      </div>

      <h2 style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#fff', fontSize: '36px',
        textAlign: 'center', marginBottom: '12px',
      }}>Conçu pour le monde entier.</h2>

      <p style={{
        color: '#94a3b8', textAlign: 'center',
        fontSize: '14px', marginBottom: '48px',
      }}>
        Latences moyennes mesurées depuis nos serveurs edge.
        Résultats typiques en conditions gaming normales.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {REGIONS.map((r, i) => (
          <div key={r.code} style={{
            background: '#0d1424',
            border: '1px solid #1e2d45',
            borderRadius: '10px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#475569', fontSize: '13px',
              minWidth: '32px', fontWeight: 700,
            }}>{r.code}</div>

            <div style={{ flex: 1 }}>
              <div style={{
                color: '#fff', fontSize: '13px', marginBottom: '8px',
              }}>{r.name}</div>
              <div style={{
                height: '4px', background: '#1e2d45',
                borderRadius: '99px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: animated ? `${r.width}%` : '0%',
                  background: r.color, borderRadius: '99px',
                  transition: `width 1s ease ${i * 0.1}s`,
                }}/>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: r.color, fontSize: '14px',
                fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
              }}>~{r.ms}ms</div>
              <div style={{
                color: r.color, fontSize: '10px',
                letterSpacing: '0.08em', marginTop: '2px',
                fontFamily: 'Orbitron, sans-serif',
              }}>{r.label}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{
        color: '#475569', textAlign: 'center',
        fontSize: '11px', letterSpacing: '0.08em',
        fontFamily: 'Orbitron, sans-serif',
      }}>
        ⚡ MÊME À 600MS, LA TRADUCTION RESTE FLUIDE ET NATURELLE EN JEU
      </p>
    </div>
  )
}