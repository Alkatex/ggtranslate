import { Client, GatewayIntentBits, ChannelType, TextChannel, EmbedBuilder } from 'discord.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
})

let isReady = false

client.once('ready', () => {
  console.log(`✅ Discord bot connecté: ${client.user?.tag}`)
  isReady = true
})

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
  console.error('❌ Discord bot login error:', err.message)
})

async function getOrCreateChannel(guildId: string): Promise<TextChannel | null> {
  try {
    const guild = await client.guilds.fetch(guildId)
    if (!guild) return null
    const channels = await guild.channels.fetch()
    const existing = channels.find(
      c => c?.type === ChannelType.GuildText && c.name === 'ggtranslate'
    ) as TextChannel | undefined
    if (existing) return existing
    const newChannel = await guild.channels.create({
      name: 'ggtranslate',
      type: ChannelType.GuildText,
      topic: '🎮 Traductions en temps réel par GGTranslate — ggtranslate.com',
    })
    await newChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x06b6d4)
          .setTitle('🎮 GGTranslate est connecté !')
          .setDescription('Les traductions vocales de vos sessions gaming apparaîtront ici en temps réel.')
          .addFields(
            { name: '🌐 Site web', value: 'ggtranslate.com', inline: true },
            { name: '📥 Télécharger', value: 'ggtranslate.com/download', inline: true },
          )
          .setFooter({ text: 'GGTranslate — Traduction vocale gaming' })
          .setTimestamp(),
      ],
    })
    return newChannel as TextChannel
  } catch (err) {
    console.error('❌ getOrCreateChannel error:', err)
    return null
  }
}

export async function postTranslation(opts: {
  guildId: string
  original: string
  translated: string
  sourceLang: string
  targetLang: string
  sourceLangFlag: string
  targetLangFlag: string
  game?: string | null
  gameEmoji?: string | null
  username?: string
}) {
  if (!isReady) return { success: false, error: 'Bot not ready' }
  try {
    const channel = await getOrCreateChannel(opts.guildId)
    if (!channel) return { success: false, error: 'Canal introuvable' }
    const embed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setDescription(`${opts.sourceLangFlag} **${opts.original}**\n${opts.targetLangFlag} ${opts.translated}`)
      .setFooter({ text: `${opts.game ? `${opts.gameEmoji} ${opts.game} · ` : ''}GGTranslate${opts.username ? ` · ${opts.username}` : ''} · ggtranslate.com` })
      .setTimestamp()
    await channel.send({ embeds: [embed] })
    return { success: true }
  } catch (err: any) {
    console.error('❌ postTranslation error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function checkBotInGuild(guildId: string): Promise<boolean> {
  if (!isReady) return false
  try {
    const guild = await client.guilds.fetch(guildId)
    return !!guild
  } catch {
    return false
  }
}

export async function getBotGuilds() {
  if (!isReady) return []
  try {
    const guilds = await client.guilds.fetch()
    return guilds.map(g => ({ id: g.id, name: g.name }))
  } catch {
    return []
  }
}

export { client, isReady }