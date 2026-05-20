import { applyVoiceEffect } from './voiceEffects'

const API_URL = import.meta.env.VITE_API_URL || 'https://ggtranslatebackend-production.up.railway.app'

const VOICE_BY_LANG: Record<string, string> = {
  en: 'aura-2-thalia-en',
  fr: 'aura-2-agathe-fr',
  es: 'aura-2-celeste-es',
  de: 'aura-2-viktoria-de',
  it: 'aura-2-livia-it',
  nl: 'aura-2-beatrix-nl',
  ja: 'aura-2-izanami-ja',
}

const DEFAULT_VOICE = 'aura-2-thalia-en'
const TARGET_LUFS = -14
const MAX_QUEUE_SIZE = 3

// ─── Loudness normalization -14 LUFS ─────────────────────────────────────────
function normalizeLoudness(buffer: AudioBuffer): AudioBuffer {
  let sumSquares = 0
  let totalSamples = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i]
      totalSamples++
    }
  }
  const rms = Math.sqrt(sumSquares / totalSamples)
  if (rms === 0) return buffer

  const currentLUFS = 20 * Math.log10(rms) - 0.691
  const gainDB = TARGET_LUFS - currentLUFS
  const gainLinear = Math.pow(10, gainDB / 20)
  const safeGain = Math.min(gainLinear, 2.0)

  const outputBuffer = new OfflineAudioContext(
    buffer.numberOfChannels, buffer.length, buffer.sampleRate
  ).createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const inputData = buffer.getChannelData(ch)
    const outputData = outputBuffer.getChannelData(ch)
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = Math.max(-1, Math.min(1, inputData[i] * safeGain))
    }
  }

  console.log(`🔊 LUFS: ${currentLUFS.toFixed(1)} → ${TARGET_LUFS} | gain: ${gainDB.toFixed(1)}dB`)
  return outputBuffer
}

// ─── TTS Queue intelligente ───────────────────────────────────────────────────
class TTSQueue {
  private queue: Array<{
    text: string
    headsetDeviceId: string | null
    voice: string
    targetLang: string
    effectId: string
    addedAt: number
  }> = []
  private isPlaying = false
  private name: string

  constructor(name: string) {
    this.name = name
  }

  async add(
    text: string,
    headsetDeviceId: string | null,
    voice: string,
    targetLang: string,
    effectId: string = 'normal'
  ) {
    // Prune si queue trop grande
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn(`⚠️ TTS Queue [${this.name}] pleine — prune`)
      this.queue = [this.queue[this.queue.length - 1]]
    }

    // Priorité phrases courtes
    const item = { text, headsetDeviceId, voice, targetLang, effectId, addedAt: Date.now() }
    if (text.length < 20 && this.queue.length > 0) {
      this.queue.unshift(item)
    } else {
      this.queue.push(item)
    }

    if (!this.isPlaying) await this.processQueue()
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }
    this.isPlaying = true
    const item = this.queue.shift()!

    // Skip si phrase obsolète > 5s
    const age = Date.now() - item.addedAt
    if (age > 5000) {
      console.warn(`⏭️ TTS skip obsolète (${age}ms): "${item.text.substring(0, 30)}..."`)
      await this.processQueue()
      return
    }

    try {
      await playAudio(item.text, item.headsetDeviceId, item.voice, item.targetLang, item.effectId)
    } catch (err) {
      console.error(`Erreur TTS [${this.name}]:`, err)
    }
    await this.processQueue()
  }

  clear() {
    this.queue = []
    this.isPlaying = false
  }
}

const myVoiceQueue = new TTSQueue('my-voice')
const otherPlayersQueue = new TTSQueue('other-players')

function normalizeLang(targetLang: string): string {
  return String(targetLang || 'en').toLowerCase().split('-')[0].trim()
}

function getVoiceForLanguage(targetLang: string): string {
  const normalizedLang = normalizeLang(targetLang)
  return VOICE_BY_LANG[normalizedLang] || DEFAULT_VOICE
}

async function resampleBuffer(
  buffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetSampleRate) return buffer
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(buffer.length * targetSampleRate / buffer.sampleRate),
    targetSampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function addSilencePadding(
  buffer: AudioBuffer,
  paddingSeconds: number = 0.5
): Promise<AudioBuffer> {
  const paddingSamples = Math.floor(paddingSeconds * buffer.sampleRate)
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length + paddingSamples,
    buffer.sampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

async function playAudio(
  text: string,
  headsetDeviceId: string | null,
  voice: string,
  targetLang: string,
  effectId: string = 'normal'
): Promise<void> {
  const res = await fetch(`${API_URL}/ai/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, targetLang }),
  })

  if (!res.ok) throw new Error('Erreur TTS')

  const audioBlob = await res.blob()
  const arrayBuffer = await audioBlob.arrayBuffer()

  // ─── Sans effet — HTMLAudioElement ────────────────────────────────────────
  if (!effectId || effectId === 'normal') {
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    if (headsetDeviceId && 'setSinkId' in audio) {
      try { await (audio as any).setSinkId(headsetDeviceId) } catch {}
    }

    return new Promise((resolve) => {
      audio.addEventListener('ended', () => {
        setTimeout(() => { URL.revokeObjectURL(url); resolve() }, 400)
      })
      audio.addEventListener('error', () => { URL.revokeObjectURL(url); resolve() })
      audio.play().catch(() => resolve())
    })
  }

  // ─── Avec effets DSP dans Worker ──────────────────────────────────────────
  const audioCtx = new AudioContext({ sampleRate: 44100 })

  if (headsetDeviceId && 'setSinkId' in audioCtx) {
    try { await (audioCtx as any).setSinkId(headsetDeviceId) } catch {}
  }

  let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

  if (audioBuffer.sampleRate !== 44100) {
    audioBuffer = await resampleBuffer(audioBuffer, 44100)
  }

  // Loudness normalization
  audioBuffer = normalizeLoudness(audioBuffer)

  try {
    audioBuffer = await applyVoiceEffect(audioBuffer, effectId)
  } catch (err) {
    console.warn('⚠️ DSP failed — lecture sans effet:', err)
  }

  // Silence padding
  audioBuffer = await addSilencePadding(audioBuffer, 0.5)

  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioCtx.destination)

  return new Promise((resolve) => {
    source.addEventListener('ended', () => {
      setTimeout(() => { audioCtx.close(); resolve() }, 400)
    })
    source.start()
  })
}

export async function speakTranslation(
  text: string,
  headsetDeviceId: string | null,
  targetLang: string = 'en',
  effectId: string = 'normal'
): Promise<void> {
  const normalizedLang = normalizeLang(targetLang)
  const voice = getVoiceForLanguage(normalizedLang)
  await myVoiceQueue.add(text, headsetDeviceId, voice, normalizedLang, effectId)
}

export async function speakOtherPlayers(
  text: string,
  headsetDeviceId: string | null,
  targetLang: string = 'en'
): Promise<void> {
  const normalizedLang = normalizeLang(targetLang)
  const voice = getVoiceForLanguage(normalizedLang)
  await otherPlayersQueue.add(text, headsetDeviceId, voice, normalizedLang, 'normal')
}

export function clearTTSQueue() { myVoiceQueue.clear() }
export function clearOtherPlayersTTSQueue() { otherPlayersQueue.clear() }