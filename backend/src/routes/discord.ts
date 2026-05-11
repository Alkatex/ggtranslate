import { Router } from 'express'
import { postTranslation, checkBotInGuild, getBotGuilds } from '../services/discordBot'

const router = Router()

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

router.get('/guilds', async (_req, res) => {
  const guilds = await getBotGuilds()
  res.json({ guilds })
})

router.get('/check/:guildId', async (req, res) => {
  const inGuild = await checkBotInGuild(req.params.guildId)
  res.json({ inGuild })
})

router.get('/invite', (_req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID || '1499073387828609094'
  // 8 = Administrateur — permet tout incluant créer des salons
  const url = `https://discord.com/oauth2/authorize?client_id=1499073387828609094&permissions=19472&integration_type=0&scope=bot+applications.commands`
  res.json({ url })
})

export default router