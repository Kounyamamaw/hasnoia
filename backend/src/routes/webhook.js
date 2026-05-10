// backend/src/routes/webhook.js — Stripe
const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t=')).split('=')[1];
  const signature = parts.find(p => p.startsWith('v1=')).split('=')[1];
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Récupère l'email depuis Stripe si pas dans l'événement
async function getCustomerEmail(customerId) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const customer = await res.json();
    return customer.email || null;
  } catch { return null; }
}

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).json({ error: 'Missing signature' });

  let event;
  try {
    const body = req.body.toString();
    if (!verifyStripeSignature(body, sig, secret)) throw new Error('Invalid signature');
    event = JSON.parse(body);
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    return res.status(401).json({ error: err.message });
  }

  const supabase = getSupabase();
  const sub = event.data?.object;
  const customerId = sub?.customer?.toString();

  // Récupère l'email — soit dans l'événement, soit via l'API Stripe
  let email = sub?.customer_email || null;
  if (!email && customerId) {
    email = await getCustomerEmail(customerId);
  }

  console.log('[Webhook]', event.type, '→ email:', email, 'customer:', customerId);

  if (!email) {
    console.warn('[Webhook] No email found, skipping DB update');
    return res.json({ received: true });
  }

  if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const isActive = ['active', 'trialing'].includes(sub?.status);
    await supabase.from('users')
      .update({
        plan: isActive ? 'pro' : 'free',
        lemon_customer_id: customerId,
        lemon_subscription_id: sub?.id || null,
      })
      .eq('email', email);
    console.log('[Webhook] User', email, '→ plan:', isActive ? 'pro' : 'free');
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase.from('users')
      .update({ plan: 'free', lemon_subscription_id: null })
      .eq('email', email);
    console.log('[Webhook] User', email, '→ plan: free (cancelled)');
  }

  res.json({ received: true });
});

module.exports = router;