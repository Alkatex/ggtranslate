const API_URL = 'http://localhost:3001'

// Voix Deepgram par langue
const VOICE_BY_LANG: Record<string, string> = {
  en: 'aura-luna-en',
  fr: 'aura-luna-en',
  es: 'aura-luna-en',
  de: 'aura-luna-en',
  pt: 'aura-luna-en',
  ko: 'aura-luna-en',
  ja: 'aura-luna-en',
  zh: 'aura-luna-en',
}

export async function speakTranslation(
  text: string,
  headsetDeviceId: string | null,
  targetLang: string = 'en'
): Promise<void> {
  try {
    const voice = VOICE_BY_LANG[targetLang] || 'aura-luna-en'

    const res = await fetch(`${API_URL}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    })

    if (!res.ok) throw new Error('Erreur TTS')

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
      audio.onerror = reject
      audio.play().catch(reject)
    })

  } catch (err) {
    console.error('Erreur TTS:', err)
    throw err
  }
}