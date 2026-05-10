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
    return res.status(401).json({ error: err.message });
  }

  const supabase = getSupabase();
  const sub = event.data?.object;
  const email = sub?.customer_email || null;
  const customerId = sub?.customer?.toString() || null;
  const subId = sub?.id || null;

  console.log('[Webhook]', event.type, email || customerId);

  if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const isActive = ['active', 'trialing'].includes(sub?.status);
    if (email) {
      await supabase.from('users')
        .update({ plan: isActive ? 'pro' : 'free', lemon_customer_id: customerId, lemon_subscription_id: subId })
        .eq('email', email);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    if (email) {
      await supabase.from('users')
        .update({ plan: 'free', lemon_subscription_id: null })
        .eq('email', email);
    }
  }

  res.json({ received: true });
});

module.exports = router;