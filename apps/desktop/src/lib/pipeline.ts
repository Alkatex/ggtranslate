import { DeepgramSTT } from './deepgram'
import { translateText } from './translation'
import { speakTranslation, clearTTSQueue } from './tts'

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

  constructor() {
    this.stt = new DeepgramSTT()
  }

  async start(config: PipelineConfig) {
    this.config = config

    try {
      await this.stt.init()
      config.onStateChange('listening')

      await this.stt.start(config.micDeviceId, {
        language: config.sourceLang,

        onTranscript: (text, isFinal) => {
          // Affiche toujours le transcript en temps réel
          config.onTranscript(text, isFinal)

          // Chaque phrase finale est traduite indépendamment
          // Aucun mutex — toutes les phrases sont capturées
          if (isFinal && text.trim()) {
            this.processFinalTranscript(text)
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

    try {
      // Indicateur visuel — micro continue d'écouter
      this.config.onStateChange('processing')

      // Traduire
      const translated = await translateText(
        text,
        this.config.sourceLang,
        this.config.targetLang
      )

      this.config.onTranslated(translated)

      // Retour immédiat en listening
      this.config.onStateChange('listening')

      // TTS en parallèle — queue gère l'ordre
      speakTranslation(
        translated,
        this.config.headsetDeviceId,
        this.config.targetLang
      ).catch(err => console.error('Erreur TTS:', err))

    } catch (err) {
      console.error('Erreur traduction:', err)
      this.config?.onStateChange('listening')
    }
  }

  stop() {
    this.stt.stop()
    clearTTSQueue()
    this.config?.onStateChange('inactive')
  }
}