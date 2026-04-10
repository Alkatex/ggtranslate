import { Router } from 'express'

const router = Router()

// ─── STT — Speech to Text via Deepgram ───────────────────────────────────────
router.get('/stt-token', async (_req, res) => {
  const apiKey = process.env.DEEPGRAM_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Deepgram API key manquante' })
  }

  // On retourne la clé temporaire pour que le renderer puisse
  // se connecter directement à Deepgram en streaming
  // En production : générer un token temporaire via l'API Deepgram
  return res.json({ token: apiKey })
})

// ─── Traduction via DeepL ─────────────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'text et targetLang requis' })
  }

  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepL API key manquante' })
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: sourceLang?.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      }),
    })

    const data = await response.json() as {
      translations: Array<{ text: string }>
    }

    return res.json({
      translated: data.translations[0].text,
      sourceLang,
      targetLang,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur traduction DeepL' })
  }
})

// ─── TTS — Text to Speech via OpenAI ─────────────────────────────────────────
router.post('/tts', async (req, res) => {
  const { text, voice = 'alloy', speed = 1.0 } = req.body

  if (!text) {
    return res.status(400).json({ error: 'text requis' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key manquante' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      }),
    })

    const audioBuffer = await response.arrayBuffer()
    res.set('Content-Type', 'audio/mpeg')
    return res.send(Buffer.from(audioBuffer))
  } catch (err) {
    return res.status(500).json({ error: 'Erreur TTS OpenAI' })
  }
})

export default router