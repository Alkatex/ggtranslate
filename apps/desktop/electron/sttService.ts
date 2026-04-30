import { Deepgram } from '@deepgram/sdk'
import { BrowserWindow } from 'electron'

// ─── États machine WebSocket ───────────────────────────────────────────────────
type WSState = 'CONNECTED' | 'RECONNECTING' | 'DEAD'

interface STTSession {
  connection: any
  isActive: boolean
  language: string
  reconnectAttempts: number
  shouldReconnect: boolean
  wsState: WSState
}

let currentSession: STTSession | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let keepAliveTimer: ReturnType<typeof setInterval> | null = null
let currentWin: BrowserWindow | null = null

const MAX_RECONNECT_ATTEMPTS = 7
const BASE_RECONNECT_DELAY = 1000 // 1s, 2s, 4s, 8s, 16s, 32s, 64s

// ─── Exponential backoff ───────────────────────────────────────────────────────
function getReconnectDelay(attempts: number): number {
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempts), 30000)
}

export async function startSTTSession(
  win: BrowserWindow,
  language: string
): Promise<void> {
  if (currentSession?.isActive) {
    stopSTTSession()
  }
  currentWin = win
  return connectDeepgram(win, language, 0)
}

async function connectDeepgram(
  win: BrowserWindow,
  language: string,
  attempts: number
): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY manquante dans .env')

  const deepgram = new Deepgram(apiKey)

  const connection = deepgram.transcription.live({
    language,
    punctuate: true,
    interim_results: true,
    smart_format: true,
    model: 'nova-2',
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
    endpointing: 300,
    utterance_end_ms: 1000,
    vad_events: true,
  })

  currentSession = {
    connection,
    isActive: false,
    language,
    reconnectAttempts: attempts,
    shouldReconnect: true,
    wsState: 'RECONNECTING',
  }

  return new Promise((resolve, reject) => {

    // ─── OPEN ─────────────────────────────────────────────────────────────────
    connection.addListener('open', () => {
      if (!currentSession) return
      console.log('✅ Deepgram CONNECTED')
      currentSession.isActive = true
      currentSession.reconnectAttempts = 0
      currentSession.wsState = 'CONNECTED'
      win.webContents.send('stt:state', 'listening')

      // ─── Keepalive — envoie silence toutes les 8s pour éviter disconnect ────
      if (keepAliveTimer) clearInterval(keepAliveTimer)
      keepAliveTimer = setInterval(() => {
        if (currentSession?.isActive && currentSession.connection) {
          try {
            const silence = Buffer.alloc(3200) // 100ms de silence à 16kHz
            currentSession.connection.send(silence)
          } catch {}
        }
      }, 8000)

      resolve()
    })

    // ─── TRANSCRIPT ───────────────────────────────────────────────────────────
    connection.addListener('transcriptReceived', (message: string) => {
      try {
        const data = JSON.parse(message)
        if (data.type === 'Results') {
          const transcript = data?.channel?.alternatives?.[0]?.transcript
          if (transcript && transcript.trim()) {
            win.webContents.send('stt:transcript', {
              text: transcript,
              isFinal: data.is_final,
            })
          }
        }
      } catch (e) {
        console.error('Erreur parsing transcript:', e)
      }
    })

    // ─── ERROR ────────────────────────────────────────────────────────────────
    connection.addListener('error', (err: any) => {
      console.error('❌ Deepgram ERROR:', err)

      if (!currentSession) return
      currentSession.wsState = 'RECONNECTING'
      win.webContents.send('stt:state', 'processing')

      if (currentSession.shouldReconnect && attempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = getReconnectDelay(attempts)
        console.log(`🔄 RECONNECTING dans ${delay}ms... (${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
        win.webContents.send('stt:error', `Reconnexion dans ${Math.round(delay / 1000)}s...`)
        currentSession = null
        reconnectTimer = setTimeout(() => {
          connectDeepgram(win, language, attempts + 1).catch(console.error)
        }, delay)
      } else {
        console.error('💀 Deepgram DEAD — max tentatives atteint')
        if (currentSession) currentSession.wsState = 'DEAD'
        win.webContents.send('stt:error', 'Connexion Deepgram impossible — redémarre la session')
        win.webContents.send('stt:state', 'error')
        currentSession = null
        reject(err)
      }
    })

    // ─── CLOSE ────────────────────────────────────────────────────────────────
    connection.addListener('close', () => {
      console.log('🔌 Deepgram CLOSE')

      if (keepAliveTimer) {
        clearInterval(keepAliveTimer)
        keepAliveTimer = null
      }

      if (!currentSession) return

      const wasActive = currentSession.isActive
      const lang = currentSession.language
      const att = currentSession.reconnectAttempts
      const shouldReconnect = currentSession.shouldReconnect

      currentSession.isActive = false
      currentSession.wsState = 'RECONNECTING'

      if (shouldReconnect && wasActive) {
        if (att < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay(att)
          console.log(`🔄 RECONNECTING après close dans ${delay}ms...`)
          win.webContents.send('stt:state', 'processing')
          currentSession = null
          reconnectTimer = setTimeout(() => {
            connectDeepgram(win, lang, att + 1).catch(console.error)
          }, delay)
        } else {
          console.error('💀 Deepgram DEAD — close max tentatives')
          win.webContents.send('stt:state', 'error')
          win.webContents.send('stt:error', 'Connexion perdue — redémarre la session')
          currentSession = null
        }
      } else {
        if (wasActive) win.webContents.send('stt:state', 'inactive')
        currentSession = null
      }
    })
  })
}

export function sendAudioChunk(chunk: Buffer): void {
  if (currentSession?.isActive && currentSession.wsState === 'CONNECTED' && currentSession.connection) {
    try {
      currentSession.connection.send(chunk)
    } catch (err) {
      console.error('❌ sendAudioChunk error:', err)
    }
  }
}

export function stopSTTSession(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }

  if (currentSession) {
    currentSession.shouldReconnect = false
    currentSession.isActive = false
    currentSession.wsState = 'DEAD'
    try { currentSession.connection?.finish() } catch {}
    currentSession = null
  }

  currentWin = null
  console.log('🛑 STT Session arrêtée proprement')
}