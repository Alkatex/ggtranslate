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
  private sessionId = 0
  private isRunning = false

  constructor() {
    this.stt = new DeepgramSTT()
  }

  async start(config: PipelineConfig) {
    if (this.isRunning) {
      this.stop()
    }

    this.sessionId += 1
    const currentSessionId = this.sessionId

    this.config = config
    this.isRunning = true

    try {
      await this.stt.init()

      if (!this.isSessionActive(currentSessionId)) return

      config.onStateChange('listening')

      await this.stt.start(config.micDeviceId, {
        language: config.sourceLang,

        onTranscript: (text, isFinal) => {
          if (!this.isSessionActive(currentSessionId)) return

          config.onTranscript(text, isFinal)

          if (isFinal && text.trim()) {
            this.processFinalTranscript(text, config, currentSessionId)
          }
        },

        onError: (error) => {
          if (!this.isSessionActive(currentSessionId)) return

          config.onStateChange('error')
          config.onError(error)
        },
      })
    } catch (err) {
      if (!this.isSessionActive(currentSessionId)) return

      config.onStateChange('error')
      config.onError('Impossible de démarrer le pipeline')
    }
  }

  private isSessionActive(sessionId: number): boolean {
    return this.isRunning && this.sessionId === sessionId
  }

  private async processFinalTranscript(
    text: string,
    config: PipelineConfig,
    sessionId: number
  ) {
    if (!this.isSessionActive(sessionId)) return

    try {
      config.onStateChange('processing')

      const translated = await translateText(
        text,
        config.sourceLang,
        config.targetLang
      )

      if (!this.isSessionActive(sessionId)) return

      config.onTranslated(translated)
      config.onStateChange('listening')

      speakTranslation(
        translated,
        config.headsetDeviceId,
        config.targetLang
      ).catch((err) => {
        console.error('Erreur TTS:', err)
      })
    } catch (err) {
      console.error('Erreur traduction:', err)

      if (!this.isSessionActive(sessionId)) return

      config.onStateChange('listening')
    }
  }

  stop() {
    this.isRunning = false
    this.sessionId += 1

    this.stt.stop()
    clearTTSQueue()

    if (this.config) {
      this.config.onStateChange('inactive')
    }

    this.config = null
  }
}