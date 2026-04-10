import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'app://localhost'],
  credentials: true,
}))
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Routes auth
import authRouter from './routes/auth'
app.use('/auth', authRouter)

// Routes AI proxy
import aiRouter from './routes/ai'
app.use('/ai', aiRouter)

// Routes billing
import billingRouter from './routes/billing'
app.use('/billing', billingRouter)

// ─── Démarrer le serveur ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend GGTranslate running on http://localhost:${PORT}`)
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app