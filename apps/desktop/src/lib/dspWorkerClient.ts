let worker: Worker | null = null
let pendingRequests = new Map<string, {
  resolve: (buffer: AudioBuffer) => void
  reject: (err: Error) => void
}>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/dsp.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (event) => {
      const { id, success, outputData, numberOfChannels, sampleRate, length, error } = event.data
      const pending = pendingRequests.get(id)
      if (!pending) return
      pendingRequests.delete(id)

      if (!success) {
        pending.reject(new Error(error))
        return
      }

      // Reconstruire AudioBuffer
      const ctx = new OfflineAudioContext(numberOfChannels, length, sampleRate)
      const buffer = ctx.createBuffer(numberOfChannels, length, sampleRate)
      for (let ch = 0; ch < numberOfChannels; ch++) {
        buffer.copyToChannel(new Float32Array(outputData[ch]), ch)
      }
      pending.resolve(buffer)
    }

    worker.onerror = (err) => {
      console.error('❌ DSP Worker error:', err)
      for (const [, pending] of pendingRequests) {
        pending.reject(new Error('DSP Worker crash'))
      }
      pendingRequests.clear()
      worker = null
    }
  }
  return worker
}

export async function applyVoiceEffectWorker(
  audioBuffer: AudioBuffer,
  effectId: string
): Promise<AudioBuffer> {
  if (effectId === 'normal') return audioBuffer

  const id = `${Date.now()}-${Math.random()}`
  const w = getWorker()

  // Extraire données pour transfert
  const audioData: Float32Array[] = []
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    audioData.push(audioBuffer.getChannelData(ch).slice())
  }

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject })

    w.postMessage({
      id,
      audioData,
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      effectId,
    }, audioData.map(d => d.buffer))
  })
}

export function terminateDSPWorker() {
  if (worker) {
    worker.terminate()
    worker = null
    pendingRequests.clear()
  }
}