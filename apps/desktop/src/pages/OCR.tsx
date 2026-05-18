import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { translateText } from '../lib/translation'
import { useAuthStore } from '../store/auth'
import { getAvailableLanguages } from '../lib/languages'
import Tesseract from 'tesseract.js'
import { motion, AnimatePresence } from 'motion/react'
import tokens from '../styles/tokens'

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
    setStatus("Sélectionne une zone sur l'écran...")
  }

  async function stopCapture() {
    await window.electron.ocr.stop()
    setIsCapturing(false)
    lastTextRef.current = ''
    setStatus('Prêt — sélectionne une zone')
  }

  const isProcessing = status.includes('⟳')

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 24px 24px', maxWidth: '800px', margin: '0 auto', userSelect: 'none' }}>
      <style>{`* { -webkit-user-select: none !important; user-select: none !important; }`}</style>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${tokens.colors.border}`, marginBottom: '24px' }}
      >
        <div>
          <div style={{ fontFamily: tokens.fonts.display, color: tokens.colors.cyan, fontSize: '18px', fontWeight: tokens.fontWeights.bold, letterSpacing: tokens.letterSpacing.wide }}>GG TRANSLATE</div>
          <div style={{ color: tokens.colors.dim, fontSize: '10px', letterSpacing: tokens.letterSpacing.widest, marginTop: '2px' }}>CAPTURE OCR</div>
        </div>
        <button
          onClick={() => navigate('/translate')}
          style={{ background: 'transparent', border: 'none', color: tokens.colors.muted, cursor: 'pointer', fontSize: '13px', transition: tokens.transitions.normal }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.colors.text}
          onMouseLeave={e => e.currentTarget.style.color = tokens.colors.muted}
        >← Traducteur</button>
      </motion.div>

      {/* LANGUES */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: tokens.colors.cyan, fontSize: '11px', letterSpacing: tokens.letterSpacing.wide, marginBottom: '8px', fontFamily: tokens.fonts.display }}>LANGUE SOURCE</div>
          <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} style={{ width: '100%', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.lg, fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <div style={{ marginTop: '24px', color: tokens.colors.dim, fontSize: '18px' }}>→</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: tokens.colors.cyan, fontSize: '11px', letterSpacing: tokens.letterSpacing.wide, marginBottom: '8px', fontFamily: tokens.fonts.display }}>LANGUE CIBLE</div>
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ width: '100%', background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.text, padding: '10px 14px', borderRadius: tokens.radius.lg, fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
      </motion.div>

      {/* CONTRÔLES */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.14 }}
        style={{ background: tokens.colors.bg2, border: `1px solid ${isCapturing ? tokens.colors.green + '55' : tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px', marginBottom: '20px', transition: 'border-color 0.3s' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide }}>📷 ZONE DE CAPTURE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isCapturing && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '6px', height: '6px', borderRadius: '50%', background: isProcessing ? tokens.colors.blue : tokens.colors.green }}
              />
            )}
            <div style={{ color: isCapturing ? (isProcessing ? tokens.colors.blue : tokens.colors.green) : tokens.colors.dim, fontSize: '11px', fontFamily: tokens.fonts.display }}>
              {status}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <AnimatePresence mode="wait">
            {!isCapturing ? (
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={openSelection}
                style={{ flex: 1, background: tokens.gradients.primaryR, border: 'none', color: tokens.colors.white, padding: '12px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display }}
              >
                ⊹ Sélectionner une zone
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={stopCapture}
                style={{ flex: 1, background: tokens.alpha.redDim, border: `1px solid ${tokens.colors.red}`, color: tokens.colors.red, padding: '12px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: tokens.fonts.display }}
              >
                ⏹ Arrêter la capture
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setResults([])}
            style={{ background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: tokens.colors.dim, padding: '12px 16px', borderRadius: tokens.radius.md, cursor: 'pointer', fontSize: '12px', transition: tokens.transitions.normal }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.red}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.border}
          >🗑️</motion.button>
        </div>

        <div style={{ marginTop: '12px', color: tokens.colors.dim, fontSize: '11px', textAlign: 'center' }}>
          Une fenêtre s'ouvrira pour sélectionner la zone sur n'importe quel écran — se ferme en 15s
        </div>
      </motion.div>

      {/* RÉSULTATS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        style={{ background: tokens.colors.bg2, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.xl, padding: '20px' }}
      >
        <div style={{ fontFamily: tokens.fonts.display, fontSize: '11px', color: tokens.colors.cyan, letterSpacing: tokens.letterSpacing.wide, marginBottom: '14px' }}>
          📝 TEXTES TRADUITS
          {results.length > 0 && (
            <span style={{ marginLeft: '8px', background: tokens.alpha.cyanLight, borderRadius: tokens.radius.full, padding: '1px 8px', fontSize: '10px' }}>
              {results.length}
            </span>
          )}
        </div>

        <div ref={resultsRef} style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {results.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: tokens.colors.dim, fontSize: '12px', textAlign: 'center', padding: '40px' }}
              >
                Les textes détectés et traduits apparaîtront ici
              </motion.div>
            ) : (
              results.map(r => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -12, y: 6 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
                  style={{ background: tokens.colors.bg3, borderRadius: tokens.radius.md, padding: '12px 14px', border: `1px solid ${tokens.colors.border}` }}
                >
                  <div style={{ color: tokens.colors.dim, fontSize: '11px', marginBottom: '6px' }}>🔍 {r.original}</div>
                  <div style={{ color: tokens.colors.cyan, fontSize: '14px', marginBottom: '4px' }}>→ {r.translated}</div>
                  <div style={{ color: tokens.colors.veryDim, fontSize: '10px' }}>{r.timestamp}</div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}