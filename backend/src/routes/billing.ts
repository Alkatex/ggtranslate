import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const PLANS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

const APP_URL = process.env.APP_URL || 'https://ggtranslatebackend-production.up.railway.app'

router.post('/create-checkout', async (req: Request, res: Response) => {
  const { plan, email, userId } = req.body

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'Plan invalide' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: { userId, plan },
      line_items: [{
        price: PLANS[plan],
        quantity: 1,
      }],
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/billing/cancel`,
    })

    return res.json({ url: session.url })
  } catch (err) {
    console.error('Erreur Stripe checkout:', err)
    return res.status(500).json({ error: 'Erreur création session Stripe' })
  }
})

router.post('/portal', async (req: Request, res: Response) => {
  const { customerId } = req.body
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/billing/cancel`,
    })
    return res.json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur portail Stripe' })
  }
})

// WEBHOOK — met à jour Supabase après paiement
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!
  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature invalide:', err)
    return res.status(400).json({ error: 'Webhook invalide' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan
    const customerId = session.customer
    const subscriptionId = session.subscription

    if (userId && plan) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      console.log(`✅ Subscription mise à jour — user: ${userId}, plan: ${plan}`)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`❌ Subscription annulée — ${subscription.id}`)
  }

  return res.json({ received: true })
})

router.get('/success', (_req: Request, res: Response) => {
  res.send('<html><body><script>window.close()</script><p>✅ Paiement réussi ! Retourne dans GGTranslate et relance l\'app.</p></body></html>')
})

router.get('/cancel', (_req: Request, res: Response) => {
  res.send('<html><body><script>window.close()</script><p>❌ Paiement annulé.</p></body></html>')
})

export default router