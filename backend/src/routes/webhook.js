// backend/src/routes/webhook.js
// POST /webhook — reçoit les événements Lemon Squeezy (paiement, annulation)
const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

router.post('/', async (req, res) => {
  // Vérifie la signature HMAC de Lemon Squeezy
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];
  const body = req.body; // raw buffer grâce au express.raw() dans server.js

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const payload = JSON.parse(body.toString());
  const eventName = payload.meta?.event_name;
  const email = payload.data?.attributes?.user_email;
  const customerId = payload.data?.attributes?.customer_id?.toString();
  const subscriptionId = payload.data?.id?.toString();

  const supabase = getSupabase();

  if (eventName === 'subscription_created' || eventName === 'subscription_resumed') {
    // Passe l'user en Pro
    await supabase
      .from('users')
      .update({
        plan: 'pro',
        lemon_customer_id: customerId,
        lemon_subscription_id: subscriptionId,
      })
      .eq('email', email);

    console.log(`[Webhook] User ${email} → Pro`);
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    // Repasse l'user en Free
    await supabase
      .from('users')
      .update({ plan: 'free', lemon_subscription_id: null })
      .eq('email', email);

    console.log(`[Webhook] User ${email} → Free (annulation)`);
  }

  res.json({ received: true });
});

module.exports = router;
