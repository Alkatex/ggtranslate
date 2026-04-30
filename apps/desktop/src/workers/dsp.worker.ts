import { applyVoiceEffect } from '../lib/voiceEffects'

self.onmessage = async (event) => {
  const { id, audioData, numberOfChannels, sampleRate, effectId } = event.data

  try {
    // Reconstruire AudioBuffer depuis les données transférées
    const offlineCtx = new OfflineAudioContext(
      numberOfChannels,
      audioData[0].length,
      sampleRate
    )

    const inputBuffer = offlineCtx.createBuffer(
      numberOfChannels,
      audioData[0].length,
      sampleRate
    )

    for (let ch = 0; ch < numberOfChannels; ch++) {
      inputBuffer.copyToChannel(new Float32Array(audioData[ch]), ch)
    }

    // Appliquer l'effet DSP
    const outputBuffer = await applyVoiceEffect(inputBuffer, effectId)

    // Extraire les données pour transfert
    const outputData: Float32Array[] = []
    for (let ch = 0; ch < outputBuffer.numberOfChannels; ch++) {
      outputData.push(outputBuffer.getChannelData(ch).slice())
    }

    self.postMessage({
      id,
      success: true,
      outputData,
      numberOfChannels: outputBuffer.numberOfChannels,
      sampleRate: outputBuffer.sampleRate,
      length: outputBuffer.length,
    }, outputData.map(d => d.buffer) as any)

  } catch (err: any) {
    self.postMessage({ id, success: false, error: err.message })
  }
}