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

  async init() {
    // Clé gérée dans electron/sttService.ts
  }

  async start(deviceId: string | null, options: DeepgramOptions) {
    this.options = options

    try {
      // 1. Capturer le micro
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      })

      const track = this.stream.getAudioTracks()[0]
      console.log('🎤 Micro utilisé:', track.label, '| DeviceId:', deviceId)

      // 2. Démarrer session STT dans Electron main
      await window.electron.stt.start(options.language)

      // 3. Écouter les événements depuis Electron main
      window.electron.stt.onTranscript((data) => {
        console.log('📝 Transcript reçu:', data.text)
        options.onTranscript(data.text, data.isFinal)
      })

      window.electron.stt.onState((state) => {
        console.log('STT state:', state)
      })

      window.electron.stt.onError((error) => {
        options.onError(error)
      })

      // 4. Créer AudioContext pour produire du linear16
      this.audioCtx = new AudioContext({ sampleRate: 16000 })
      const source = this.audioCtx.createMediaStreamSource(this.stream)
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1)

      source.connect(this.processor)
      this.processor.connect(this.audioCtx.destination)

      // 5. Convertir float32 → int16 et envoyer à Electron
      this.processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
        }
        window.electron.stt.sendChunk(int16.buffer)
      }

      console.log('✅ Pipeline audio linear16 démarré')

    } catch (err) {
      console.error('Erreur démarrage STT:', err)
      options.onError('Impossible de démarrer la transcription')
    }
  }

  stop() {
    this.processor?.disconnect()
    this.audioCtx?.close()
    this.stream?.getTracks().forEach(t => t.stop())
    window.electron.stt.stop()
    window.electron.stt.removeListeners()
    this.processor = null
    this.audioCtx = null
    this.stream = null
    this.options = null
  }
}