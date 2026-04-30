import { DeepgramSTT } from './deepgram'
import { translateText } from './translation'
import { speakTranslation, clearTTSQueue } from './tts'
import { errorBus } from './errorBus'

export type PipelineState =
  | 'inactive'
  | 'listening'
  | 'processing'
  | 'translated'
  | 'error'

export interface PipelineConfig {
  micDeviceId: string | null
  headsetDeviceId: string | null
  virtualDeviceId: string | null
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

  // ─── Pipeline parallèle ───────────────────────────────────────────────────
  private interimText = ''
  private preTranslateCache = new Map<string, string>()
  private preTranslateTimer: ReturnType<typeof setTimeout> | null = null
  private lastFinalText = ''

  constructor() {
    this.stt = new DeepgramSTT()
  }

  async start(config: PipelineConfig) {
    if (this.isRunning) this.stop()

    this.sessionId += 1
    const currentSessionId = this.sessionId
    this.config = config
    this.isRunning = true
    this.interimText = ''
    this.preTranslateCache.clear()
    this.lastFinalText = ''

    try {
      await this.stt.init()
      if (!this.isSessionActive(currentSessionId)) return

      config.onStateChange('listening')

      await this.stt.start(config.micDeviceId, {
        language: config.sourceLang,
        onTranscript: (text, isFinal) => {
          if (!this.isSessionActive(currentSessionId)) return
          config.onTranscript(text, isFinal)

          if (!isFinal) {
            this.handleInterim(text, config, currentSessionId)
          } else if (text.trim()) {
            this.handleFinal(text, config, currentSessionId)
          }
        },
        onError: (error) => {
          if (!this.isSessionActive(currentSessionId)) return
          errorBus.emit({
            type: 'STT_ERROR',
            severity: 'error',
            message: error,
            retryable: true,
            context: { sourceLang: config.sourceLang },
          })
          config.onStateChange('error')
          config.onError(error)
        },
      })
    } catch (err: any) {
      if (!this.isSessionActive(currentSessionId)) return
      errorBus.emit({
        type: 'PIPELINE_ERROR',
        severity: 'critical',
        message: 'Impossible de démarrer le pipeline',
        retryable: true,
        context: { error: err?.message },
      })
      config.onStateChange('error')
      config.onError('Impossible de démarrer le pipeline')
    }
  }

  // ─── Pré-traduction sur interim (non bloquant) ────────────────────────────
  private handleInterim(
    text: string,
    config: PipelineConfig,
    sessionId: number
  ) {
    this.interimText = text

    if (this.preTranslateTimer) clearTimeout(this.preTranslateTimer)

    this.preTranslateTimer = setTimeout(async () => {
      if (!this.isSessionActive(sessionId)) return
      if (!text.trim() || text.length < 5) return
      if (this.preTranslateCache.has(text)) return

      try {
        const translated = await translateText(text, config.sourceLang, config.targetLang)
        if (!this.isSessionActive(sessionId)) return
        this.preTranslateCache.set(text, translated)
        console.log('⚡ Pré-traduction cachée:', text, '→', translated)
      } catch {
        // Silencieux — le final refera la traduction
      }
    }, 400)
  }

  // ─── Final : utilise cache pré-traduit si disponible ─────────────────────
  private async handleFinal(
    text: string,
    config: PipelineConfig,
    sessionId: number
  ) {
    if (!this.isSessionActive(sessionId)) return
    if (text === this.lastFinalText) return
    this.lastFinalText = text

    if (this.preTranslateTimer) {
      clearTimeout(this.preTranslateTimer)
      this.preTranslateTimer = null
    }

    try {
      config.onStateChange('processing')

      let translated: string

      if (this.preTranslateCache.has(text)) {
        translated = this.preTranslateCache.get(text)!
        console.log('✅ Cache hit:', text, '→', translated)
      } else {
        console.log('🔄 Cache miss — traduction normale')
        translated = await translateText(text, config.sourceLang, config.targetLang)
      }

      if (!this.isSessionActive(sessionId)) return

      if (this.preTranslateCache.size > 20) {
        const firstKey = this.preTranslateCache.keys().next().value
        if (firstKey) this.preTranslateCache.delete(firstKey)
      }

      config.onTranslated(translated)
      config.onStateChange('listening')

      const outputDevice = config.virtualDeviceId || config.headsetDeviceId
      speakTranslation(
        translated,
        outputDevice,
        config.targetLang,
        config.voiceEffect || 'normal'
      ).catch(err => {
        errorBus.emit({
          type: 'TTS_ERROR',
          severity: 'warning',
          message: 'Erreur TTS',
          retryable: true,
          context: { error: err?.message },
        })
        console.error('Erreur TTS:', err)
      })

    } catch (err: any) {
      errorBus.emit({
        type: 'TRANSLATION_ERROR',
        severity: 'error',
        message: 'Erreur traduction finale',
        retryable: true,
        context: { text, error: err?.message },
      })
      console.error('Erreur traduction finale:', err)
      if (!this.isSessionActive(sessionId)) return
      config.onStateChange('listening')
    }
  }

  private isSessionActive(sessionId: number): boolean {
    return this.isRunning && this.sessionId === sessionId
  }

  stop() {
    this.isRunning = false
    this.sessionId += 1

    if (this.preTranslateTimer) {
      clearTimeout(this.preTranslateTimer)
      this.preTranslateTimer = null
    }

    this.preTranslateCache.clear()
    this.interimText = ''
    this.lastFinalText = ''

    this.stt.stop()
    clearTTSQueue()
    if (this.config) this.config.onStateChange('inactive')
    this.config = null

    console.log('🛑 Pipeline arrêté proprement')
  }
}