interface VADOptions {
    speechThreshold?: number
    silenceThreshold?: number
    hysteresisFrames?: number
  }
  
  export class VAD {
    private isSpeaking = false
    private speechFrameCount = 0
    private silenceFrameCount = 0
    private speechThreshold: number
    private silenceThreshold: number
    private hysteresisFrames: number
    private isReady = false
  
    // Historique RMS pour normalisation adaptative
    private rmsHistory: number[] = []
    private readonly RMS_HISTORY_SIZE = 30
  
    constructor(options: VADOptions = {}) {
      this.speechThreshold = options.speechThreshold ?? 0.015
      this.silenceThreshold = options.silenceThreshold ?? 0.008
      this.hysteresisFrames = options.hysteresisFrames ?? 8
    }
  
    async init(): Promise<void> {
      this.isReady = true
      console.log('✅ VAD energy-based initialisé')
    }
  
    processFrame(frame: Float32Array): {
      isSpeech: boolean
      probability: number
      denoisedFrame: Float32Array
    } {
      if (!this.isReady) {
        return { isSpeech: true, probability: 1.0, denoisedFrame: frame }
      }
  
      // ─── Calcul RMS (Root Mean Square) ────────────────────────────────────────
      let sum = 0
      for (let i = 0; i < frame.length; i++) {
        sum += frame[i] * frame[i]
      }
      const rms = Math.sqrt(sum / frame.length)
  
      // ─── Historique adaptatif ──────────────────────────────────────────────────
      this.rmsHistory.push(rms)
      if (this.rmsHistory.length > this.RMS_HISTORY_SIZE) {
        this.rmsHistory.shift()
      }
  
      // Probabilité de parole basée sur RMS
      const probability = Math.min(1.0, rms / (this.speechThreshold * 2))
  
      // ─── Hysteresis ────────────────────────────────────────────────────────────
      if (rms > this.speechThreshold) {
        this.speechFrameCount++
        this.silenceFrameCount = 0
        if (this.speechFrameCount >= this.hysteresisFrames) {
          this.isSpeaking = true
        }
      } else if (rms < this.silenceThreshold) {
        this.silenceFrameCount++
        this.speechFrameCount = 0
        if (this.silenceFrameCount >= this.hysteresisFrames) {
          this.isSpeaking = false
        }
      }
  
      return {
        isSpeech: this.isSpeaking,
        probability,
        denoisedFrame: frame,
      }
    }
  
    get speaking(): boolean {
      return this.isSpeaking
    }
  
    destroy() {
      this.isReady = false
      this.rmsHistory = []
      console.log('🛑 VAD détruit')
    }
  }