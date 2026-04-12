// Traduction via DeepL — passe par notre backend pour protéger la clé API

const API_URL = 'http://localhost:3001'

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    })

    if (!res.ok) throw new Error('Erreur traduction')

    const data = await res.json()
    return data.translated
  } catch (err) {
    console.error('Erreur DeepL:', err)
    throw err
  }
}