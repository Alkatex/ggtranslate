import { translateText } from './translation'
import { speakOtherPlayers } from './tts'

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

let current: OtherPlayersConfig | null = null

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

    current.onTranscript(data.text, data.isFinal)

    if (data.isFinal && data.text.trim()) {
      current.onStateChange('processing')
      const cfg = current

      try {
        const translated = await translateText(
          data.text.trim(),
          cfg.sourceLang,
          cfg.targetLang
        )

        if (current === cfg) {
          cfg.onTranslated(translated)
          cfg.onStateChange('listening')

          speakOtherPlayers(
            translated,
            cfg.headsetDeviceId,
            cfg.targetLang
          ).catch((err: unknown) => console.error('Erreur TTS Other Players:', err))
        }
      } catch {
        cfg.onError('Erreur traduction')
        cfg.onStateChange('error')
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
  if (typeof window !== 'undefined' && window.electron?.otherPlayers) {
    window.electron.otherPlayers.removeListeners()
    void window.electron.otherPlayers.stop()
  }
  current = null
}