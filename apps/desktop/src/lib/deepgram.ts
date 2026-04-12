interface DeepgramOptions {
  language: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: string) => void
}

export class DeepgramSTT {
  private audioCtx: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private stream: MediaStream | null = null
  private options: DeepgramOptions | null = null
  private isRunning = false

  async init() {
    // Clé gérée dans electron/sttService.ts
  }

  async start(deviceId: string | null, options: DeepgramOptions) {
    if (this.isRunning) {
      this.stop()
    }

    this.options = options
    this.isRunning = true

    try {
      window.electron.stt.removeListeners()

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      })

      if (!this.isRunning) {
        this.stream.getTracks().forEach((t) => t.stop())
        this.stream = null
        return
      }

      const track = this.stream.getAudioTracks()[0]
      console.log('🎤 Micro utilisé:', track?.label, '| DeviceId:', deviceId)

      await window.electron.stt.start(options.language)

      if (!this.isRunning) {
        await window.electron.stt.stop()
        return
      }

      window.electron.stt.onTranscript((data) => {
        if (!this.isRunning) return
        console.log('📝 Transcript reçu:', data.text)
        options.onTranscript(data.text, data.isFinal)
      })

      window.electron.stt.onState((state) => {
        if (!this.isRunning) return
        console.log('STT state:', state)
      })

      window.electron.stt.onError((error) => {
        if (!this.isRunning) return
        options.onError(error)
      })

      this.audioCtx = new AudioContext({ sampleRate: 16000 })

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      const source = this.audioCtx.createMediaStreamSource(this.stream)
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1)

      source.connect(this.processor)
      this.processor.connect(this.audioCtx.destination)

      this.processor.onaudioprocess = (e) => {
        if (!this.isRunning) return

        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)

        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]))
          int16[i] = s < 0 ? s * 32768 : s * 32767
        }

        window.electron.stt.sendChunk(int16.buffer)
      }

      console.log('✅ Pipeline audio linear16 démarré')
    } catch (err) {
      console.error('Erreur démarrage STT:', err)

      this.isRunning = false
      options.onError('Impossible de démarrer la transcription')
    }
  }

  stop() {
    this.isRunning = false

    if (this.processor) {
      this.processor.onaudioprocess = null
      this.processor.disconnect()
      this.processor = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }

    if (this.audioCtx) {
      void this.audioCtx.close()
      this.audioCtx = null
    }

    window.electron.stt.stop()
    window.electron.stt.removeListeners()

    this.options = null
  }
}