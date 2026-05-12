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

  const [isCapturing, setIsCapturing] = useState(false)
  const [results, setResults] = useState<OCRResult[]>([])
  const [sourceLang, setSourceLang] = useState('ja')
  const [targetLang, setTargetLang] = useState('fr')
  const [status, setStatus] = useState('Prêt — sélectionne une zone')

  const resultsRef = useRef<HTMLDivElement>(null)
  const lastTextRef = useRef('')
  const isProcessingRef = useRef(false)
  const sourceLangRef = useRef(sourceLang)
  const targetLangRef = useRef(targetLang)
  const ocrLangsLoadedRef = useRef(false)

  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])

  // Charge les langues OCR sauvegardées
  useEffect(() => {
    async function loadOCRLangs() {
      const savedSource = await window.electron.settings.get('ocrSourceLang') as string
      const savedTarget = await window.electron.settings.get('ocrTargetLang') as string
      if (savedSource) setSourceLang(savedSource)
      if (savedTarget) setTargetLang(savedTarget)
      ocrLangsLoadedRef.current = true
    }
    loadOCRLangs()
  }, [])

  // Sauvegarde quand les langues changent
  useEffect(() => {
    if (!ocrLangsLoadedRef.current) return
    window.electron.settings.set('ocrSourceLang', sourceLang)
  }, [sourceLang])

  useEffect(() => {
    if (!ocrLangsLoadedRef.current) return
    window.electron.settings.set('ocrTargetLang', targetLang)
  }, [targetLang])

  useEffect(() => {
    window.electron.ocr.onCapturing((active: boolean) => {
      setIsCapturing(active)
      if (active) setStatus('● Capture active')
    })

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

        const clean = text
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF.,!?':;«»()[\]{}\-–—/]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

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

  async function openSelection() {
    await window.electron.ocr.openSelection()
    setStatus('Sélectionne une zone sur l\'écran...')
  }

  async function stopCapture() {
    await window.electron.ocr.stop()
    setIsCapturing(false)
    lastTextRef.current = ''
    setStatus('Prêt — sélectionne une zone')
  }

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '0 24px 24px',
      maxWidth: '800px', margin: '0 auto',
      userSelect: 'none',
    }}>
      <style>{`* { -webkit-user-select: none !important; user-select: none !important; }`}</style>

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

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isCapturing ? (
            <button onClick={openSelection} style={{
              flex: 1,
              background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none', color: '#fff', padding: '12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
            }}>
              ⊹ Sélectionner une zone
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

        <div style={{ marginTop: '12px', color: '#475569', fontSize: '11px', textAlign: 'center' }}>
          Une fenêtre s'ouvrira pour sélectionner la zone sur n'importe quel écran — se ferme en 15s
        </div>
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