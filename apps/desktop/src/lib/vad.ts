interface VADOptions {
    hysteresisFrames?: number
    hangoverFrames?: number
  }
  
  export class VAD {
    private isSpeaking = false
    private speechFrameCount = 0
    private silenceFrameCount = 0
    private hysteresisFrames: number
    private isReady = false
  
    // ─── Historique RMS pour auto-calibration ────────────────────────────────
    private rmsHistory: number[] = []
    private readonly RMS_HISTORY_SIZE = 50
  
    // ─── Hangover — évite coupures entre mots ────────────────────────────────
    private hangoverFrames: number
    private hangover = 0
  
    constructor(options: VADOptions = {}) {
      this.hysteresisFrames = options.hysteresisFrames ?? 3
      this.hangoverFrames = options.hangoverFrames ?? 5
    }
  
    async init(): Promise<void> {
      this.isReady = true
      console.log('✅ VAD auto-calibré initialisé')
    }
  
    processFrame(frame: Float32Array): {
      isSpeech: boolean
      rms: number
    } {
      if (!this.isReady) {
        return { isSpeech: true, rms: 0 }
      }
  
      // ─── Calcul RMS ──────────────────────────────────────────────────────────
      let sum = 0
      for (let i = 0; i < frame.length; i++) {
        sum += frame[i] * frame[i]
      }
      const rms = Math.sqrt(sum / frame.length)
  
      // ─── Historique adaptatif ─────────────────────────────────────────────────
      this.rmsHistory.push(rms)
      if (this.rmsHistory.length > this.RMS_HISTORY_SIZE) {
        this.rmsHistory.shift()
      }
  
      // ─── Seuils auto-calibrés selon le bruit ambiant ─────────────────────────
      const avgRms = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length
      const speechThreshold = Math.max(avgRms * 0.5, 0.003)
      const silenceThreshold = avgRms * 0.5
  
      // ─── Détection avec hangover ──────────────────────────────────────────────
      if (rms > speechThreshold) {
        this.speechFrameCount++
        this.silenceFrameCount = 0
        if (this.speechFrameCount >= this.hysteresisFrames) {
          this.isSpeaking = true
          this.hangover = this.hangoverFrames
        }
      } else {
        this.speechFrameCount = 0
        if (this.hangover > 0) {
          this.hangover--
          this.isSpeaking = true
        } else if (rms < silenceThreshold) {
          this.silenceFrameCount++
          if (this.silenceFrameCount >= this.hysteresisFrames) {
            this.isSpeaking = false
          }
        }
      }
  
      return { isSpeech: this.isSpeaking, rms }
    }
  
    get speaking(): boolean {
      return this.isSpeaking
    }
  
    destroy() {
      this.isReady = false
      this.rmsHistory = []
      this.hangover = 0
      console.log('🛑 VAD détruit')
    }
  }