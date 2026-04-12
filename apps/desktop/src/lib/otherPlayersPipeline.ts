import { translateText } from './translation'
import { speakTranslation } from './tts'

export type OtherPlayersState =
  | 'inactive'
  | 'listening'
  | 'processing'
  | 'error'

export interface OtherPlayersConfig {
  headsetDeviceId: string | null
  sourceLang: string
  targetLang: string
  onStateChange: (state: OtherPlayersState) => void
  onTranscript: (text: string, isFinal: boolean) => void
  onTranslated: (text: string) => void
  onError: (error: string) => void
}

let currentConfig: OtherPlayersConfig | null = null

export async function startOtherPlayers(config: OtherPlayersConfig): Promise<void> {
  currentConfig = config

  try {
    // Démarrer la capture native + STT dans Electron main
    await window.electron.otherPlayers.start(config.sourceLang, config.targetLang)

    config.onStateChange('listening')

    // Écouter les transcripts
    window.electron.otherPlayers.onTranscript((data) => {
      config.onTranscript(data.text, data.isFinal)

      if (data.isFinal && data.text.trim()) {
        processTranscript(data.text)
      }
    })

    window.electron.otherPlayers.onState((state) => {
      console.log('Other Players state:', state)
      if (state === 'error') config.onStateChange('error')
    })

    window.electron.otherPlayers.onError((error) => {
      config.onError(error)
      config.onStateChange('error')
    })

  } catch (err) {
    config.onStateChange('error')
    config.onError('Impossible de démarrer la capture autres joueurs')
  }
}

async function processTranscript(text: string) {
  if (!currentConfig) return

  try {
    currentConfig.onStateChange('processing')

    const translated = await translateText(
      text,
      currentConfig.sourceLang,
      currentConfig.targetLang
    )

    currentConfig.onTranslated(translated)
    currentConfig.onStateChange('listening')

    speakTranslation(
      translated,
      currentConfig.headsetDeviceId,
      currentConfig.targetLang
    ).catch((err: unknown) => console.error('Erreur TTS Other Players:', err))

  } catch (err) {
    console.error('Erreur traduction Other Players:', err)
    currentConfig?.onStateChange('listening')
  }
}

export function stopOtherPlayers(): void {
  window.electron.otherPlayers.stop()
  window.electron.otherPlayers.removeListeners()
  currentConfig?.onStateChange('inactive')
  currentConfig = null
}