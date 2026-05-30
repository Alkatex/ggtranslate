// @ts-ignore
import { startOtherPlayersCapture, stopOtherPlayersCapture } from './otherPlayersCaptureService'
import { Deepgram } from '@deepgram/sdk'
import { BrowserWindow } from 'electron'

// ─── Traduction via Node.js fetch — aucune restriction CORS ───────────────────
const RAILWAY_BACKEND = 'https://ggtranslatebackend-production.up.railway.app'

async function translateInMain(text: string, sourceLang: string, targetLang: string): Promise<string> {
  if (!text.trim() || sourceLang === targetLang) return text
  try {
    const res = await fetch(`${RAILWAY_BACKEND}/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as any
    return data.translated || data.translatedText || text
  } catch (err) {
    console.error('❌ Traduction main process échouée:', err)
    return text
  }
}

interface OtherPlayersPipelineConfig {
  win: BrowserWindow
  language: string
  targetLang: string
}

let currentConfig: OtherPlayersPipelineConfig | null = null
let isRunning = false
let deepgramConnection: any = null
let keepAliveTimer: ReturnType<typeof setInterval> | null = null

export async function startOtherPlayersPipeline(
  config: OtherPlayersPipelineConfig
): Promise<void> {
  if (isRunning) stopOtherPlayersPipeline()

  currentConfig = config
  isRunning = true

  console.log('🎧 Démarrage pipeline Other Players')

  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    config.win.webContents.send('other-players:state', 'error')
    config.win.webContents.send('other-players:error', 'Deepgram API key manquante')
    isRunning = false
    return
  }

  const deepgram = new Deepgram(apiKey)

  // ─── FIX: sample_rate 16000 pour correspondre à la capture audio ──────────
  deepgramConnection = deepgram.transcription.live({
    language: config.language,
    punctuate: true,
    interim_results: true,
    smart_format: true,
    model: 'nova-2',
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
    endpointing: 200,
    utterance_end_ms: 1000,
    vad_events: true,
  })

  deepgramConnection.addListener('open', () => {
    if (!isRunning) return
    console.log('✅ Deepgram Other Players connecté')
    config.win.webContents.send('other-players:state', 'listening')

    // ─── FIX: Keepalive toutes les 8s pour éviter déconnexion ────────────────
    if (keepAliveTimer) clearInterval(keepAliveTimer)
    keepAliveTimer = setInterval(() => {
      if (isRunning && deepgramConnection) {
        try {
          const silence = Buffer.alloc(3200)
          deepgramConnection.send(silence)
        } catch {}
      }
    }, 8000)

    const success = startOtherPlayersCapture(config.win, (chunk: Buffer) => {
      if (!isRunning || !deepgramConnection) return
      try {
        deepgramConnection.send(chunk)
      } catch (err) {
        console.error('Erreur envoi chunk Other Players:', err)
      }
    })

    if (!success) {
      config.win.webContents.send('other-players:state', 'error')
      config.win.webContents.send('other-players:error', 'Impossible de démarrer la capture audio système — vérifie que VB-Cable est installé')
      // ─── FIX: Nettoyage complet si capture échoue ─────────────────────────
      isRunning = false
      if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null }
      try { deepgramConnection?.finish() } catch {}
      deepgramConnection = null
    }
  })

  deepgramConnection.addListener('transcriptReceived', (message: string) => {
    try {
      const data = JSON.parse(message)
      if (data.type === 'Results') {
        const transcript = data?.channel?.alternatives?.[0]?.transcript
        if (transcript && transcript.trim()) {
          console.log('📝 Other Players transcript:', transcript, '| Final:', data.is_final)
          config.win.webContents.send('other-players:transcript', {
            text: transcript,
            isFinal: data.is_final,
          })

          // ─── Traduction dans le process principal (pas de CORS) ───────────
          if (data.is_final) {
            translateInMain(transcript, config.language, config.targetLang)
              .then(translated => {
                if (isRunning && config.win && !config.win.isDestroyed()) {
                  config.win.webContents.send('other-players:translated', translated)
                }
              })
              .catch(err => console.error('Erreur traduction Other Players:', err))
          }
        }
      }
    } catch (e) {
      console.error('Erreur parsing transcript Other Players:', e)
    }
  })

  // ─── FIX: Nettoyage complet sur erreur ────────────────────────────────────
  deepgramConnection.addListener('error', (err: any) => {
    console.error('❌ Erreur Deepgram Other Players:', err)
    if (!isRunning) return

    config.win.webContents.send('other-players:state', 'error')
    config.win.webContents.send('other-players:error', 'Erreur connexion Deepgram Other Players')

    // Nettoyage complet
    isRunning = false
    if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null }
    stopOtherPlayersCapture()
    try { deepgramConnection?.finish() } catch {}
    deepgramConnection = null
    currentConfig = null
  })

  deepgramConnection.addListener('close', () => {
    console.log('🔌 Deepgram Other Players déconnecté')
    if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null }
    if (isRunning) {
      config.win.webContents.send('other-players:state', 'inactive')
      isRunning = false
    }
  })
}

export function stopOtherPlayersPipeline(): void {
  if (!isRunning && !deepgramConnection) return

  console.log('🔌 Arrêt pipeline Other Players')
  isRunning = false

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }

  stopOtherPlayersCapture()

  try { deepgramConnection?.finish() } catch {}
  deepgramConnection = null

  currentConfig?.win.webContents.send('other-players:state', 'inactive')
  currentConfig = null

  console.log('✅ Pipeline Other Players arrêté proprement')
}