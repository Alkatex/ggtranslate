import { SoundTouch, SimpleFilter } from 'soundtouchjs'

export interface VoiceEffect {
  id: string
  name: string
  emoji: string
  category: string
  plan: 'starter' | 'pro'
}

export const VOICE_EFFECTS: VoiceEffect[] = [
  { id: 'normal', name: 'Normal', emoji: '🎤', category: 'Base', plan: 'starter' },
  { id: 'robot', name: 'Robot', emoji: '🤖', category: 'Robots & Tech', plan: 'starter' },
  { id: 'deep', name: 'Deep', emoji: '🔊', category: 'Modifications', plan: 'starter' },
  { id: 'chipmunk', name: 'Chipmunk', emoji: '🐿️', category: 'Modifications', plan: 'starter' },
  { id: 'echo', name: 'Echo', emoji: '🔁', category: 'Ambiances', plan: 'starter' },
  { id: 'radio', name: 'Radio', emoji: '📻', category: 'Robots & Tech', plan: 'starter' },
  { id: 'telephone', name: 'Téléphone', emoji: '📞', category: 'Robots & Tech', plan: 'starter' },
  { id: 'whisper', name: 'Whisper', emoji: '🤫', category: 'Ambiances', plan: 'starter' },
  { id: 'megaphone', name: 'Mégaphone', emoji: '📢', category: 'Ambiances', plan: 'starter' },
  { id: 'underwater', name: 'Underwater', emoji: '🌊', category: 'Ambiances', plan: 'starter' },
  { id: 'demon', name: 'Demon', emoji: '👹', category: 'Créatures', plan: 'pro' },
  { id: 'angel', name: 'Angel', emoji: '👼', category: 'Créatures', plan: 'pro' },
  { id: 'orc', name: 'Orc', emoji: '👺', category: 'Créatures', plan: 'pro' },
  { id: 'ghost', name: 'Ghost', emoji: '👻', category: 'Créatures', plan: 'pro' },
  { id: 'alien', name: 'Alien', emoji: '👽', category: 'Créatures', plan: 'pro' },
  { id: 'vampire', name: 'Vampire', emoji: '🧛', category: 'Créatures', plan: 'pro' },
  { id: 'giant', name: 'Giant', emoji: '🗿', category: 'Créatures', plan: 'pro' },
  { id: 'elf', name: 'Elf', emoji: '🧝', category: 'Créatures', plan: 'pro' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', category: 'Créatures', plan: 'pro' },
  { id: 'goblin', name: 'Goblin', emoji: '🧌', category: 'Créatures', plan: 'pro' },
  { id: 'cyborg', name: 'Cyborg', emoji: '🦾', category: 'Robots & Tech', plan: 'pro' },
  { id: 'android', name: 'Android', emoji: '🤖', category: 'Robots & Tech', plan: 'pro' },
  { id: 'glitch', name: 'Glitch', emoji: '⚡', category: 'Robots & Tech', plan: 'pro' },
  { id: 'walkie', name: 'Walkie-Talkie', emoji: '📡', category: 'Robots & Tech', plan: 'pro' },
  { id: '8bit', name: '8-Bit', emoji: '🎮', category: 'Robots & Tech', plan: 'pro' },
  { id: 'synthwave', name: 'Synthwave', emoji: '🌃', category: 'Robots & Tech', plan: 'pro' },
  { id: 'buzz', name: 'Buzz', emoji: '⚡', category: 'Robots & Tech', plan: 'pro' },
  { id: 'jarvis', name: 'JARVIS', emoji: '🧠', category: 'Pop Culture', plan: 'pro' },
  { id: 'terminator', name: 'Terminator', emoji: '💀', category: 'Pop Culture', plan: 'pro' },
  { id: 'minion', name: 'Minion', emoji: '🟡', category: 'Pop Culture', plan: 'pro' },
  { id: 'helium', name: 'Helium', emoji: '🎈', category: 'Pop Culture', plan: 'pro' },
  { id: 'drunk', name: 'Drunk', emoji: '🍺', category: 'Pop Culture', plan: 'pro' },
  { id: 'cave', name: 'Cave Echo', emoji: '🪨', category: 'Ambiances', plan: 'pro' },
  { id: 'stadium', name: 'Stadium', emoji: '🏟️', category: 'Ambiances', plan: 'pro' },
  { id: 'church', name: 'Church', emoji: '⛪', category: 'Ambiances', plan: 'pro' },
  { id: 'tunnel', name: 'Tunnel', emoji: '🚇', category: 'Ambiances', plan: 'pro' },
  { id: 'space', name: 'Space', emoji: '🚀', category: 'Ambiances', plan: 'pro' },
  { id: 'forest', name: 'Forest', emoji: '🌲', category: 'Ambiances', plan: 'pro' },
  { id: 'intercom', name: 'Intercom', emoji: '🔔', category: 'Ambiances', plan: 'pro' },
  { id: 'pitch_up1', name: 'Pitch +1', emoji: '⬆️', category: 'Pitch', plan: 'pro' },
  { id: 'pitch_up2', name: 'Pitch +2', emoji: '⬆️', category: 'Pitch', plan: 'pro' },
  { id: 'pitch_down1', name: 'Pitch -1', emoji: '⬇️', category: 'Pitch', plan: 'pro' },
  { id: 'pitch_down2', name: 'Pitch -2', emoji: '⬇️', category: 'Pitch', plan: 'pro' },
  { id: 'speed_up', name: 'Speed Up', emoji: '⏩', category: 'Pitch', plan: 'pro' },
  { id: 'slow_down', name: 'Slow Down', emoji: '⏪', category: 'Pitch', plan: 'pro' },
  { id: 'tremolo', name: 'Tremolo', emoji: '〰️', category: 'Pitch', plan: 'pro' },
  { id: 'vibrato', name: 'Vibrato', emoji: '🎵', category: 'Pitch', plan: 'pro' },
  { id: 'flanger', name: 'Flanger', emoji: '🎸', category: 'Pitch', plan: 'pro' },
  { id: 'reverse_echo', name: 'Reverse Echo', emoji: '🔄', category: 'Pitch', plan: 'pro' },
]

export function getAvailableEffects(plan: 'free' | 'starter' | 'pro' | 'trial'): VoiceEffect[] {
  if (plan === 'pro' || plan === 'trial') return VOICE_EFFECTS
  if (plan === 'starter') return VOICE_EFFECTS.filter(e => e.plan === 'starter')
  return VOICE_EFFECTS.filter(e => e.id === 'normal')
}

// ─── BASELINE VOICE CHAIN ────────────────────────────────────────────────────
// HPF 80Hz + De-esser + Compression + Limiter
// Appliqué à tous les effets pour cohérence pro
async function applyBaselineChain(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  // HPF 80Hz — supprime rumble de fond
  const hpf = offlineCtx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 80
  hpf.Q.value = 0.7

  // De-esser — atténue sibilance 6kHz
  const deesser = offlineCtx.createBiquadFilter()
  deesser.type = 'peaking'
  deesser.frequency.value = 6000
  deesser.gain.value = -4
  deesser.Q.value = 2.0

  // Compression stable
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 3
  comp.attack.value = 0.003
  comp.release.value = 0.2
  comp.knee.value = 6

  // Limiter -1dB
  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05
  limiter.knee.value = 0

  source.connect(hpf)
  hpf.connect(deesser)
  deesser.connect(comp)
  comp.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── SOUNDTOUCH ───────────────────────────────────────────────────────────────
async function applySoundTouch(
  buffer: AudioBuffer,
  semitones: number,
  formantShift: number = 0
): Promise<AudioBuffer> {
  try {
    const soundTouch = new SoundTouch(buffer.sampleRate)
    soundTouch.pitch = Math.pow(2, semitones / 12)
    soundTouch.tempo = 1.0

    if (formantShift !== 0) {
      const formantFactor = Math.pow(2, formantShift * 3 / 12)
      soundTouch.pitch = soundTouch.pitch * formantFactor
      soundTouch.tempo = formantFactor
    }

    const channels = buffer.numberOfChannels
    const length = buffer.length
    const inputData = new Float32Array(length * channels)

    for (let c = 0; c < channels; c++) {
      const channelData = buffer.getChannelData(c)
      for (let i = 0; i < length; i++) {
        inputData[i * channels + c] = channelData[i]
      }
    }

    let inputOffset = 0
    const filter = new SimpleFilter(
      {
        extract: (target: Float32Array, numFrames: number) => {
          const available = Math.floor((inputData.length - inputOffset) / channels)
          const toExtract = Math.min(numFrames, available)
          if (toExtract <= 0) return 0
          for (let i = 0; i < toExtract * channels; i++) {
            target[i] = inputData[inputOffset + i] || 0
          }
          inputOffset += toExtract * channels
          return toExtract
        }
      },
      soundTouch
    )

    const outputData = new Float32Array(length * channels)
    let offset = 0
    const bufSize = 4096

    while (offset < outputData.length) {
      const remaining = outputData.length - offset
      const toProcess = Math.min(bufSize * channels, remaining)
      const chunk = new Float32Array(toProcess)
      const framesReceived = filter.extract(chunk, toProcess / channels)
      if (framesReceived === 0) break
      for (let i = 0; i < framesReceived * channels; i++) {
        outputData[offset + i] = chunk[i]
      }
      offset += framesReceived * channels
    }

    const ctx = new OfflineAudioContext(channels, length, buffer.sampleRate)
    const outBuffer = ctx.createBuffer(channels, length, buffer.sampleRate)
    for (let c = 0; c < channels; c++) {
      const channelData = outBuffer.getChannelData(c)
      for (let i = 0; i < length; i++) {
        channelData[i] = outputData[i * channels + c] || 0
      }
    }
    return outBuffer
  } catch {
    return applyPitchShiftBasic(buffer, Math.pow(2, semitones / 12))
  }
}

// ─── UTILITAIRES DSP ─────────────────────────────────────────────────────────
async function applyPitchShiftBasic(buffer: AudioBuffer, rate: number): Promise<AudioBuffer> {
  const length = Math.max(1, Math.floor(buffer.length / rate))
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  source.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyReverb(
  buffer: AudioBuffer,
  duration: number,
  decay: number,
  wet: number = 0.5,
  preDelay: number = 0
): Promise<AudioBuffer> {
  const extraSamples = Math.floor((duration + preDelay) * buffer.sampleRate)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length + extraSamples,
    buffer.sampleRate
  )

  const impulseLength = Math.max(1, Math.floor(duration * buffer.sampleRate))
  const impulse = offlineCtx.createBuffer(2, impulseLength, buffer.sampleRate)
  for (let c = 0; c < 2; c++) {
    const channelData = impulse.getChannelData(c)
    for (let i = 0; i < impulseLength; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, decay * 3)
    }
  }

  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 1 - wet * 0.5
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = wet

  // Pre-delay
  const preDelayNode = offlineCtx.createDelay(Math.max(preDelay, 0.001))
  preDelayNode.delayTime.value = preDelay

  source.connect(dryGain)
  source.connect(preDelayNode)
  preDelayNode.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(offlineCtx.destination)
  wetGain.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── 🤖 ROBOT — Ring modulation + bandpass + intelligibilité ─────────────────
async function applyRobotEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  // Ring modulation manuelle (carrier sinusoïdal 100Hz)
  const ringModBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  const carrierFreq = 100
  for (let c = 0; c < channels; c++) {
    const input = buffer.getChannelData(c)
    const output = ringModBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      const carrier = Math.sin(2 * Math.PI * carrierFreq * i / sampleRate)
      output[i] = input[i] * carrier
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = ringModBuffer

  // HPF 80Hz baseline
  const hpf = offlineCtx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 80

  // Bandpass 300Hz–3kHz pour intelligibilité
  const bp = offlineCtx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1200
  bp.Q.value = 0.8

  // Boost métal 3kHz
  const peak = offlineCtx.createBiquadFilter()
  peak.type = 'peaking'
  peak.frequency.value = 3000
  peak.gain.value = 5
  peak.Q.value = 2

  // Compression forte
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -15
  comp.ratio.value = 8
  comp.attack.value = 0.001
  comp.release.value = 0.1

  // Limiter
  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hpf)
  hpf.connect(bp)
  bp.connect(peak)
  peak.connect(comp)
  comp.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── 👹 DEMON — Sub harmonics + growl LFO + saturation multi-layer ───────────
async function applyDemonEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, -12, -0.7)
  const sampleRate = pitched.sampleRate
  const length = pitched.length
  const channels = pitched.numberOfChannels

  // Sub harmonics — octave en dessous
  const subBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  for (let c = 0; c < channels; c++) {
    const input = pitched.getChannelData(c)
    const output = subBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      // Mix dry + sub harmonique (pitch /2)
      const subIdx = Math.floor(i / 2)
      const sub = subIdx < length ? input[subIdx] * 0.4 : 0
      output[i] = input[i] * 0.7 + sub
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length + Math.floor(sampleRate * 0.8), sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = subBuffer

  // EQ — boost graves + cut médiums
  const lowBoost = offlineCtx.createBiquadFilter()
  lowBoost.type = 'lowshelf'
  lowBoost.frequency.value = 120
  lowBoost.gain.value = 9

  const midCut = offlineCtx.createBiquadFilter()
  midCut.type = 'peaking'
  midCut.frequency.value = 2500
  midCut.gain.value = -6
  midCut.Q.value = 1

  // Growl LFO (amplitude modulation lente)
  const growlGain = offlineCtx.createGain()
  growlGain.gain.value = 0.85
  const growlLFO = offlineCtx.createOscillator()
  growlLFO.frequency.value = 3.5
  const growlLFOGain = offlineCtx.createGain()
  growlLFOGain.gain.value = 0.12
  growlLFO.connect(growlLFOGain)
  growlLFOGain.connect(growlGain.gain)

  // Saturation multi-layer
  const distortion = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 3) * 0.7 + Math.sign(x) * Math.pow(Math.abs(x), 0.6) * 0.3
  }
  distortion.curve = curve
  distortion.oversample = '4x'

  // Compression
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.ratio.value = 6
  comp.attack.value = 0.003
  comp.release.value = 0.15

  // Reverb sombre
  const impulseLength = Math.floor(sampleRate * 0.8)
  const impulse = offlineCtx.createBuffer(2, impulseLength, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < impulseLength; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 4)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.8
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.2

  // Limiter
  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(lowBoost)
  lowBoost.connect(midCut)
  midCut.connect(growlGain)
  growlGain.connect(distortion)
  distortion.connect(comp)
  comp.connect(dryGain)
  comp.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)

  growlLFO.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── 🐉 DRAGON — Massif + dark reverb + delay ────────────────────────────────
async function applyDragonEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, -14, -0.8)
  const sampleRate = pitched.sampleRate
  const length = pitched.length
  const channels = pitched.numberOfChannels

  // Sub harmonics massifs
  const subBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  for (let c = 0; c < channels; c++) {
    const input = pitched.getChannelData(c)
    const output = subBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      const subIdx = Math.floor(i / 2)
      const sub = subIdx < length ? input[subIdx] * 0.5 : 0
      output[i] = input[i] * 0.6 + sub
    }
  }

  const reverbLen = Math.floor(sampleRate * 2.5)
  const offlineCtx = new OfflineAudioContext(channels, length + reverbLen, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = subBuffer

  // EQ très graves + cut hauts
  const lowBoost = offlineCtx.createBiquadFilter()
  lowBoost.type = 'lowshelf'
  lowBoost.frequency.value = 100
  lowBoost.gain.value = 12

  const midBoost = offlineCtx.createBiquadFilter()
  midBoost.type = 'peaking'
  midBoost.frequency.value = 280
  midBoost.gain.value = 6
  midBoost.Q.value = 0.7

  const highCut = offlineCtx.createBiquadFilter()
  highCut.type = 'highshelf'
  highCut.frequency.value = 2500
  highCut.gain.value = -10

  // Saturation massive
  const distortion = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 5)
  }
  distortion.curve = curve
  distortion.oversample = '4x'

  // Compression agressive
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -10
  comp.ratio.value = 10
  comp.attack.value = 0.001
  comp.release.value = 0.1

  // Reverb longue + sombre
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 6)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.7
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.35

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(lowBoost)
  lowBoost.connect(midBoost)
  midBoost.connect(highCut)
  highCut.connect(distortion)
  distortion.connect(comp)
  comp.connect(dryGain)
  comp.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── 👻 GHOST — Shimmer reverb + stereo wide + éthéré ────────────────────────
async function applyGhostEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, -4, -0.2)
  const sampleRate = pitched.sampleRate
  const reverbLen = Math.floor(sampleRate * 2.5)
  const offlineCtx = new OfflineAudioContext(
    pitched.numberOfChannels,
    pitched.length + reverbLen,
    sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  // HPF léger
  const hpf = offlineCtx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 120

  // Shimmer — pitch shift dans la reverb
  const shimmerGain = offlineCtx.createGain()
  shimmerGain.gain.value = 0.3

  // Reverb longue
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 8)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  // Chorus léger pour shimmer
  const chorusDelay = offlineCtx.createDelay(0.05)
  chorusDelay.delayTime.value = 0.03
  const chorusLFO = offlineCtx.createOscillator()
  chorusLFO.frequency.value = 0.5
  const chorusLFOGain = offlineCtx.createGain()
  chorusLFOGain.gain.value = 0.008
  chorusLFO.connect(chorusLFOGain)
  chorusLFOGain.connect(chorusDelay.delayTime)

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.5
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.6

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hpf)
  hpf.connect(dryGain)
  hpf.connect(chorusDelay)
  chorusDelay.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)

  chorusLFO.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── 👼 ANGEL — Air boost + shimmer + reverb douce ───────────────────────────
async function applyAngelEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 9, 0.5)
  const sampleRate = pitched.sampleRate
  const reverbLen = Math.floor(sampleRate * 2.2)
  const offlineCtx = new OfflineAudioContext(
    pitched.numberOfChannels,
    pitched.length + reverbLen,
    sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  // HPF baseline
  const hpf = offlineCtx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 100

  // Air boost 10kHz
  const airBoost = offlineCtx.createBiquadFilter()
  airBoost.type = 'highshelf'
  airBoost.frequency.value = 10000
  airBoost.gain.value = 5

  // De-esser
  const deesser = offlineCtx.createBiquadFilter()
  deesser.type = 'peaking'
  deesser.frequency.value = 7000
  deesser.gain.value = -3
  deesser.Q.value = 2

  // Compression douce
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 2.5
  comp.attack.value = 0.01
  comp.release.value = 0.3

  // Chorus shimmer
  const chorusDelay = offlineCtx.createDelay(0.05)
  chorusDelay.delayTime.value = 0.025
  const chorusLFO = offlineCtx.createOscillator()
  chorusLFO.frequency.value = 0.8
  const chorusLFOGain = offlineCtx.createGain()
  chorusLFOGain.gain.value = 0.006
  chorusLFO.connect(chorusLFOGain)
  chorusLFOGain.connect(chorusDelay.delayTime)

  // Reverb longue
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 10)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.6
  const chorusWet = offlineCtx.createGain()
  chorusWet.gain.value = 0.25
  const reverbWet = offlineCtx.createGain()
  reverbWet.gain.value = 0.45

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hpf)
  hpf.connect(airBoost)
  airBoost.connect(deesser)
  deesser.connect(comp)
  comp.connect(dryGain)
  comp.connect(chorusDelay)
  chorusDelay.connect(chorusWet)
  comp.connect(convolver)
  convolver.connect(reverbWet)
  dryGain.connect(limiter)
  chorusWet.connect(limiter)
  reverbWet.connect(limiter)
  limiter.connect(offlineCtx.destination)

  chorusLFO.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── 🌊 UNDERWATER — LFO filter + phaser + reverb courte ─────────────────────
async function applyUnderwaterEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  // Filtre mouvant manuel (LFO sur cutoff)
  const filteredBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  const lfoRate = 1.5
  const baseFreq = 400
  const lfoDepth = 250

  for (let c = 0; c < channels; c++) {
    const input = buffer.getChannelData(c)
    const output = filteredBuffer.getChannelData(c)
    let prevSample = 0
    for (let i = 0; i < length; i++) {
      const lfo = Math.sin(2 * Math.PI * lfoRate * i / sampleRate)
      const cutoff = (baseFreq + lfo * lfoDepth) / sampleRate
      const alpha = Math.min(1, Math.max(0, cutoff * 2 * Math.PI))
      prevSample = prevSample + alpha * (input[i] - prevSample)
      output[i] = prevSample
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length + Math.floor(sampleRate * 0.3), sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = filteredBuffer

  // Double lowpass pour immersion
  const lp1 = offlineCtx.createBiquadFilter()
  lp1.type = 'lowpass'
  lp1.frequency.value = 600
  lp1.Q.value = 4

  const lp2 = offlineCtx.createBiquadFilter()
  lp2.type = 'lowpass'
  lp2.frequency.value = 400
  lp2.Q.value = 6

  // Chorus lent pour sensation liquide
  const chorusDelay = offlineCtx.createDelay(0.05)
  chorusDelay.delayTime.value = 0.02
  const chorusLFO = offlineCtx.createOscillator()
  chorusLFO.frequency.value = 0.3
  const chorusLFOGain = offlineCtx.createGain()
  chorusLFOGain.gain.value = 0.01
  chorusLFO.connect(chorusLFOGain)
  chorusLFOGain.connect(chorusDelay.delayTime)

  // Reverb courte
  const impulseLen = Math.floor(sampleRate * 0.3)
  const impulse = offlineCtx.createBuffer(2, impulseLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < impulseLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLen, 2)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.6
  const chorusWet = offlineCtx.createGain()
  chorusWet.gain.value = 0.3
  const reverbWet = offlineCtx.createGain()
  reverbWet.gain.value = 0.25

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(lp1)
  lp1.connect(lp2)
  lp2.connect(dryGain)
  lp2.connect(chorusDelay)
  chorusDelay.connect(chorusWet)
  lp2.connect(convolver)
  convolver.connect(reverbWet)
  dryGain.connect(limiter)
  chorusWet.connect(limiter)
  reverbWet.connect(limiter)
  limiter.connect(offlineCtx.destination)

  chorusLFO.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── 📻 RADIO PRO — Bandpass + noise + saturation analogique ─────────────────
async function applyRadioEffect(
  buffer: AudioBuffer,
  hpFreq: number,
  lpFreq: number,
  addNoise: boolean = true
): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  // Ajouter bruit de fond léger (crackle radio)
  let inputBuffer = buffer
  if (addNoise) {
    const noisyBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
    for (let c = 0; c < channels; c++) {
      const input = buffer.getChannelData(c)
      const output = noisyBuffer.getChannelData(c)
      for (let i = 0; i < length; i++) {
        const noise = (Math.random() * 2 - 1) * 0.015
        output[i] = input[i] + noise
      }
    }
    inputBuffer = noisyBuffer
  }

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = inputBuffer

  // Bandpass dynamique
  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = hpFreq
  hp.Q.value = 1.5

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lpFreq
  lp.Q.value = 1.5

  // Boost mid presence radio
  const midBoost = offlineCtx.createBiquadFilter()
  midBoost.type = 'peaking'
  midBoost.frequency.value = 1800
  midBoost.gain.value = 4
  midBoost.Q.value = 1

  // Saturation analogique légère
  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 2.5) * 0.8
  }
  waveshaper.curve = curve

  // Compression forte radio style
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.ratio.value = 8
  comp.attack.value = 0.001
  comp.release.value = 0.08
  comp.knee.value = 2

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hp)
  hp.connect(lp)
  lp.connect(midBoost)
  midBoost.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── 🍺 DRUNK — Pitch wobble + jitter + chorus instable ──────────────────────
async function applyDrunkEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  // Pitch wobble aléatoire
  const wobbleBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  for (let c = 0; c < channels; c++) {
    const input = buffer.getChannelData(c)
    const output = wobbleBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      // Wobble lent + random
      const wobble = Math.sin(2 * Math.PI * 0.8 * i / sampleRate) * 0.02
      const jitter = (Math.random() - 0.5) * 0.005
      const readPos = i * (1 + wobble + jitter)
      const readIdx = Math.floor(readPos)
      const frac = readPos - readIdx
      const s0 = readIdx >= 0 && readIdx < length ? input[readIdx] : 0
      const s1 = readIdx + 1 < length ? input[readIdx + 1] : 0
      output[i] = s0 + frac * (s1 - s0)
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = wobbleBuffer

  // EQ légèrement chaud
  const warmEQ = offlineCtx.createBiquadFilter()
  warmEQ.type = 'lowshelf'
  warmEQ.frequency.value = 300
  warmEQ.gain.value = 2

  // Chorus instable
  const chorusDelay = offlineCtx.createDelay(0.1)
  chorusDelay.delayTime.value = 0.03
  const chorusLFO = offlineCtx.createOscillator()
  chorusLFO.frequency.value = 1.8
  const chorusLFOGain = offlineCtx.createGain()
  chorusLFOGain.gain.value = 0.018
  chorusLFO.connect(chorusLFOGain)
  chorusLFOGain.connect(chorusDelay.delayTime)

  // Compression lente (ivre)
  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -22
  comp.ratio.value = 3
  comp.attack.value = 0.02
  comp.release.value = 0.5
  comp.knee.value = 10

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.75
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.3

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(warmEQ)
  warmEQ.connect(comp)
  comp.connect(dryGain)
  comp.connect(chorusDelay)
  chorusDelay.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)

  chorusLFO.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── 🎮 8-BIT — Downsample + bitcrush + aliasing contrôlé ────────────────────
async function apply8BitEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  // Bitcrush 8-bit + downsample
  const crushedBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  const bits = 8
  const steps = Math.pow(2, bits - 1)
  const downsampleFactor = 4 // simule 11kHz depuis 44kHz

  for (let c = 0; c < channels; c++) {
    const input = buffer.getChannelData(c)
    const output = crushedBuffer.getChannelData(c)
    let held = 0
    for (let i = 0; i < length; i++) {
      if (i % downsampleFactor === 0) {
        held = Math.round(input[i] * steps) / steps
      }
      output[i] = held
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = crushedBuffer

  // Lowpass anti-aliasing contrôlé
  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 5500

  // Léger boost pour clarté
  const midBoost = offlineCtx.createBiquadFilter()
  midBoost.type = 'peaking'
  midBoost.frequency.value = 2000
  midBoost.gain.value = 3

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(lp)
  lp.connect(midBoost)
  midBoost.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── ⚡ GLITCH — Stutter + dropout + reverse fragments ───────────────────────
async function applyGlitchEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const channels = buffer.numberOfChannels

  const glitchBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  for (let c = 0; c < channels; c++) {
    const input = buffer.getChannelData(c)
    const output = glitchBuffer.getChannelData(c)
    const chunkSize = Math.floor(sampleRate * 0.05) // chunks 50ms

    for (let i = 0; i < length; i += chunkSize) {
      const rand = Math.random()
      for (let j = 0; j < chunkSize && i + j < length; j++) {
        if (rand < 0.08) {
          // Dropout — silence
          output[i + j] = 0
        } else if (rand < 0.15) {
          // Reverse fragment
          const revIdx = Math.min(length - 1, i + chunkSize - j)
          output[i + j] = input[revIdx] || 0
        } else if (rand < 0.2) {
          // Stutter — répète le début du chunk
          output[i + j] = input[i + (j % Math.floor(chunkSize / 4))] || 0
        } else {
          output[i + j] = input[i + j]
        }
      }
    }
  }

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = glitchBuffer

  // Highpass pour caractère digital
  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 400

  // Distortion numérique
  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.random() > 0.96 ? x * 3 : Math.tanh(x * 1.5)
  }
  waveshaper.curve = curve

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hp)
  hp.connect(waveshaper)
  waveshaper.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── AMBIANCES PRO ────────────────────────────────────────────────────────────
async function applyCaveEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const reverbLen = Math.floor(sampleRate * 1.2)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length + reverbLen, sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  // Early reflections (slapback court)
  const earlyDelay = offlineCtx.createDelay(0.1)
  earlyDelay.delayTime.value = 0.035
  const earlyGain = offlineCtx.createGain()
  earlyGain.gain.value = 0.4

  // Reverb moyenne
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 3)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.7
  const earlyWet = offlineCtx.createGain()
  earlyWet.gain.value = 0.3
  const lateWet = offlineCtx.createGain()
  lateWet.gain.value = 0.5

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(dryGain)
  source.connect(earlyDelay)
  earlyDelay.connect(earlyGain)
  earlyGain.connect(earlyWet)
  source.connect(convolver)
  convolver.connect(lateWet)
  dryGain.connect(limiter)
  earlyWet.connect(limiter)
  lateWet.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyStadiumEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const reverbLen = Math.floor(sampleRate * 2.0)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length + reverbLen, sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  // Slapback delay stadium
  const slapDelay = offlineCtx.createDelay(0.2)
  slapDelay.delayTime.value = 0.08
  const slapGain = offlineCtx.createGain()
  slapGain.gain.value = 0.35

  // Double delay
  const slapDelay2 = offlineCtx.createDelay(0.3)
  slapDelay2.delayTime.value = 0.16
  const slapGain2 = offlineCtx.createGain()
  slapGain2.gain.value = 0.2

  // Reverb longue
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 4)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.65
  const reverbWet = offlineCtx.createGain()
  reverbWet.gain.value = 0.5

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(dryGain)
  source.connect(slapDelay)
  slapDelay.connect(slapGain)
  slapGain.connect(limiter)
  source.connect(slapDelay2)
  slapDelay2.connect(slapGain2)
  slapGain2.connect(limiter)
  source.connect(convolver)
  convolver.connect(reverbWet)
  dryGain.connect(limiter)
  reverbWet.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applySpaceEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate
  const reverbLen = Math.floor(sampleRate * 4.5)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length + reverbLen, sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  // EQ très dark — coupe les basses
  const darkEQ = offlineCtx.createBiquadFilter()
  darkEQ.type = 'highpass'
  darkEQ.frequency.value = 200

  // High cut
  const highCut = offlineCtx.createBiquadFilter()
  highCut.type = 'lowpass'
  highCut.frequency.value = 4000

  // Reverb énorme
  const impulse = offlineCtx.createBuffer(2, reverbLen, sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c)
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 12)
    }
  }
  const convolver = offlineCtx.createConvolver()
  convolver.buffer = impulse

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.3
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.8

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(darkEQ)
  darkEQ.connect(highCut)
  highCut.connect(dryGain)
  highCut.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── EFFETS SIMPLES AMÉLIORÉS ─────────────────────────────────────────────────
async function applyWhisperEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1200

  const gain = offlineCtx.createGain()
  gain.gain.value = 0.45

  // Bruit de souffle léger
  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = x + (Math.random() - 0.5) * 0.04
  }
  waveshaper.curve = curve

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 4
  comp.attack.value = 0.005
  comp.release.value = 0.2

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hp)
  hp.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(gain)
  gain.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyMegaphoneEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 500

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3500

  const midBoost = offlineCtx.createBiquadFilter()
  midBoost.type = 'peaking'
  midBoost.frequency.value = 1500
  midBoost.gain.value = 6
  midBoost.Q.value = 1

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 4)
  }
  waveshaper.curve = curve

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -8
  comp.ratio.value = 12
  comp.attack.value = 0.001
  comp.release.value = 0.08
  comp.knee.value = 2

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hp)
  hp.connect(lp)
  lp.connect(midBoost)
  midBoost.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyTremoloEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const gain = offlineCtx.createGain()
  gain.gain.value = 0.85

  const lfo = offlineCtx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 6
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = 0.5 // depth modéré

  lfo.connect(lfoGain)
  lfoGain.connect(gain.gain)

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(gain)
  gain.connect(limiter)
  limiter.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

async function applyVibratoEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const delay = offlineCtx.createDelay(0.05)
  delay.delayTime.value = 0.015

  const lfo = offlineCtx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 5.5
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = 0.006 // depth limité

  lfo.connect(lfoGain)
  lfoGain.connect(delay.delayTime)

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(delay)
  delay.connect(limiter)
  limiter.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

async function applyFlangerEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const delay = offlineCtx.createDelay(0.05)
  delay.delayTime.value = 0.004

  const lfo = offlineCtx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.4
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = 0.002

  lfo.connect(lfoGain)
  lfoGain.connect(delay.delayTime)

  // Feedback contrôlé
  const feedback = offlineCtx.createGain()
  feedback.gain.value = 0.55

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.7
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.35

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(dryGain)
  source.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(wetGain)
  dryGain.connect(limiter)
  wetGain.connect(limiter)
  limiter.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

async function applyAlienEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 4, 0.3)
  const offlineCtx = new OfflineAudioContext(
    pitched.numberOfChannels, pitched.length, pitched.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  // Ring mod alien
  const ringFreq = 180
  const sampleRate = pitched.sampleRate
  const length = pitched.length
  const channels = pitched.numberOfChannels
  const ringBuffer = new AudioBuffer({ length, sampleRate, numberOfChannels: channels })
  for (let c = 0; c < channels; c++) {
    const input = pitched.getChannelData(c)
    const output = ringBuffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      const carrier = Math.sin(2 * Math.PI * ringFreq * i / sampleRate)
      output[i] = input[i] * carrier
    }
  }

  const ringSource = offlineCtx.createBufferSource()
  ringSource.buffer = ringBuffer

  const f1 = offlineCtx.createBiquadFilter()
  f1.type = 'bandpass'
  f1.frequency.value = 800
  f1.Q.value = 2

  const f2 = offlineCtx.createBiquadFilter()
  f2.type = 'bandpass'
  f2.frequency.value = 3200
  f2.Q.value = 2

  const g1 = offlineCtx.createGain()
  g1.gain.value = 0.5
  const g2 = offlineCtx.createGain()
  g2.gain.value = 0.5

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  ringSource.connect(f1)
  ringSource.connect(f2)
  f1.connect(g1)
  f2.connect(g2)
  g1.connect(limiter)
  g2.connect(limiter)
  limiter.connect(offlineCtx.destination)
  ringSource.start()
  return offlineCtx.startRendering()
}

async function applyJarvisEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 1, 0.1)
  const offlineCtx = new OfflineAudioContext(
    pitched.numberOfChannels, pitched.length, pitched.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 200

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 8000

  const presence = offlineCtx.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = 3500
  presence.gain.value = 5
  presence.Q.value = 1.5

  const deesser = offlineCtx.createBiquadFilter()
  deesser.type = 'peaking'
  deesser.frequency.value = 7000
  deesser.gain.value = -3
  deesser.Q.value = 2

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  comp.attack.value = 0.003
  comp.release.value = 0.15

  const limiter = offlineCtx.createDynamicsCompressor()
  limiter.threshold.value = -1
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05

  source.connect(hp)
  hp.connect(lp)
  lp.connect(presence)
  presence.connect(deesser)
  deesser.connect(comp)
  comp.connect(limiter)
  limiter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
export async function applyVoiceEffect(
  audioBuffer: AudioBuffer,
  effectId: string
): Promise<AudioBuffer> {
  switch (effectId) {
    case 'normal': return audioBuffer

    // ─── Baseline simple ──────────────────────────────────────────────────
    case 'deep': {
      const p = await applySoundTouch(audioBuffer, -6, -0.4)
      return applyBaselineChain(p)
    }
    case 'chipmunk': {
      const p = await applySoundTouch(audioBuffer, 10, 0.6)
      return applyBaselineChain(p)
    }
    case 'minion': {
      const p = await applySoundTouch(audioBuffer, 8, 0.5)
      return applyBaselineChain(p)
    }
    case 'helium': {
      const p = await applySoundTouch(audioBuffer, 14, 0.8)
      return applyBaselineChain(p)
    }
    case 'goblin': {
      const p = await applySoundTouch(audioBuffer, 5, 0.4)
      return applyBaselineChain(p)
    }
    case 'orc': {
      const p = await applySoundTouch(audioBuffer, -8, -0.5)
      return applyBaselineChain(p)
    }
    case 'giant': {
      const p = await applySoundTouch(audioBuffer, -10, -0.6)
      const reverbed = await applyReverb(p, 1.0, 0.7, 0.2)
      return applyBaselineChain(reverbed)
    }
    case 'vampire': {
      const p = await applySoundTouch(audioBuffer, -5, -0.3)
      const reverbed = await applyReverb(p, 1.2, 0.8, 0.25)
      return applyBaselineChain(reverbed)
    }
    case 'elf': {
      const p = await applySoundTouch(audioBuffer, 6, 0.35)
      const reverbed = await applyReverb(p, 0.5, 0.4, 0.15)
      return applyBaselineChain(reverbed)
    }

    // ─── Effets pro ───────────────────────────────────────────────────────
    case 'robot': return applyRobotEffect(audioBuffer)
    case 'cyborg': {
      const p = await applySoundTouch(audioBuffer, -2, -0.1)
      return applyRobotEffect(p)
    }
    case 'android': {
      const p = await applySoundTouch(audioBuffer, 1, 0.1)
      return applyRobotEffect(p)
    }
    case 'terminator': {
      const p = await applySoundTouch(audioBuffer, -8, -0.4)
      return applyRobotEffect(p)
    }
    case 'jarvis': return applyJarvisEffect(audioBuffer)
    case 'demon': return applyDemonEffect(audioBuffer)
    case 'dragon': return applyDragonEffect(audioBuffer)
    case 'ghost': return applyGhostEffect(audioBuffer)
    case 'angel': return applyAngelEffect(audioBuffer)
    case 'alien': return applyAlienEffect(audioBuffer)
    case 'drunk': return applyDrunkEffect(audioBuffer)
    case '8bit': return apply8BitEffect(audioBuffer)
    case 'glitch': return applyGlitchEffect(audioBuffer)
    case 'whisper': return applyWhisperEffect(audioBuffer)
    case 'megaphone': return applyMegaphoneEffect(audioBuffer)
    case 'underwater': return applyUnderwaterEffect(audioBuffer)
    case 'tremolo': return applyTremoloEffect(audioBuffer)
    case 'vibrato': return applyVibratoEffect(audioBuffer)
    case 'flanger': return applyFlangerEffect(audioBuffer)

    // ─── Radio & devices ─────────────────────────────────────────────────
    case 'radio': return applyRadioEffect(audioBuffer, 500, 3500, true)
    case 'walkie': return applyRadioEffect(audioBuffer, 400, 2800, true)
    case 'telephone': return applyRadioEffect(audioBuffer, 350, 3800, false)
    case 'intercom': return applyRadioEffect(audioBuffer, 300, 4200, false)
    case 'buzz': {
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate
      )
      const src = offlineCtx.createBufferSource()
      src.buffer = audioBuffer
      const ws = offlineCtx.createWaveShaper()
      const curve = new Float32Array(512)
      for (let i = 0; i < 512; i++) {
        const x = (i * 2) / 512 - 1
        curve[i] = Math.tanh(x * 18)
      }
      ws.curve = curve
      ws.oversample = '4x'
      const comp = offlineCtx.createDynamicsCompressor()
      comp.threshold.value = -8
      comp.ratio.value = 10
      comp.attack.value = 0.001
      comp.release.value = 0.05
      const limiter = offlineCtx.createDynamicsCompressor()
      limiter.threshold.value = -1
      limiter.ratio.value = 20
      limiter.attack.value = 0.001
      limiter.release.value = 0.05
      src.connect(ws)
      ws.connect(comp)
      comp.connect(limiter)
      limiter.connect(offlineCtx.destination)
      src.start()
      return offlineCtx.startRendering()
    }
    case 'synthwave': {
      const reverbed = await applyReverb(audioBuffer, 0.6, 0.5, 0.35)
      return applyRadioEffect(reverbed, 150, 9000, false)
    }

    // ─── Ambiances pro ────────────────────────────────────────────────────
    case 'echo': return applyReverb(audioBuffer, 0.6, 0.5, 0.5)
    case 'cave': return applyCaveEffect(audioBuffer)
    case 'stadium': return applyStadiumEffect(audioBuffer)
    case 'church': return applyReverb(audioBuffer, 3.0, 0.85, 0.7, 0.02)
    case 'tunnel': return applyReverb(audioBuffer, 1.4, 0.78, 0.6, 0.01)
    case 'space': return applySpaceEffect(audioBuffer)
    case 'forest': return applyReverb(audioBuffer, 0.5, 0.35, 0.3)
    case 'reverse_echo': return applyReverb(audioBuffer, 1.0, 0.65, 0.55)

    // ─── Pitch ────────────────────────────────────────────────────────────
    case 'pitch_up1': return applySoundTouch(audioBuffer, 3, 0.1)
    case 'pitch_up2': return applySoundTouch(audioBuffer, 6, 0.2)
    case 'pitch_down1': return applySoundTouch(audioBuffer, -3, -0.1)
    case 'pitch_down2': return applySoundTouch(audioBuffer, -6, -0.2)
    case 'speed_up': return applyPitchShiftBasic(audioBuffer, 1.4)
    case 'slow_down': return applyPitchShiftBasic(audioBuffer, 0.7)

    default: return audioBuffer
  }
}