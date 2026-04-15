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
  
  export async function applyVoiceEffect(
    audioBuffer: AudioBuffer,
    effectId: string
  ): Promise<AudioBuffer> {
    switch (effectId) {
      case 'normal': return audioBuffer
      case 'deep': return applyPitchShift(audioBuffer, 0.65)
      case 'demon': return applyPitchShift(audioBuffer, 0.45)
      case 'giant': return applyPitchShift(audioBuffer, 0.5)
      case 'orc': return applyPitchShift(audioBuffer, 0.58)
      case 'vampire': return applyPitchShift(audioBuffer, 0.62)
      case 'dragon': return applyPitchShift(audioBuffer, 0.4)
      case 'goblin': return applyPitchShift(audioBuffer, 1.3)
      case 'chipmunk': return applyPitchShift(audioBuffer, 1.8)
      case 'minion': return applyPitchShift(audioBuffer, 1.5)
      case 'helium': return applyPitchShift(audioBuffer, 2.2)
      case 'elf': return applyPitchShift(audioBuffer, 1.4)
      case 'angel': return applyPitchShift(audioBuffer, 1.6)
      case 'pitch_up1': return applyPitchShift(audioBuffer, 1.2)
      case 'pitch_up2': return applyPitchShift(audioBuffer, 1.5)
      case 'pitch_down1': return applyPitchShift(audioBuffer, 0.85)
      case 'pitch_down2': return applyPitchShift(audioBuffer, 0.65)
      case 'speed_up': return applyPitchShift(audioBuffer, 1.4)
      case 'slow_down': return applyPitchShift(audioBuffer, 0.7)
      case 'drunk': return applyPitchShift(audioBuffer, 0.93)
      case 'robot': return applyRobot(audioBuffer)
      case 'cyborg': return applyRobot(audioBuffer)
      case 'android': return applyRobot(audioBuffer)
      case '8bit': return applyRobot(audioBuffer)
      case 'glitch': return applyGlitch(audioBuffer)
      case 'buzz': return applyBuzz(audioBuffer)
      case 'radio': return applyRadio(audioBuffer, 800, 3000)
      case 'walkie': return applyRadio(audioBuffer, 600, 2500)
      case 'telephone': return applyRadio(audioBuffer, 500, 3500)
      case 'intercom': return applyRadio(audioBuffer, 400, 4000)
      case 'megaphone': return applyRadio(audioBuffer, 300, 5000)
      case 'echo': return applyReverb(audioBuffer, 0.6, 0.5)
      case 'cave': return applyReverb(audioBuffer, 1.0, 0.7)
      case 'church': return applyReverb(audioBuffer, 2.5, 0.8)
      case 'stadium': return applyReverb(audioBuffer, 1.8, 0.6)
      case 'tunnel': return applyReverb(audioBuffer, 1.2, 0.75)
      case 'space': return applyReverb(audioBuffer, 4.0, 0.95)
      case 'forest': return applyReverb(audioBuffer, 0.4, 0.3)
      case 'reverse_echo': return applyReverb(audioBuffer, 0.8, 0.6)
      case 'underwater': return applyUnderwater(audioBuffer)
      case 'whisper': return applyWhisper(audioBuffer)
      case 'alien': return applyAlien(audioBuffer)
      case 'tremolo': return applyTremolo(audioBuffer)
      case 'vibrato': return applyTremolo(audioBuffer)
      case 'flanger': return applyFlanger(audioBuffer)
      case 'jarvis': return applyJarvis(audioBuffer)
      case 'ghost': {
        const r = await applyReverb(audioBuffer, 2.0, 0.9)
        return applyPitchShift(r, 0.8)
      }
      case 'synthwave': {
        const r = await applyReverb(audioBuffer, 0.5, 0.4)
        return applyRadio(r, 200, 8000)
      }
      case 'terminator': {
        const p = await applyPitchShift(audioBuffer, 0.6)
        return applyRobot(p)
      }
      default: return audioBuffer
    }
  }
  
  async function applyPitchShift(buffer: AudioBuffer, rate: number): Promise<AudioBuffer> {
    const length = Math.max(1, Math.floor(buffer.length / rate))
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      length,
      buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = rate
    source.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyRobot(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const distortion = offlineCtx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3)
    }
    distortion.curve = curve
  
    const filter = offlineCtx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.8
  
    source.connect(distortion)
    distortion.connect(filter)
    filter.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyRadio(buffer: AudioBuffer, hpFreq: number, lpFreq: number): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const highpass = offlineCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = hpFreq
  
    const lowpass = offlineCtx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = lpFreq
  
    const distortion = offlineCtx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x))
    }
    distortion.curve = curve
  
    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(distortion)
    distortion.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyReverb(buffer: AudioBuffer, duration: number, decay: number): Promise<AudioBuffer> {
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
  
    const dry = offlineCtx.createGain()
    dry.gain.value = 0.6
    const wet = offlineCtx.createGain()
    wet.gain.value = 0.5
  
    source.connect(dry)
    source.connect(convolver)
    convolver.connect(wet)
    dry.connect(offlineCtx.destination)
    wet.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyUnderwater(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const lowpass = offlineCtx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 400
    lowpass.Q.value = 8
  
    source.connect(lowpass)
    lowpass.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyWhisper(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const highpass = offlineCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 2000
  
    const gain = offlineCtx.createGain()
    gain.gain.value = 0.4
  
    source.connect(highpass)
    highpass.connect(gain)
    gain.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyAlien(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const filter1 = offlineCtx.createBiquadFilter()
    filter1.type = 'bandpass'
    filter1.frequency.value = 800
    filter1.Q.value = 2
  
    const filter2 = offlineCtx.createBiquadFilter()
    filter2.type = 'bandpass'
    filter2.frequency.value = 3000
    filter2.Q.value = 2
  
    const gain1 = offlineCtx.createGain()
    gain1.gain.value = 0.5
    const gain2 = offlineCtx.createGain()
    gain2.gain.value = 0.5
  
    source.connect(filter1)
    source.connect(filter2)
    filter1.connect(gain1)
    filter2.connect(gain2)
    gain1.connect(offlineCtx.destination)
    gain2.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyGlitch(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const distortion = offlineCtx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = Math.random() > 0.95 ? x * 3 : x
    }
    distortion.curve = curve
  
    const filter = offlineCtx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000
  
    source.connect(distortion)
    distortion.connect(filter)
    filter.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyBuzz(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const distortion = offlineCtx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = Math.tanh(x * 10)
    }
    distortion.curve = curve
  
    source.connect(distortion)
    distortion.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyJarvis(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const highpass = offlineCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 300
  
    const lowpass = offlineCtx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 6000
  
    const gain = offlineCtx.createGain()
    gain.gain.value = 1.2
  
    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(gain)
    gain.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyTremolo(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const gain = offlineCtx.createGain()
    const lfo = offlineCtx.createOscillator()
    const lfoGain = offlineCtx.createGain()
  
    lfo.frequency.value = 6
    lfoGain.gain.value = 0.5
    gain.gain.value = 0.8
  
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    source.connect(gain)
    gain.connect(offlineCtx.destination)
  
    lfo.start()
    source.start()
    return offlineCtx.startRendering()
  }
  
  async function applyFlanger(buffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels, buffer.length, buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
  
    const delay = offlineCtx.createDelay(1.0)
    delay.delayTime.value = 0.005
  
    const feedback = offlineCtx.createGain()
    feedback.gain.value = 0.5
  
    const dry = offlineCtx.createGain()
    dry.gain.value = 0.7
    const wet = offlineCtx.createGain()
    wet.gain.value = 0.3
  
    source.connect(dry)
    source.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    dry.connect(offlineCtx.destination)
    wet.connect(offlineCtx.destination)
    source.start()
    return offlineCtx.startRendering()
  }