import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { translateText } from '../lib/translation'
import { useAuthStore } from '../store/auth'
import { getAvailableLanguages } from '../lib/languages'
import Tesseract from 'tesseract.js'

interface OCRResult {
  id: number
  original: string
  translated: string
  timestamp: string
}

let resultCounter = 0

export function OCRPage() {
  const navigate = useNavigate()
  const { plan } = useAuthStore()
  const LANGUAGES = getAvailableLanguages(plan)

  const [isSelecting, setIsSelecting] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [zone, setZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [results, setResults] = useState<OCRResult[]>([])
  const [sourceLang, setSourceLang] = useState('ja')
  const [targetLang, setTargetLang] = useState('fr')
  const [status, setStatus] = useState('Prêt')
  const [isInitialized, setIsInitialized] = useState(false)

  const startPos = useRef<{ x: number; y: number } | null>(null)
  const selectionRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const lastTextRef = useRef('')
  const isProcessingRef = useRef(false)
  const sourceLangRef = useRef(sourceLang)
  const targetLangRef = useRef(targetLang)

  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])

  useEffect(() => {
    setStatus('Prêt — sélectionne une zone')
    setIsInitialized(true)

    window.electron.ocr.onImage(async (buffer: any) => {
      console.log('[OCR] Image reçue !', buffer?.length)
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      try {
        setStatus('⟳ Lecture...')
        const uint8 = new Uint8Array(buffer)
        const blob = new Blob([uint8], { type: 'image/png' })
        const url = URL.createObjectURL(blob)
        const { data: { text } } = await (Tesseract as any).recognize(url, 'eng+fra+jpn+kor+rus+spa+deu', { logger: () => {} })
        URL.revokeObjectURL(url)
        const clean = text.trim().replace(/\s+/g, ' ')
        console.log('[OCR] Texte détecté:', clean)
        if (!clean || clean.length < 3 || clean === lastTextRef.current) {
          setStatus('● Capture active')
          return
        }
        lastTextRef.current = clean
        setStatus('⟳ Traduction...')
        const translated = await translateText(clean, sourceLangRef.current, targetLangRef.current)
        setResults(prev => [...prev, {
          id: ++resultCounter,
          original: clean,
          translated,
          timestamp: new Date().toLocaleTimeString(),
        }])
        setStatus('● Capture active')
      } catch (err) {
        console.error('[OCR] Erreur:', err)
        setStatus('● Capture active')
      } finally {
        isProcessingRef.current = false
      }
    })

    return () => window.electron.ocr.removeListeners()
  }, [])

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight
    }
  }, [results])

  function startSelection() {
    setIsSelecting(true)
    setStatus('Clique et glisse pour sélectionner une zone')
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!isSelecting) return
    startPos.current = { x: e.clientX, y: e.clientY }
    if (selectionRef.current) {
      selectionRef.current.style.left = `${e.clientX}px`
      selectionRef.current.style.top = `${e.clientY}px`
      selectionRef.current.style.width = '0px'
      selectionRef.current.style.height = '0px'
      selectionRef.current.style.display = 'block'
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isSelecting || !startPos.current || !selectionRef.current) return
    const x = Math.min(e.clientX, startPos.current.x)
    const y = Math.min(e.clientY, startPos.current.y)
    const w = Math.abs(e.clientX - startPos.current.x)
    const h = Math.abs(e.clientY - startPos.current.y)
    selectionRef.current.style.left = `${x}px`
    selectionRef.current.style.top = `${y}px`
    selectionRef.current.style.width = `${w}px`
    selectionRef.current.style.height = `${h}px`
  }

  async function handleMouseUp(e: React.MouseEvent) {
    if (!isSelecting || !startPos.current) return

    const x = Math.min(e.clientX, startPos.current.x)
    const y = Math.min(e.clientY, startPos.current.y)
    const w = Math.abs(e.clientX - startPos.current.x)
    const h = Math.abs(e.clientY - startPos.current.y)

    if (selectionRef.current) selectionRef.current.style.display = 'none'

    if (w < 20 || h < 20) {
      setIsSelecting(false)
      setStatus('Zone trop petite — réessaie')
      return
    }

    const scale = window.devicePixelRatio || 1
    const newZone = {
      x: Math.round(x * scale),
      y: Math.round(y * scale),
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    }

    setZone(newZone)
    setIsSelecting(false)
    startPos.current = null
    await startCapture(newZone)
  }

  async function startCapture(z: typeof zone) {
    if (!z) return
    setIsCapturing(true)
    setStatus('● Capture active')
    await window.electron.ocr.start(z)
  }

  async function stopCapture() {
    await window.electron.ocr.stop()
    setIsCapturing(false)
    setZone(null)
    lastTextRef.current = ''
    setStatus('Prêt — sélectionne une zone')
  }

  return (
    <div
      style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', padding: '0 24px 24px',
        maxWidth: '800px', margin: '0 auto',
        cursor: isSelecting ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div ref={selectionRef} style={{
        position: 'fixed', display: 'none',
        border: '2px solid #06b6d4',
        background: 'rgba(6,182,212,0.1)',
        pointerEvents: 'none', zIndex: 999,
      }}/>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1e2d45', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#06b6d4', fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>GG TRANSLATE</div>
          <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.15em', marginTop: '2px' }}>CAPTURE OCR</div>
        </div>
        <button onClick={() => navigate('/translate')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>← Traducteur</button>
      </div>

      {/* LANGUES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>LANGUE SOURCE</div>
          <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <div style={{ marginTop: '24px', color: '#475569', fontSize: '18px' }}>→</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>LANGUE CIBLE</div>
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ width: '100%', background: '#0d1424', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
      </div>

      {/* CONTRÔLES */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em' }}>📷 ZONE DE CAPTURE</div>
          <div style={{ color: isCapturing ? '#22c55e' : '#475569', fontSize: '11px', fontFamily: 'Orbitron, sans-serif' }}>{status}</div>
        </div>

        {zone && (
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '11px', color: '#06b6d4' }}>
            Zone: {zone.x}x{zone.y} — {zone.width}×{zone.height}px
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isCapturing ? (
            <button onClick={startSelection} disabled={!isInitialized || isSelecting} style={{
              flex: 1,
              background: isSelecting ? 'rgba(6,182,212,0.2)' : 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none', color: '#fff', padding: '12px', borderRadius: '8px',
              cursor: isInitialized && !isSelecting ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
              opacity: isInitialized ? 1 : 0.5,
            }}>
              {isSelecting ? '⊹ Sélectionne une zone...' : '⊹ Sélectionner une zone'}
            </button>
          ) : (
            <button onClick={stopCapture} style={{
              flex: 1,
              background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
              color: '#ef4444', padding: '12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
            }}>⏹ Arrêter la capture</button>
          )}
          <button onClick={() => setResults([])} style={{
            background: 'transparent', border: '1px solid #1e2d45',
            color: '#475569', padding: '12px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '12px',
          }}>🗑️</button>
        </div>

        {isSelecting && (
          <div style={{ marginTop: '12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', padding: '10px', color: '#06b6d4', fontSize: '12px', textAlign: 'center' }}>
            Clique et glisse sur la zone à traduire — ex: le chat du jeu, les menus, les sous-titres
          </div>
        )}
      </div>

      {/* RÉSULTATS */}
      <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em', marginBottom: '14px' }}>
          📝 TEXTES TRADUITS
        </div>
        <div ref={resultsRef} style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '40px' }}>
              Les textes détectés et traduits apparaîtront ici
            </div>
          ) : (
            results.map(r => (
              <div key={r.id} style={{ background: '#111827', borderRadius: '8px', padding: '12px 14px', border: '1px solid #1e2d45' }}>
                <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>🔍 {r.original}</div>
                <div style={{ color: '#06b6d4', fontSize: '14px', marginBottom: '4px' }}>→ {r.translated}</div>
                <div style={{ color: '#334155', fontSize: '10px' }}>{r.timestamp}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}