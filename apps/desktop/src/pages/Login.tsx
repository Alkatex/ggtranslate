import { useState } from 'react'
import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore()

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#0d1424',
        border: '1px solid #1e2d45',
        borderRadius: '20px',
        padding: '40px',
      }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '28px',
            fontWeight: 700, letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '13px' }}>
            Traduction vocale gaming en temps réel
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex', gap: '4px',
          background: '#111827', borderRadius: '10px',
          padding: '4px', marginBottom: '24px',
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '10px',
                borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '13px',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.05em',
                background: mode === m
                  ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
                  : 'transparent',
                color: mode === m ? '#fff' : '#475569',
                transition: 'all 0.2s',
              }}>
              {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
            </button>
          ))}
        </div>

        {/* GOOGLE */}
        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent',
            border: '1px solid #1e2d45',
            borderRadius: '10px', cursor: 'pointer',
            color: '#fff', fontSize: '14px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            marginBottom: '20px',
            transition: 'border-color 0.2s',
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#1e2d45' }} />
          <span style={{ color: '#475569', fontSize: '12px' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: '#1e2d45' }} />
        </div>

        {/* EMAIL */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#111827',
              border: '1px solid #1e2d45',
              borderRadius: '10px', color: '#fff',
              fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* PASSWORD */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '12px 16px',
              background: '#111827',
              border: '1px solid #1e2d45',
              borderRadius: '10px', color: '#fff',
              fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            color: '#ef4444', fontSize: '13px',
            marginBottom: '16px', textAlign: 'center',
          }}>{error}</div>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading
              ? '#1e2d45'
              : 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}>
          {loading
            ? '⟳ CHARGEMENT...'
            : mode === 'login' ? 'SE CONNECTER' : 'CRÉER UN COMPTE'}
        </button>

        {/* TRIAL */}
        {mode === 'signup' && (
          <div style={{
            marginTop: '16px', textAlign: 'center',
            color: '#475569', fontSize: '12px',
          }}>
            ✨ 15 minutes Pro offertes — sans carte de crédit
          </div>
        )}
      </div>
    </div>
  )
}