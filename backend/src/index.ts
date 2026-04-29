import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:5173', 'app://localhost', 'https://ggtranslatebackend-production.up.railway.app'],
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

import authRouter from './routes/auth'
app.use('/auth', authRouter)

import aiRouter from './routes/ai'
app.use('/ai', aiRouter)

import billingRouter from './routes/billing'
app.use('/billing', billingRouter)

import discordRouter from './routes/discord'
app.use('/discord', discordRouter)

app.listen(PORT, () => {
  console.log(`✅ Backend GGTranslate running on http://localhost:${PORT}`)
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Démarrer le bot Discord
import './services/discordBot'

export default app