class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super()
      this.buffer = []
      this.frameCount = 0
      this.gain = 1.2
      this.BATCH_SIZE = 3 // ~20-40ms à 16kHz avec 256 samples
    }
  
    process(inputs) {
      const input = inputs[0]
      if (!input || !input[0]) return true
  
      const channelData = input[0]
      const pcm = new Int16Array(channelData.length)
  
      for (let i = 0; i < channelData.length; i++) {
        // Gain control
        let s = channelData[i] * this.gain
        // Clip protection
        s = Math.max(-1, Math.min(1, s))
        // Float32 → Int16
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
  
      this.buffer.push(pcm)
      this.frameCount++
  
      // Batch send toutes les 3 frames (~20-40ms)
      if (this.buffer.length >= this.BATCH_SIZE) {
        // Merge tous les buffers en un seul Int16Array
        const totalLength = this.buffer.reduce((acc, b) => acc + b.length, 0)
        const merged = new Int16Array(totalLength)
        let offset = 0
        for (const chunk of this.buffer) {
          merged.set(chunk, offset)
          offset += chunk.length
        }
        this.port.postMessage({ type: 'audio', pcm: merged.buffer }, [merged.buffer])
        this.buffer = []
      }
  
      return true
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor)