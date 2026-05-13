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

  async init() {}

  async start(deviceId: string | null, options: DeepgramOptions) {
    if (this.isRunning) this.stop()

    this.options = options
    this.isRunning = true

    try {
      window.electron.stt.removeListeners()

      // ─── 0. Vérifie si micro disponible ──────────────────────────────────
      const devices = await navigator.mediaDevices.enumerateDevices()
      const mics = devices.filter(d => d.kind === 'audioinput')
      if (mics.length === 0) {
        this.isRunning = false
        options.onError('⚙️ Aucun microphone détecté — branche un micro et réessaie')
        return
      }

      // Si deviceId spécifié mais introuvable → fallback sur défaut
      if (deviceId) {
        const micExists = mics.some(m => m.deviceId === deviceId)
        if (!micExists) {
          this.isRunning = false
          options.onError('⚙️ Microphone introuvable — sélectionne un micro dans les Paramètres')
          return
        }
      }

      // ─── 1. Stream micro ─────────────────────────────────────────────────
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      })

      if (!this.isRunning) {
        this.stream.getTracks().forEach(t => t.stop())
        this.stream = null
        return
      }

      const track = this.stream.getAudioTracks()[0]
      console.log('🎤 Micro:', track.label)

      // ─── 2. Démarre STT main process ─────────────────────────────────────
      await window.electron.stt.start(options.language)

      if (!this.isRunning) {
        await window.electron.stt.stop()
        return
      }

      // ─── 3. Listeners STT ────────────────────────────────────────────────
      window.electron.stt.onTranscript((data) => {
        if (!this.isRunning) return
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

      // ─── 4. AudioContext 16kHz ────────────────────────────────────────────
      this.audioCtx = new AudioContext({ sampleRate: 16000 })

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      // ─── 5. AudioWorklet ─────────────────────────────────────────────────
      const workletUrl = new URL('../worklets/audio-processor.worklet.js', import.meta.url)
      await this.audioCtx.audioWorklet.addModule(workletUrl.href)

      const source = this.audioCtx.createMediaStreamSource(this.stream)
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'audio-processor', {
        processorOptions: { sampleRate: 16000 },
      })

      // ─── 6. Reçoit chunks batchés → Deepgram directement ─────────────────
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

      // ─── 7. Heartbeat ─────────────────────────────────────────────────────
      this.lastChunkTime = Date.now()
      this.heartbeatInterval = setInterval(() => {
        if (!this.isRunning) return
        const elapsed = Date.now() - this.lastChunkTime
        if (elapsed > 5000) {
          console.warn('⚠️ AudioWorklet silencieux depuis', elapsed, 'ms')
          options.onError('⚙️ Micro inactif — vérifie ton microphone dans les Paramètres')
        }
      }, 5000)

      console.log('✅ Pipeline AudioWorklet démarré | SR: 16000')

    } catch (err: any) {
      console.error('❌ Erreur démarrage STT:', err)
      this.isRunning = false
      // ← Messages d'erreur clairs selon le type d'erreur
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        options.onError('⚙️ Microphone introuvable — sélectionne un micro dans les Paramètres')
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        options.onError('🔒 Permission micro refusée — autorise l\'accès au micro')
      } else if (err.name === 'NotReadableError') {
        options.onError('⚙️ Micro déjà utilisé par une autre app — ferme les autres apps')
      } else {
        options.onError('⚙️ Sélectionne un microphone dans les Paramètres')
      }
    }
  }

  stop() {
    this.isRunning = false

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.workletNode) {
      this.workletNode.port.onmessage = null
      this.workletNode.disconnect()
      this.workletNode = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop())
      this.stream = null
    }

    if (this.audioCtx) {
      void this.audioCtx.close()
      this.audioCtx = null
    }

    window.electron.stt.stop()
    window.electron.stt.removeListeners()
    this.options = null

    console.log('🛑 Pipeline AudioWorklet arrêté')
  }
}