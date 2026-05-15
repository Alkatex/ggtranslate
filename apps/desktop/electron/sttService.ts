import { BrowserWindow } from 'electron'
import WebSocket from 'ws'

interface STTSession {
  ws: WebSocket | null
  isActive: boolean
  language: string
  shouldReconnect: boolean
  reconnectAttempts: number
}

let currentSession: STTSession | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let currentWin: BrowserWindow | null = null

const WHISPER_URL = 'ws://localhost:8765'
const MAX_RECONNECT_ATTEMPTS = 5

export async function startSTTSession(
  win: BrowserWindow,
  language: string
): Promise<void> {
  if (currentSession?.isActive) stopSTTSession()
  currentWin = win
  return connectWhisper(win, language, 0)
}

function connectWhisper(
  win: BrowserWindow,
  language: string,
  attempts: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WHISPER_URL)

    currentSession = {
      ws,
      isActive: false,
      language,
      shouldReconnect: true,
      reconnectAttempts: attempts,
    }

    ws.on('open', () => {
      if (!currentSession) return
      console.log('✅ Whisper WebSocket CONNECTÉ')
      currentSession.isActive = true
      currentSession.reconnectAttempts = 0

      // ← Envoie la config langue
      ws.send(JSON.stringify({ type: 'config', language }))

      win.webContents.send('stt:state', 'listening')
      resolve()
    })

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'transcript' && msg.text?.trim()) {
          win.webContents.send('stt:transcript', {
            text: msg.text,
            isFinal: msg.isFinal,
          })
        }
      } catch (e) {
        console.error('Erreur parsing transcript Whisper:', e)
      }
    })

    ws.on('error', (err: any) => {
      console.error('❌ Whisper WebSocket ERROR:', err.message)
      if (!currentSession) return

      if (currentSession.shouldReconnect && attempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000)
        console.log(`🔄 Reconnexion Whisper dans ${delay}ms...`)
        win.webContents.send('stt:error', `Reconnexion Whisper dans ${Math.round(delay / 1000)}s...`)
        currentSession = null
        reconnectTimer = setTimeout(() => {
          connectWhisper(win, language, attempts + 1).catch(console.error)
        }, delay)
      } else {
        win.webContents.send('stt:error', '⚙️ Serveur Whisper non disponible — lance whisper_server.py')
        win.webContents.send('stt:state', 'error')
        currentSession = null
        reject(err)
      }
    })

    ws.on('close', () => {
      console.log('🔌 Whisper WebSocket FERMÉ')
      if (!currentSession) return

      const wasActive = currentSession.isActive
      const lang = currentSession.language
      const att = currentSession.reconnectAttempts
      const shouldReconnect = currentSession.shouldReconnect

      currentSession.isActive = false
      currentSession = null

      if (shouldReconnect && wasActive && att < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, att), 10000)
        console.log(`🔄 Reconnexion après close dans ${delay}ms...`)
        win.webContents.send('stt:state', 'processing')
        reconnectTimer = setTimeout(() => {
          connectWhisper(win, lang, att + 1).catch(console.error)
        }, delay)
      } else {
        if (wasActive) win.webContents.send('stt:state', 'inactive')
      }
    })
  })
}

export function sendAudioChunk(chunk: Buffer): void {
  if (currentSession?.isActive && currentSession.ws?.readyState === WebSocket.OPEN) {
    try {
      currentSession.ws.send(chunk)
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

  if (currentSession) {
    currentSession.shouldReconnect = false
    currentSession.isActive = false
    try { currentSession.ws?.close() } catch {}
    currentSession = null
  }

  currentWin = null
  console.log('🛑 Whisper STT Session arrêtée')
}