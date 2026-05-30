import { speakOtherPlayers } from './tts'

export type OtherPlayersState = 'inactive' | 'listening' | 'processing' | 'error'

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
let ttsEnabled = true // ← toggle TTS autres joueurs

// ← Export pour toggle depuis Translate.tsx sans redémarrer le pipeline
export function setOtherPlayersTTSEnabled(enabled: boolean) {
  ttsEnabled = enabled
}

export function getOtherPlayersTTSEnabled(): boolean {
  return ttsEnabled
}

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

  op.onTranscript((data) => {
    if (!current) return
    const text = data.text.trim()
    if (!text) return
    // Affiche le transcript dans l'UI (la traduction arrive via onTranslated)
    current.onTranscript(data.text, data.isFinal)
  })

  // ─── Traduction reçue du process principal (sans CORS) ───────────────────
  op.onTranslated((translated) => {
    if (!current || !translated) return
    const cfg = current
    cfg.onTranslated(translated)

    // ← Joue le TTS seulement si activé
    if (ttsEnabled) {
      speakOtherPlayers(translated, cfg.headsetDeviceId, cfg.targetLang)
        .catch((err: unknown) => console.error('Erreur TTS:', err))
    }
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