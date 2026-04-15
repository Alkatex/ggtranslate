import { applyVoiceEffect } from './voiceEffects'

const API_URL = 'http://localhost:3001'

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

class TTSQueue {
  private queue: Array<{
    text: string
    headsetDeviceId: string | null
    voice: string
    targetLang: string
    effectId: string
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
    this.queue.push({ text, headsetDeviceId, voice, targetLang, effectId })
    if (!this.isPlaying) await this.processQueue()
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }
    this.isPlaying = true
    const item = this.queue.shift()!
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

  const audioCtx = new AudioContext()

  if (headsetDeviceId && 'setSinkId' in audioCtx) {
    await (audioCtx as any).setSinkId(headsetDeviceId)
  }

  let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

  if (effectId && effectId !== 'normal') {
    audioBuffer = await applyVoiceEffect(audioBuffer, effectId)
  }

  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioCtx.destination)

  return new Promise((resolve) => {
    source.addEventListener('ended', () => {
      audioCtx.close()
      resolve()
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