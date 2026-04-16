import { translateText } from './translation'
import { speakOtherPlayers } from './tts'

export type OtherPlayersState =
  | 'inactive'
  | 'listening'
  | 'processing'
  | 'error'

export interface OtherPlayersConfig {
  headsetDeviceId: string | null
  virtualDeviceId: string | null
  sourceLang: string
  targetLang: string
  onStateChange: (state: OtherPlayersState) => void
  onTranscript: (text: string, isFinal: boolean) => void
  onTranslated: (text: string) => void
  onError: (error: string) => void
}

let current: OtherPlayersConfig | null = null
let lastTranslatedText = ''
let pendingTranslation: Promise<string> | null = null
let lastInterimText = ''

function mapMainState(state: string): OtherPlayersState | null {
  if (state === 'inactive' || state === 'listening' || state === 'error') return state
  return null
}

export async function startOtherPlayers(config: OtherPlayersConfig): Promise<void> {
  if (typeof window === 'undefined' || !window.electron?.otherPlayers) {
    config.onError('API Electron indisponible')
    config.onStateChange('error')
    return
  }

  stopOtherPlayers()
  current = config
  lastTranslatedText = ''
  lastInterimText = ''
  pendingTranslation = null
  const op = window.electron.otherPlayers

  op.removeListeners()

  op.onState((state) => {
    const mapped = mapMainState(state)
    if (mapped && current) current.onStateChange(mapped)
  })

  op.onError((error) => {
    current?.onError(error)
    current?.onStateChange('error')
  })

  op.onTranscript(async (data) => {
    if (!current) return
    const cfg = current
    const text = data.text.trim()
    if (!text) return

    current.onTranscript(data.text, data.isFinal)

    if (!data.isFinal) {
      // INTERIM — précharger la traduction pendant que l'utilisateur parle encore
      if (text !== lastInterimText && text.split(' ').length >= 4) {
        lastInterimText = text
        // Lancer la traduction en background sans attendre
        pendingTranslation = translateText(text, cfg.sourceLang, cfg.targetLang)
          .catch(() => '')
      }
    } else {
      // FINAL — utiliser la traduction préchargée si disponible
      if (text === lastTranslatedText) return
      lastTranslatedText = text

      try {
        let translated: string

        if (pendingTranslation && lastInterimText && text.startsWith(lastInterimText.substring(0, 20))) {
          // Réutiliser la traduction préchargée
          translated = await pendingTranslation
        } else {
          // Traduire maintenant
          translated = await translateText(text, cfg.sourceLang, cfg.targetLang)
        }

        pendingTranslation = null
        lastInterimText = ''

        if (!current || !translated) return

        cfg.onTranslated(translated)
        const outputDevice = cfg.virtualDeviceId || cfg.headsetDeviceId

        speakOtherPlayers(translated, outputDevice, cfg.targetLang)
          .catch((err: unknown) => console.error('Erreur TTS:', err))

      } catch {
        cfg.onError('Erreur traduction')
      }
    }
  })

  op.onTranslated((text) => {
    current?.onTranslated(text)
  })

  try {
    await op.start(config.sourceLang, config.targetLang)
  } catch (e) {
    op.removeListeners()
    current = null
    const msg = e instanceof Error ? e.message : 'Impossible de démarrer la capture'
    config.onError(msg)
    config.onStateChange('error')
  }
}

export function stopOtherPlayers(): void {
  pendingTranslation = null
  lastInterimText = ''
  if (typeof window !== 'undefined' && window.electron?.otherPlayers) {
    window.electron.otherPlayers.removeListeners()
    void window.electron.otherPlayers.stop()
  }
  current = null
  lastTranslatedText = ''
}