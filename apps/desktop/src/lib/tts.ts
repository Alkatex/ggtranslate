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
    targetLang: string
  ) {
    this.queue.push({ text, headsetDeviceId, voice, targetLang })
    if (!this.isPlaying) {
      await this.processQueue()
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const item = this.queue.shift()!

    try {
      await playAudio(item.text, item.headsetDeviceId, item.voice, item.targetLang)
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
  return String(targetLang || 'en')
    .toLowerCase()
    .split('-')[0]
    .trim()
}

function getVoiceForLanguage(targetLang: string): string {
  const normalizedLang = normalizeLang(targetLang)
  return VOICE_BY_LANG[normalizedLang] || DEFAULT_VOICE
}

async function playAudio(
  text: string,
  headsetDeviceId: string | null,
  voice: string,
  targetLang: string
): Promise<void> {
  console.log('🔊 playAudio:', { targetLang, voice, text: text.slice(0, 80) })

  const res = await fetch(`${API_URL}/ai/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, targetLang }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ Erreur TTS backend:', errorText)
    throw new Error('Erreur TTS')
  }

  const audioBlob = await res.blob()
  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)

  if (headsetDeviceId && 'setSinkId' in audio) {
    await (audio as any).setSinkId(headsetDeviceId)
  }

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      reject(new Error('Erreur lecture audio'))
    }
    audio.play().catch((err) => {
      URL.revokeObjectURL(audioUrl)
      reject(err)
    })
  })
}

export async function speakTranslation(
  text: string,
  headsetDeviceId: string | null,
  targetLang: string = 'en'
): Promise<void> {
  const normalizedLang = normalizeLang(targetLang)
  const voice = getVoiceForLanguage(normalizedLang)
  await myVoiceQueue.add(text, headsetDeviceId, voice, normalizedLang)
}

export async function speakOtherPlayers(
  text: string,
  headsetDeviceId: string | null,
  targetLang: string = 'en'
): Promise<void> {
  const normalizedLang = normalizeLang(targetLang)
  const voice = getVoiceForLanguage(normalizedLang)
  await otherPlayersQueue.add(text, headsetDeviceId, voice, normalizedLang)
}

export function clearTTSQueue() {
  myVoiceQueue.clear()
}

export function clearOtherPlayersTTSQueue() {
  otherPlayersQueue.clear()
}