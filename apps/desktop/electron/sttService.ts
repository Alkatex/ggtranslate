import { Deepgram } from '@deepgram/sdk'
import { BrowserWindow } from 'electron'

interface STTSession {
  connection: any
  isActive: boolean
  language: string
  reconnectAttempts: number
  shouldReconnect: boolean
}

let currentSession: STTSession | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let currentWin: BrowserWindow | null = null

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 2000

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
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY manquante dans .env')
  }

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
  }

  return new Promise((resolve, reject) => {
    connection.addListener('open', () => {
      if (!currentSession) return
      console.log('✅ Deepgram STT connecté depuis Electron main')
      currentSession.isActive = true
      currentSession.reconnectAttempts = 0
      win.webContents.send('stt:state', 'listening')
      resolve()
    })

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

    connection.addListener('error', (err: any) => {
      console.error('Erreur Deepgram:', err)
      win.webContents.send('stt:state', 'error')
      win.webContents.send('stt:error', 'Reconnexion en cours...')

      if (currentSession?.shouldReconnect && attempts < MAX_RECONNECT_ATTEMPTS) {
        console.log(`🔄 Reconnexion Deepgram dans ${RECONNECT_DELAY}ms... (tentative ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
        currentSession = null
        reconnectTimer = setTimeout(() => {
          connectDeepgram(win, language, attempts + 1).catch(console.error)
        }, RECONNECT_DELAY)
      } else {
        win.webContents.send('stt:error', 'Connexion Deepgram impossible')
        currentSession = null
        reject(err)
      }
    })

    connection.addListener('close', () => {
      console.log('🔌 Deepgram déconnecté')

      if (currentSession?.shouldReconnect && currentSession?.isActive) {
        console.log('🔄 Reconnexion automatique Deepgram...')
        win.webContents.send('stt:state', 'processing')
        const lang = currentSession.language
        const att = currentSession.reconnectAttempts
        currentSession = null

        if (att < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimer = setTimeout(() => {
            connectDeepgram(win, lang, att + 1).catch(console.error)
          }, RECONNECT_DELAY)
        } else {
          win.webContents.send('stt:state', 'inactive')
          win.webContents.send('stt:error', 'Connexion perdue — redémarre la session')
        }
      } else {
        if (currentSession?.isActive) {
          win.webContents.send('stt:state', 'inactive')
        }
        currentSession = null
      }
    })
  })
}

export function sendAudioChunk(chunk: Buffer): void {
  if (currentSession?.isActive && currentSession.connection) {
    currentSession.connection.send(chunk)
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
    currentSession.connection?.finish()
    currentSession = null
  }
  currentWin = null
}