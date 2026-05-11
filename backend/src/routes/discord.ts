import { Router } from 'express'
import { postTranslation, checkBotInGuild, getBotGuilds } from '../services/discordBot'

const router = Router()

// POST /discord/translate — poster une traduction
router.post('/translate', async (req, res) => {
  const {
    guildId, original, translated,
    sourceLang, targetLang,
    sourceLangFlag, targetLangFlag,
    game, gameEmoji, username,
  } = req.body

  if (!guildId || !original || !translated) {
    return res.status(400).json({ error: 'Paramètres manquants' })
  }

  const result = await postTranslation({
    guildId, original, translated,
    sourceLang, targetLang,
    sourceLangFlag, targetLangFlag,
    game, gameEmoji, username,
  })

  return res.json(result)
})

// GET /discord/guilds — serveurs du bot
router.get('/guilds', async (_req, res) => {
  const guilds = await getBotGuilds()
  res.json({ guilds })
})

// GET /discord/check/:guildId — vérifier si bot dans serveur
router.get('/check/:guildId', async (req, res) => {
  const inGuild = await checkBotInGuild(req.params.guildId)
  res.json({ inGuild })
})

// GET /discord/invite — lien d'invitation
router.get('/invite', (_req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID
  const permissions = '52224' // Send Messages + View Channels + Manage Channels
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot`
  res.json({ url })
})

export default router