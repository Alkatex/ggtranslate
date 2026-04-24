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

// ─── DSP CONFIG PAR EFFET ────────────────────────────────────────────────────
interface DSPConfig {
  pitch: number        // semitones (-24 à +24)
  formant: number      // formant shift (-1 à +1)
  eq: EQBand[]         // bandes EQ
  compression: CompConfig
  saturation: number   // 0 à 1
  reverb?: ReverbConfig
  bitcrush?: number    // 1 à 16 bits
  chorus?: ChorusConfig
}

interface EQBand {
  type: BiquadFilterType
  freq: number
  gain: number
  Q?: number
}

interface CompConfig {
  threshold: number
  ratio: number
  attack: number
  release: number
  knee: number
}

interface ReverbConfig {
  duration: number
  decay: number
  wet: number
}

interface ChorusConfig {
  rate: number
  depth: number
  wet: number
}

const DEFAULT_COMP: CompConfig = {
  threshold: -20, ratio: 4, attack: 0.003,
  release: 0.25, knee: 6
}

const DSP_PRESETS: Record<string, DSPConfig> = {
  deep: {
    pitch: -6, formant: -0.4,
    eq: [
      { type: 'lowshelf', freq: 200, gain: 6 },
      { type: 'highshelf', freq: 4000, gain: -4 },
      { type: 'peaking', freq: 800, gain: 3, Q: 1 },
    ],
    compression: { threshold: -18, ratio: 5, attack: 0.005, release: 0.3, knee: 8 },
    saturation: 0.15,
  },
  demon: {
    pitch: -12, formant: -0.7,
    eq: [
      { type: 'lowshelf', freq: 150, gain: 8 },
      { type: 'peaking', freq: 400, gain: 4, Q: 0.8 },
      { type: 'highshelf', freq: 5000, gain: -6 },
    ],
    compression: { threshold: -15, ratio: 6, attack: 0.003, release: 0.2, knee: 5 },
    saturation: 0.4,
    reverb: { duration: 0.8, decay: 0.6, wet: 0.2 },
  },
  giant: {
    pitch: -10, formant: -0.6,
    eq: [
      { type: 'lowshelf', freq: 180, gain: 7 },
      { type: 'peaking', freq: 350, gain: 3, Q: 1 },
      { type: 'highshelf', freq: 6000, gain: -5 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.2,
    reverb: { duration: 1.2, decay: 0.7, wet: 0.25 },
  },
  orc: {
    pitch: -8, formant: -0.5,
    eq: [
      { type: 'lowshelf', freq: 200, gain: 5 },
      { type: 'peaking', freq: 600, gain: 3, Q: 1.2 },
      { type: 'highshelf', freq: 4000, gain: -3 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.3,
  },
  vampire: {
    pitch: -5, formant: -0.3,
    eq: [
      { type: 'lowshelf', freq: 250, gain: 3 },
      { type: 'peaking', freq: 1500, gain: -2, Q: 1 },
      { type: 'highshelf', freq: 8000, gain: 2 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.1,
    reverb: { duration: 1.5, decay: 0.8, wet: 0.3 },
  },
  dragon: {
    pitch: -14, formant: -0.8,
    eq: [
      { type: 'lowshelf', freq: 120, gain: 10 },
      { type: 'peaking', freq: 300, gain: 5, Q: 0.7 },
      { type: 'highshelf', freq: 3000, gain: -8 },
    ],
    compression: { threshold: -12, ratio: 8, attack: 0.002, release: 0.15, knee: 4 },
    saturation: 0.5,
    reverb: { duration: 2.0, decay: 0.85, wet: 0.35 },
  },
  goblin: {
    pitch: 5, formant: 0.4,
    eq: [
      { type: 'highshelf', freq: 3000, gain: 4 },
      { type: 'peaking', freq: 800, gain: 2, Q: 1.5 },
      { type: 'lowshelf', freq: 200, gain: -3 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.25,
  },
  chipmunk: {
    pitch: 10, formant: 0.6,
    eq: [
      { type: 'highshelf', freq: 2000, gain: 5 },
      { type: 'lowshelf', freq: 300, gain: -4 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.05,
  },
  minion: {
    pitch: 8, formant: 0.5,
    eq: [
      { type: 'highshelf', freq: 2500, gain: 4 },
      { type: 'peaking', freq: 1000, gain: 2, Q: 1 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.1,
  },
  helium: {
    pitch: 14, formant: 0.8,
    eq: [
      { type: 'highshelf', freq: 1500, gain: 6 },
      { type: 'lowshelf', freq: 400, gain: -5 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.02,
  },
  elf: {
    pitch: 6, formant: 0.35,
    eq: [
      { type: 'highshelf', freq: 3000, gain: 3 },
      { type: 'peaking', freq: 1200, gain: 2, Q: 1 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.05,
    reverb: { duration: 0.5, decay: 0.4, wet: 0.15 },
  },
  angel: {
    pitch: 9, formant: 0.5,
    eq: [
      { type: 'highshelf', freq: 4000, gain: 4 },
      { type: 'lowshelf', freq: 300, gain: -2 },
    ],
    compression: DEFAULT_COMP,
    saturation: 0.02,
    reverb: { duration: 2.0, decay: 0.9, wet: 0.4 },
  },
  pitch_up1: {
    pitch: 3, formant: 0,
    eq: [], compression: DEFAULT_COMP, saturation: 0,
  },
  pitch_up2: {
    pitch: 6, formant: 0,
    eq: [], compression: DEFAULT_COMP, saturation: 0,
  },
  pitch_down1: {
    pitch: -3, formant: 0,
    eq: [], compression: DEFAULT_COMP, saturation: 0,
  },
  pitch_down2: {
    pitch: -6, formant: 0,
    eq: [], compression: DEFAULT_COMP, saturation: 0,
  },
  drunk: {
    pitch: -1, formant: -0.1,
    eq: [
      { type: 'lowshelf', freq: 300, gain: 2 },
      { type: 'peaking', freq: 1000, gain: -1, Q: 2 },
    ],
    compression: { threshold: -25, ratio: 3, attack: 0.01, release: 0.4, knee: 10 },
    saturation: 0.08,
    chorus: { rate: 2, depth: 0.3, wet: 0.2 },
  },
}

// ─── SOUNDTOUCH PITCH + FORMANT ───────────────────────────────────────────────
async function applySoundTouch(
  buffer: AudioBuffer,
  semitones: number,
  formantShift: number = 0
): Promise<AudioBuffer> {
  try {
    const soundTouch = new SoundTouch(buffer.sampleRate)
    soundTouch.pitch = Math.pow(2, semitones / 12)
    soundTouch.tempo = 1.0

    // Formant shift via pitch + tempo combinés
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
  } catch (err) {
    console.warn('SoundTouch failed, fallback:', err)
    const rate = Math.pow(2, semitones / 12)
    return applyPitchShiftBasic(buffer, rate)
  }
}

// ─── EQ ──────────────────────────────────────────────────────────────────────
async function applyEQ(buffer: AudioBuffer, bands: EQBand[]): Promise<AudioBuffer> {
  if (bands.length === 0) return buffer

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  let lastNode: AudioNode = source
  for (const band of bands) {
    const filter = offlineCtx.createBiquadFilter()
    filter.type = band.type
    filter.frequency.value = band.freq
    filter.gain.value = band.gain
    if (band.Q) filter.Q.value = band.Q
    lastNode.connect(filter)
    lastNode = filter
  }

  lastNode.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── COMPRESSION ─────────────────────────────────────────────────────────────
async function applyCompression(buffer: AudioBuffer, config: CompConfig): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = config.threshold
  comp.ratio.value = config.ratio
  comp.attack.value = config.attack
  comp.release.value = config.release
  comp.knee.value = config.knee

  source.connect(comp)
  comp.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── SATURATION ──────────────────────────────────────────────────────────────
async function applySaturation(buffer: AudioBuffer, amount: number): Promise<AudioBuffer> {
  if (amount <= 0) return buffer

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  const k = amount * 100
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x))
  }
  waveshaper.curve = curve
  waveshaper.oversample = '4x'

  source.connect(waveshaper)
  waveshaper.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── REVERB ──────────────────────────────────────────────────────────────────
async function applyReverb(
  buffer: AudioBuffer,
  duration: number,
  decay: number,
  wet: number = 0.5
): Promise<AudioBuffer> {
  const extraSamples = Math.floor(duration * buffer.sampleRate)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length + extraSamples,
    buffer.sampleRate
  )

  const impulseLength = Math.max(1, extraSamples)
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

  source.connect(dryGain)
  source.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(offlineCtx.destination)
  wetGain.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

// ─── CHORUS ──────────────────────────────────────────────────────────────────
async function applyChorus(buffer: AudioBuffer, config: ChorusConfig): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const delay = offlineCtx.createDelay(0.1)
  delay.delayTime.value = 0.025

  const lfo = offlineCtx.createOscillator()
  lfo.frequency.value = config.rate
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = config.depth * 0.01

  lfo.connect(lfoGain)
  lfoGain.connect(delay.delayTime)

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 1 - config.wet * 0.5
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = config.wet

  source.connect(dryGain)
  source.connect(delay)
  delay.connect(wetGain)
  dryGain.connect(offlineCtx.destination)
  wetGain.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

// ─── MOTEUR DSP PRINCIPAL ────────────────────────────────────────────────────
async function applyDSP(buffer: AudioBuffer, config: DSPConfig): Promise<AudioBuffer> {
  let result = buffer

  // 1. Pitch + Formant (SoundTouch)
  if (config.pitch !== 0 || config.formant !== 0) {
    result = await applySoundTouch(result, config.pitch, config.formant)
  }

  // 2. EQ
  if (config.eq && config.eq.length > 0) {
    result = await applyEQ(result, config.eq)
  }

  // 3. Compression
  result = await applyCompression(result, config.compression)

  // 4. Saturation
  if (config.saturation > 0) {
    result = await applySaturation(result, config.saturation)
  }

  // 5. Chorus
  if (config.chorus) {
    result = await applyChorus(result, config.chorus)
  }

  // 6. Reverb
  if (config.reverb) {
    result = await applyReverb(result, config.reverb.duration, config.reverb.decay, config.reverb.wet)
  }

  return result
}

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
export async function applyVoiceEffect(
  audioBuffer: AudioBuffer,
  effectId: string
): Promise<AudioBuffer> {
  // Effets avec preset DSP complet
  if (DSP_PRESETS[effectId]) {
    return applyDSP(audioBuffer, DSP_PRESETS[effectId])
  }

  switch (effectId) {
    case 'normal': return audioBuffer
    case 'speed_up': return applyPitchShiftBasic(audioBuffer, 1.4)
    case 'slow_down': return applyPitchShiftBasic(audioBuffer, 0.7)
    case 'robot': return applyRobotEffect(audioBuffer)
    case 'cyborg': return applyCyborgEffect(audioBuffer)
    case 'android': return applyAndroidEffect(audioBuffer)
    case '8bit': return apply8BitEffect(audioBuffer)
    case 'glitch': return applyGlitchEffect(audioBuffer)
    case 'buzz': return applyBuzzEffect(audioBuffer)
    case 'jarvis': return applyJarvisEffect(audioBuffer)
    case 'terminator': {
      const p = await applySoundTouch(audioBuffer, -8, -0.4)
      return applyRobotEffect(p)
    }
    case 'radio': return applyRadioEffect(audioBuffer, 800, 3000)
    case 'walkie': return applyRadioEffect(audioBuffer, 600, 2500)
    case 'telephone': return applyRadioEffect(audioBuffer, 500, 3500)
    case 'intercom': return applyRadioEffect(audioBuffer, 400, 4000)
    case 'megaphone': return applyMegaphoneEffect(audioBuffer)
    case 'echo': return applyReverb(audioBuffer, 0.6, 0.5, 0.5)
    case 'cave': return applyReverb(audioBuffer, 1.0, 0.7, 0.6)
    case 'church': return applyReverb(audioBuffer, 2.5, 0.8, 0.65)
    case 'stadium': return applyReverb(audioBuffer, 1.8, 0.6, 0.55)
    case 'tunnel': return applyReverb(audioBuffer, 1.2, 0.75, 0.6)
    case 'space': return applyReverb(audioBuffer, 4.0, 0.95, 0.8)
    case 'forest': return applyReverb(audioBuffer, 0.4, 0.3, 0.3)
    case 'reverse_echo': return applyReverb(audioBuffer, 0.8, 0.6, 0.5)
    case 'underwater': return applyUnderwaterEffect(audioBuffer)
    case 'whisper': return applyWhisperEffect(audioBuffer)
    case 'alien': return applyAlienEffect(audioBuffer)
    case 'ghost': {
      const r = await applyReverb(audioBuffer, 2.0, 0.9, 0.7)
      return applySoundTouch(r, -4, -0.2)
    }
    case 'synthwave': {
      const r = await applyReverb(audioBuffer, 0.5, 0.4, 0.4)
      return applyRadioEffect(r, 200, 8000)
    }
    case 'tremolo': return applyTremoloEffect(audioBuffer)
    case 'vibrato': return applyVibratoEffect(audioBuffer)
    case 'flanger': return applyFlangerEffect(audioBuffer)
    default: return audioBuffer
  }
}

// ─── EFFETS SPÉCIAUX ──────────────────────────────────────────────────────────
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

async function applyRobotEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 6

  const distortion = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.25)
  }
  distortion.curve = curve

  const filter1 = offlineCtx.createBiquadFilter()
  filter1.type = 'bandpass'
  filter1.frequency.value = 1200
  filter1.Q.value = 1.5

  const filter2 = offlineCtx.createBiquadFilter()
  filter2.type = 'peaking'
  filter2.frequency.value = 3000
  filter2.gain.value = 6
  filter2.Q.value = 2

  source.connect(comp)
  comp.connect(distortion)
  distortion.connect(filter1)
  filter1.connect(filter2)
  filter2.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyCyborgEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, -2, -0.1)
  return applyRobotEffect(pitched)
}

async function applyAndroidEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 1, 0.1)
  return applyRobotEffect(pitched)
}

async function apply8BitEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const waveshaper = offlineCtx.createWaveShaper()
  const bits = 8
  const steps = Math.pow(2, bits)
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.round(x * steps) / steps
  }
  waveshaper.curve = curve

  const filter = offlineCtx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 4000

  source.connect(waveshaper)
  waveshaper.connect(filter)
  filter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyGlitchEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.random() > 0.97 ? x * 4 : x
  }
  waveshaper.curve = curve

  const filter = offlineCtx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 800

  source.connect(waveshaper)
  waveshaper.connect(filter)
  filter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyBuzzEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 15)
  }
  waveshaper.curve = curve
  waveshaper.oversample = '4x'

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -10
  comp.ratio.value = 8

  source.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyJarvisEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 1, 0.1)
  const offlineCtx = new OfflineAudioContext(pitched.numberOfChannels, pitched.length, pitched.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 250

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 7000

  const peak = offlineCtx.createBiquadFilter()
  peak.type = 'peaking'
  peak.frequency.value = 3500
  peak.gain.value = 4
  peak.Q.value = 1.5

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -15
  comp.ratio.value = 4

  source.connect(hp)
  hp.connect(lp)
  lp.connect(peak)
  peak.connect(comp)
  comp.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyRadioEffect(buffer: AudioBuffer, hpFreq: number, lpFreq: number): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = hpFreq

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lpFreq

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = (Math.PI + 60) * x / (Math.PI + 60 * Math.abs(x))
  }
  waveshaper.curve = curve

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -15
  comp.ratio.value = 5

  source.connect(hp)
  hp.connect(lp)
  lp.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyMegaphoneEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 400

  const lp = offlineCtx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 4000

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = Math.tanh(x * 5)
  }
  waveshaper.curve = curve

  const comp = offlineCtx.createDynamicsCompressor()
  comp.threshold.value = -10
  comp.ratio.value = 10
  comp.attack.value = 0.001
  comp.release.value = 0.1

  source.connect(hp)
  hp.connect(lp)
  lp.connect(waveshaper)
  waveshaper.connect(comp)
  comp.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyUnderwaterEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const lp1 = offlineCtx.createBiquadFilter()
  lp1.type = 'lowpass'
  lp1.frequency.value = 500
  lp1.Q.value = 5

  const lp2 = offlineCtx.createBiquadFilter()
  lp2.type = 'lowpass'
  lp2.frequency.value = 300
  lp2.Q.value = 8

  source.connect(lp1)
  lp1.connect(lp2)
  lp2.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyWhisperEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const hp = offlineCtx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1500

  const gain = offlineCtx.createGain()
  gain.gain.value = 0.5

  const waveshaper = offlineCtx.createWaveShaper()
  const curve = new Float32Array(512)
  for (let i = 0; i < 512; i++) {
    const x = (i * 2) / 512 - 1
    curve[i] = x + (Math.random() - 0.5) * 0.05
  }
  waveshaper.curve = curve

  source.connect(hp)
  hp.connect(waveshaper)
  waveshaper.connect(gain)
  gain.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyAlienEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const pitched = await applySoundTouch(buffer, 4, 0.3)
  const offlineCtx = new OfflineAudioContext(pitched.numberOfChannels, pitched.length, pitched.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = pitched

  const f1 = offlineCtx.createBiquadFilter()
  f1.type = 'bandpass'
  f1.frequency.value = 600
  f1.Q.value = 3

  const f2 = offlineCtx.createBiquadFilter()
  f2.type = 'bandpass'
  f2.frequency.value = 2400
  f2.Q.value = 3

  const g1 = offlineCtx.createGain()
  g1.gain.value = 0.5
  const g2 = offlineCtx.createGain()
  g2.gain.value = 0.5

  source.connect(f1)
  source.connect(f2)
  f1.connect(g1)
  f2.connect(g2)
  g1.connect(offlineCtx.destination)
  g2.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function applyTremoloEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const gain = offlineCtx.createGain()
  const lfo = offlineCtx.createOscillator()
  const lfoGain = offlineCtx.createGain()

  lfo.frequency.value = 7
  lfoGain.gain.value = 0.6
  gain.gain.value = 0.8

  lfo.connect(lfoGain)
  lfoGain.connect(gain.gain)
  source.connect(gain)
  gain.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

async function applyVibratoEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const delay = offlineCtx.createDelay(0.05)
  delay.delayTime.value = 0.02

  const lfo = offlineCtx.createOscillator()
  lfo.frequency.value = 6
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = 0.01

  lfo.connect(lfoGain)
  lfoGain.connect(delay.delayTime)

  source.connect(delay)
  delay.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}

async function applyFlangerEffect(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const delay = offlineCtx.createDelay(0.05)
  delay.delayTime.value = 0.005

  const lfo = offlineCtx.createOscillator()
  lfo.frequency.value = 0.5
  const lfoGain = offlineCtx.createGain()
  lfoGain.gain.value = 0.003

  lfo.connect(lfoGain)
  lfoGain.connect(delay.delayTime)

  const feedback = offlineCtx.createGain()
  feedback.gain.value = 0.6

  const dryGain = offlineCtx.createGain()
  dryGain.gain.value = 0.7
  const wetGain = offlineCtx.createGain()
  wetGain.gain.value = 0.3

  source.connect(dryGain)
  source.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(wetGain)
  dryGain.connect(offlineCtx.destination)
  wetGain.connect(offlineCtx.destination)

  lfo.start()
  source.start()
  return offlineCtx.startRendering()
}