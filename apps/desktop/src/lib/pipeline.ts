// Pipeline complet — orchestre STT → Traduction → TTS
// C'est le cerveau de l'app

import { DeepgramSTT } from './deepgram'
import { translateText } from './translation'
import { speakTranslation } from './tts'

export type PipelineState =
  | 'inactive'
  | 'listening'
  | 'processing'
  | 'translated'
  | 'error'

export interface PipelineConfig {
  micDeviceId: string | null
  headsetDeviceId: string | null
  sourceLang: string
  targetLang: string
  voiceEffect?: string
  onStateChange: (state: PipelineState) => void
  onTranscript: (text: string, isFinal: boolean) => void
  onTranslated: (text: string) => void
  onError: (error: string) => void
}

export class TranslationPipeline {
  private stt: DeepgramSTT
  private config: PipelineConfig | null = null
  private isProcessing = false
  private pendingTranscript = ''

  constructor() {
    this.stt = new DeepgramSTT()
  }

  async start(config: PipelineConfig) {
    this.config = config
    this.isProcessing = false
    this.pendingTranscript = ''

    try {
      // Initialiser Deepgram (récupère le token depuis le backend)
      await this.stt.init()

      config.onStateChange('listening')

      // Démarrer la capture et transcription
      await this.stt.start(config.micDeviceId, {
        language: config.sourceLang,

        onTranscript: async (text, isFinal) => {
          // Affiche le transcript en temps réel (interim)
          config.onTranscript(text, isFinal)
          this.pendingTranscript = text

          // Quand la phrase est finale → traduire + TTS
          if (isFinal && text.trim() && !this.isProcessing) {
            await this.processFinalTranscript(text)
          }
        },

        onError: (error) => {
          config.onStateChange('error')
          config.onError(error)
        },
      })

    } catch (err) {
      config.onStateChange('error')
      config.onError('Impossible de démarrer le pipeline')
    }
  }

  private async processFinalTranscript(text: string) {
    if (!this.config) return

    // MUTEX — empêche les appels simultanés
    this.isProcessing = true
    this.config.onStateChange('processing')

    try {
      // 1. Traduire via DeepL
      const translated = await translateText(
        text,
        this.config.sourceLang,
        this.config.targetLang
      )

      this.config.onTranslated(translated)
      this.config.onStateChange('translated')

      // 2. TTS → jouer dans le casque
      await speakTranslation(
        translated,
        this.config.headsetDeviceId,
        'alloy'
      )

      // 3. Retour en écoute — APRÈS que le TTS soit terminé
      // Critique : on ne réactive pas le micro avant que l'audio soit fini
      // Sinon boucle garantie
      this.config.onStateChange('listening')

    } catch (err) {
      this.config.onStateChange('error')
      this.config.onError('Erreur pipeline traduction')
    } finally {
      this.isProcessing = false
    }
  }

  stop() {
    this.stt.stop()
    this.isProcessing = false
    this.pendingTranscript = ''
    this.config?.onStateChange('inactive')
  }
}