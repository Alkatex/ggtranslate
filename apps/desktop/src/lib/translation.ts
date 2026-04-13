const API_URL = 'http://localhost:3001'

const cache = new Map<string, string>()

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (sourceLang === targetLang) return text

  const key = `${sourceLang}:${targetLang}:${text}`
  if (cache.has(key)) {
    console.log('⚡ Cache hit:', text.slice(0, 30))
    return cache.get(key)!
  }

  try {
    const res = await fetch(`${API_URL}/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    })

    if (!res.ok) throw new Error('Erreur traduction')

    const data = await res.json() as any
    const translated = data.translated || data.translatedText

    if (!translated) throw new Error('Réponse traduction invalide')

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    cache.set(key, translated)
    return translated
  } catch (err) {
    console.error('Erreur DeepL:', err)
    throw err
  }
}