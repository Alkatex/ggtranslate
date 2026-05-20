import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const FLAGS = [
  { code: 'fr', url: 'https://flagcdn.com/48x36/fr.png' },
  { code: 'gb', url: 'https://flagcdn.com/48x36/gb.png' },
  { code: 'es', url: 'https://flagcdn.com/48x36/es.png' },
  { code: 'de', url: 'https://flagcdn.com/48x36/de.png' },
  { code: 'kr', url: 'https://flagcdn.com/48x36/kr.png' },
  { code: 'jp', url: 'https://flagcdn.com/48x36/jp.png' },
  { code: 'br', url: 'https://flagcdn.com/48x36/br.png' },
  { code: 'it', url: 'https://flagcdn.com/48x36/it.png' },
  { code: 'ru', url: 'https://flagcdn.com/48x36/ru.png' },
  { code: 'cn', url: 'https://flagcdn.com/48x36/cn.png' },
  { code: 'sa', url: 'https://flagcdn.com/48x36/sa.png' },
  { code: 'pl', url: 'https://flagcdn.com/48x36/pl.png' },
  { code: 'us', url: 'https://flagcdn.com/48x36/us.png' },
  { code: 'nl', url: 'https://flagcdn.com/48x36/nl.png' },
  { code: 'se', url: 'https://flagcdn.com/48x36/se.png' },
  { code: 'tr', url: 'https://flagcdn.com/48x36/tr.png' },
]

const COLORS = [
  'rgba(6,182,212,0.7)',
  'rgba(168,85,247,0.7)',
  'rgba(59,130,246,0.7)',
  'rgba(34,197,94,0.7)',
  'rgba(249,115,22,0.7)',
  'rgba(236,72,153,0.7)',
]

interface FallingFlag {
  id: number
  flagIndex: number
  x: number
  delay: number
  duration: number
  size: number
  color: string
}

export function SplashPage() {
  const navigate = useNavigate()
  const [flags, setFlags] = useState<FallingFlag[]>([])
  const [fillLevel, setFillLevel] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const generated: FallingFlag[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      flagIndex: i % FLAGS.length,
      x: 2 + (i * 5.5) % 96,
      delay: i * 80,
      duration: 1200 + (i * 137) % 1200,
      size: 24 + (i * 11) % 20,
      color: COLORS[i % COLORS.length],
    }))
    setFlags(generated)

    let level = 0
    const fillInterval = setInterval(() => {
      level += 1
      setFillLevel(level)
      if (level >= 100) {
        clearInterval(fillInterval)
        setTimeout(() => {
          setDone(true)
          setTimeout(() => {
            // Lit la valeur courante du store — évite le stale closure
            if (useAuthStore.getState().isAuthenticated) {
              navigate('/translate')
            } else {
              navigate('/onboarding')
            }
          }, 400)
        }, 300)
      }
    }, 50)

    return () => clearInterval(fillInterval)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#06080f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: done ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-80px) rotate(-10deg) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(200px) rotate(10deg) scale(1.1); opacity: 0.9; }
          90% { opacity: 0.6; }
          100% { transform: translateY(480px) rotate(20deg) scale(0.9); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(6,182,212,0.4)); }
          50% { filter: drop-shadow(0 0 24px rgba(6,182,212,0.9)); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes color-cycle {
          0% { color: #06b6d4; }
          33% { color: #a855f7; }
          66% { color: #3b82f6; }
          100% { color: #06b6d4; }
        }
      `}</style>

      {/* Drapeaux qui tombent */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        {flags.map(f => (
          <div key={f.id} style={{
            position: 'absolute',
            left: `${f.x}%`,
            top: '-80px',
            animation: `fall ${f.duration}ms ease-in ${f.delay}ms infinite`,
            filter: `drop-shadow(0 0 6px ${f.color})`,
          }}>
            <img
              src={FLAGS[f.flagIndex].url}
              width={f.size}
              height={Math.floor(f.size * 0.75)}
              style={{ borderRadius: '3px', display: 'block' }}
              alt={FLAGS[f.flagIndex].code}
            />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '30px',
        fontWeight: 700, letterSpacing: '0.2em',
        marginBottom: '40px',
        animation: 'color-cycle 3s ease infinite, fade-in 0.6s ease',
      }}>GG TRANSLATE</div>

      {/* Manette SVG avec remplissage */}
      <div style={{
        position: 'relative', width: '200px', height: '200px',
        animation: 'pulse-glow 2s ease infinite',
        marginBottom: '32px',
      }}>
        <svg viewBox="0 0 200 200" width="200" height="200">
          <defs>
            <clipPath id="controller-clip">
              <path d="M30 70 C30 50 50 40 70 40 L90 40 L95 30 L105 30 L110 40 L130 40 C150 40 170 50 170 70 L175 110 C178 130 165 150 145 155 L130 158 C120 165 110 170 100 170 C90 170 80 165 70 158 L55 155 C35 150 22 130 25 110 Z"/>
            </clipPath>
          </defs>

          {/* Fond manette */}
          <path
            d="M30 70 C30 50 50 40 70 40 L90 40 L95 30 L105 30 L110 40 L130 40 C150 40 170 50 170 70 L175 110 C178 130 165 150 145 155 L130 158 C120 165 110 170 100 170 C90 170 80 165 70 158 L55 155 C35 150 22 130 25 110 Z"
            fill="#0d1424"
            stroke="#1e2d45"
            strokeWidth="2"
          />

          {/* Remplissage */}
          <rect
            x="0"
            y={`${170 - fillLevel * 1.7}`}
            width="200"
            height={`${fillLevel * 1.7}`}
            fill="rgba(6,182,212,0.25)"
            clipPath="url(#controller-clip)"
          />

          {/* Vague */}
          <rect
            x="0"
            y={`${170 - fillLevel * 1.7 - 2}`}
            width="200"
            height="3"
            fill="#06b6d4"
            clipPath="url(#controller-clip)"
            opacity="0.9"
          />

          {/* Contour manette */}
          <path
            d="M30 70 C30 50 50 40 70 40 L90 40 L95 30 L105 30 L110 40 L130 40 C150 40 170 50 170 70 L175 110 C178 130 165 150 145 155 L130 158 C120 165 110 170 100 170 C90 170 80 165 70 158 L55 155 C35 150 22 130 25 110 Z"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Croix directionnelle */}
          <rect x="55" y="78" width="24" height="8" rx="2" fill="#1e2d45"/>
          <rect x="63" y="70" width="8" height="24" rx="2" fill="#1e2d45"/>

          {/* Boutons */}
          <circle cx="135" cy="82" r="5" fill="#1e2d45"/>
          <circle cx="148" cy="75" r="5" fill="#1e2d45"/>
          <circle cx="148" cy="89" r="5" fill="#1e2d45"/>
          <circle cx="161" cy="82" r="5" fill="#1e2d45"/>

          {/* Boutons centraux */}
          <rect x="88" y="73" width="10" height="7" rx="3" fill="#1e2d45"/>
          <rect x="102" y="73" width="10" height="7" rx="3" fill="#1e2d45"/>

          {/* Joysticks */}
          <circle cx="75" cy="118" r="12" fill="#1e2d45" stroke="#334155" strokeWidth="1"/>
          <circle cx="125" cy="118" r="12" fill="#1e2d45" stroke="#334155" strokeWidth="1"/>
        </svg>

        {/* Pourcentage */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Orbitron, sans-serif',
          color: '#06b6d4', fontSize: '18px', fontWeight: 700,
          textShadow: '0 0 10px rgba(6,182,212,0.8)',
        }}>{fillLevel}%</div>
      </div>

      {/* Texte chargement */}
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        color: '#475569', fontSize: '11px',
        letterSpacing: '0.2em',
        animation: 'fade-in 1s ease 0.3s both',
      }}>
        {fillLevel < 25 ? 'INITIALISATION...'
          : fillLevel < 50 ? 'CHARGEMENT DES LANGUES...'
          : fillLevel < 75 ? 'CONNEXION AUX SERVEURS...'
          : fillLevel < 95 ? 'CONFIGURATION AUDIO...'
          : '🎮 PRÊT À JOUER !'}
      </div>
    </div>
  )
}