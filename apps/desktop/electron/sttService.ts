import { Deepgram } from '@deepgram/sdk'
import { BrowserWindow } from 'electron'

interface STTSession {
  connection: any
  isActive: boolean
}

let currentSession: STTSession | null = null

export async function startSTTSession(
  win: BrowserWindow,
  language: string
): Promise<void> {
  if (currentSession?.isActive) {
    stopSTTSession()
  }

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

  currentSession = { connection, isActive: false }

  return new Promise((resolve, reject) => {
    connection.addListener('open', () => {
      if (!currentSession) return
      console.log('✅ Deepgram STT connecté depuis Electron main')
      currentSession.isActive = true
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
      win.webContents.send('stt:error', 'Erreur connexion Deepgram')
      currentSession = null
      reject(err)
    })

    connection.addListener('close', () => {
      console.log('🔌 Deepgram déconnecté')
      if (currentSession?.isActive) {
        win.webContents.send('stt:state', 'inactive')
      }
      currentSession = null
    })
  })
}

export function sendAudioChunk(chunk: Buffer): void {
  if (currentSession?.isActive && currentSession.connection) {
    currentSession.connection.send(chunk)
  }
}

export function stopSTTSession(): void {
  if (currentSession) {
    currentSession.isActive = false
    currentSession.connection?.finish()
    currentSession = null
  }
}