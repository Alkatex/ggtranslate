import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' })
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, user_metadata: { name },
  })
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ user: data.user })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  })
  if (error) return res.status(401).json({ error: error.message })
  return res.json({ user: data.user, session: data.session })
})

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token manquant' })
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: error.message })
  return res.json({ user: data.user })
})

export default router