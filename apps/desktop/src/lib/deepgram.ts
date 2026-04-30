interface DeepgramOptions {
  language: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: string) => void
}

export class DeepgramSTT {
  private audioCtx: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private stream: MediaStream | null = null
  private options: DeepgramOptions | null = null
  private isRunning = false
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private lastChunkTime = 0

  async init() {
    // Clé gérée dans electron/sttService.ts
  }

  async start(deviceId: string | null, options: DeepgramOptions) {
    if (this.isRunning) this.stop()

    this.options = options
    this.isRunning = true

    try {
      window.electron.stt.removeListeners()

      // ─── 1. Récupère le stream micro ────────────────────────────────────────
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          // NE PAS forcer sampleRate ici — on laisse le device décider
          // pour éviter le mismatch 44.1kHz/48kHz
        },
      })

      if (!this.isRunning) {
        this.stream.getTracks().forEach(t => t.stop())
        this.stream = null
        return
      }

      const track = this.stream.getAudioTracks()[0]
      const settings = track.getSettings()
      const nativeSampleRate = settings.sampleRate || 48000
      console.log('🎤 Micro:', track.label, '| Sample rate natif:', nativeSampleRate)

      // ─── 2. Démarre STT côté main process ────────────────────────────────────
      await window.electron.stt.start(options.language)

      if (!this.isRunning) {
        await window.electron.stt.stop()
        return
      }

      // ─── 3. Listeners STT ────────────────────────────────────────────────────
      window.electron.stt.onTranscript((data) => {
        if (!this.isRunning) return
        console.log('📝 Transcript:', data.text, '| Final:', data.isFinal)
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

      // ─── 4. AudioContext avec sample rate natif du device ────────────────────
      this.audioCtx = new AudioContext({ sampleRate: 16000 })

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      // ─── 5. Charge l'AudioWorklet ────────────────────────────────────────────
      await this.audioCtx.audioWorklet.addModule(
        new URL('../worklets/audio-processor.worklet.js', import.meta.url)
      )

      const source = this.audioCtx.createMediaStreamSource(this.stream)
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'audio-processor', {
        processorOptions: {
          sampleRate: nativeSampleRate,
        },
      })

      // ─── 6. Reçoit les chunks batchés du worklet ─────────────────────────────
      this.workletNode.port.onmessage = (event) => {
        if (!this.isRunning) return
        if (event.data.type === 'audio') {
          this.lastChunkTime = Date.now()
          window.electron.stt.sendChunk(event.data.pcm)
        }
        if (event.data.type === 'error') {
          console.error('❌ AudioWorklet error:', event.data.message)
          options.onError('Erreur AudioWorklet: ' + event.data.message)
        }
      }

      source.connect(this.workletNode)
      // NE PAS connecter au destination — évite feedback loop
      // this.workletNode.connect(this.audioCtx.destination)

      // ─── 7. Heartbeat — détecte crash silencieux worklet ─────────────────────
      this.lastChunkTime = Date.now()
      this.heartbeatInterval = setInterval(() => {
        if (!this.isRunning) return
        const elapsed = Date.now() - this.lastChunkTime
        if (elapsed > 5000) {
          console.warn('⚠️ AudioWorklet silencieux depuis', elapsed, 'ms — restart')
          options.onError('Micro inactif détecté — redémarre la session')
        }
      }, 5000)

      console.log('✅ Pipeline AudioWorklet démarré | SR:', nativeSampleRate)

    } catch (err: any) {
      console.error('❌ Erreur démarrage STT:', err)
      this.isRunning = false
      options.onError('Impossible de démarrer la transcription: ' + err.message)
    }
  }

  stop() {
    this.isRunning = false

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Disconnect worklet proprement
    if (this.workletNode) {
      this.workletNode.port.onmessage = null
      this.workletNode.disconnect()
      this.workletNode = null
    }

    // Stop stream
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop())
      this.stream = null
    }

    // Close AudioContext
    if (this.audioCtx) {
      void this.audioCtx.close()
      this.audioCtx = null
    }

    window.electron.stt.stop()
    window.electron.stt.removeListeners()
    this.options = null

    console.log('🛑 Pipeline AudioWorklet arrêté proprement')
  }
}