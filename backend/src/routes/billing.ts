import { Router, Request, Response } from 'express'
import Stripe from 'stripe'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
})

const PLANS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

router.post('/create-checkout', async (req: Request, res: Response) => {
  const { plan, email } = req.body

  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return res.status(400).json({ error: 'Plan invalide' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: PLANS[plan as keyof typeof PLANS],
        quantity: 1,
      }],
      success_url: 'http://localhost:5173/#/translate?upgraded=true',
      cancel_url: 'http://localhost:5173/#/pricing',
    })

    return res.json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur création session Stripe' })
  }
})

router.post('/portal', async (req: Request, res: Response) => {
  const { customerId } = req.body

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'http://localhost:5173/#/translate',
    })

    return res.json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur portail Stripe' })
  }
})

export default router