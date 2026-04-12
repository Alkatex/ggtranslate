import { Router } from 'express'

const router = Router()

router.get('/stt-token', async (_req, res) => {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Deepgram API key manquante' })
  }
  return res.json({ token: apiKey })
})

router.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body || {}
  console.log('🌐 Traduction demandée:', { text, sourceLang, targetLang })

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'text et targetLang requis' })
  }

  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepL API key manquante' })
  }

  try {
    const params = new URLSearchParams()
    params.append('text', String(text))
    params.append('target_lang', String(targetLang).toUpperCase())
    if (sourceLang && String(sourceLang).trim()) {
      params.append('source_lang', String(sourceLang).toUpperCase())
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const rawText = await response.text()
    console.log('📡 DeepL status:', response.status)

    let data: any = null
    try { data = rawText ? JSON.parse(rawText) : null } catch { data = null }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Erreur traduction DeepL',
        details: data || rawText,
      })
    }

    const translatedText = data?.translations?.[0]?.text
    if (!translatedText) {
      return res.status(500).json({ error: 'Réponse DeepL invalide' })
    }

    return res.json({ translatedText, translated: translatedText })
  } catch (err: any) {
    console.error('❌ Erreur DeepL:', err)
    return res.status(500).json({ error: 'Erreur traduction DeepL' })
  }
})

router.post('/tts', async (req, res) => {
  const { text, voice = 'aura-luna-en' } = req.body || {}

  if (!text) {
    return res.status(400).json({ error: 'text requis' })
  }

  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Deepgram API key manquante' })
  }

  try {
    console.log('🔊 TTS Deepgram demandé:', { text: text.slice(0, 50), voice })

    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    )

    console.log('📡 TTS Deepgram status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur TTS Deepgram:', response.status, errorText)
      return res.status(response.status).json({
        error: 'Erreur TTS Deepgram',
        details: errorText,
      })
    }

    const audioBuffer = await response.arrayBuffer()
    res.set('Content-Type', 'audio/mpeg')
    return res.send(Buffer.from(audioBuffer))
  } catch (err: any) {
    console.error('❌ Erreur TTS:', err)
    return res.status(500).json({ error: 'Erreur TTS Deepgram' })
  }
})

export default router