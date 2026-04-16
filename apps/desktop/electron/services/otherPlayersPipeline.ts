// @ts-ignore
import { startOtherPlayersCapture, stopOtherPlayersCapture } from './otherPlayersCaptureService'
import { Deepgram } from '@deepgram/sdk'
import { BrowserWindow } from 'electron'

interface OtherPlayersPipelineConfig {
  win: BrowserWindow
  language: string
  targetLang: string
}

let currentConfig: OtherPlayersPipelineConfig | null = null
let isRunning = false
let deepgramConnection: any = null

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
  deepgramConnection = deepgram.transcription.live({
    language: config.language,
    punctuate: true,
    interim_results: true,
    smart_format: true,
    model: 'nova-2',
    encoding: 'linear16',
    sample_rate: 48000,
    channels: 1,
    endpointing: 200,
    utterance_end_ms: 1000,
    vad_events: true,
  })

  deepgramConnection.addListener('open', () => {
    console.log('✅ Deepgram Other Players connecté')
    config.win.webContents.send('other-players:state', 'listening')

    const success = startOtherPlayersCapture(config.win, (chunk: Buffer) => {
      if (!isRunning || !deepgramConnection) return
      deepgramConnection.send(chunk)
    })

    if (!success) {
      config.win.webContents.send('other-players:state', 'error')
      config.win.webContents.send('other-players:error', 'Impossible de démarrer la capture audio')
      isRunning = false
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
        }
      }
    } catch (e) {
      console.error('Erreur parsing transcript Other Players:', e)
    }
  })

  deepgramConnection.addListener('error', (err: any) => {
    console.error('Erreur Deepgram Other Players:', err)
    config.win.webContents.send('other-players:state', 'error')
    config.win.webContents.send('other-players:error', 'Erreur connexion Deepgram')
    isRunning = false
  })

  deepgramConnection.addListener('close', () => {
    console.log('🔌 Deepgram Other Players déconnecté')
    if (isRunning) {
      config.win.webContents.send('other-players:state', 'inactive')
    }
  })
}

export function stopOtherPlayersPipeline(): void {
  if (!isRunning) return
  isRunning = false
  stopOtherPlayersCapture()
  deepgramConnection?.finish()
  deepgramConnection = null
  currentConfig?.win.webContents.send('other-players:state', 'inactive')
  currentConfig = null
  console.log('🔌 Pipeline Other Players arrêté')
}