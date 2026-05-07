// middleware/quota.js
const { createClient } = require('@supabase/supabase-js');

// Domaines email autorisés uniquement
const BLOCKED_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','temp-mail.org','throwaway.email',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net',
  'guerrillamail.org','spam4.me','trashmail.com','trashmail.me','trashmail.net',
  'fakeinbox.com','mailnull.com','spamgourmet.com','maildrop.cc','dispostable.com',
  'getairmail.com','filzmail.com','throwam.com','spamfree24.org','deadaddress.com',
]);

const ALLOWED_DOMAINS = new Set([
  'gmail.com','googlemail.com','yahoo.com','yahoo.fr','yahoo.co.uk',
  'outlook.com','hotmail.com','hotmail.fr','live.com','live.fr','msn.com',
  'proton.me','protonmail.com','protonmail.ch','icloud.com','me.com','mac.com',
  'aol.com','orange.fr','sfr.fr','free.fr','laposte.net','bbox.fr',
  'wanadoo.fr','numericable.fr',
]);

function isEmailAllowed(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  if (BLOCKED_DOMAINS.has(domain)) return false;
  // Si le domaine est dans la liste blanche → OK
  if (ALLOWED_DOMAINS.has(domain)) return true;
  // Sinon on accepte (domaines pro, universités, etc.)
  // Clerk se charge de bloquer les jetables connus
  return true;
}

const QUOTAS = { free: 1, pro: Infinity, admin: Infinity };

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

async function checkQuota(req, res, next) {
  const user = req.user;

  // Vérifie l'email
  if (user.email && !isEmailAllowed(user.email)) {
    return res.status(403).json({ error: 'Disposable email addresses are not allowed.' });
  }

  // Admin → toujours OK
  if (user.plan === 'admin') return next();

  const quota = QUOTAS[user.plan] ?? 1;

  // Reset mensuel
  if (new Date(user.exports_reset_at) < new Date()) {
    await getSupabase()
      .from('users')
      .update({
        exports_this_month: 0,
        exports_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', user.id);
    user.exports_this_month = 0;
  }

  if (user.exports_this_month >= quota) {
    return res.status(402).json({
      error: 'Monthly export limit reached. Upgrade to Pro for unlimited exports.',
      plan: user.plan,
      upgradeUrl: process.env.LEMON_SQUEEZY_CHECKOUT_URL,
    });
  }

  next();
}

async function decrementQuota(userId) {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users').select('exports_this_month').eq('id', userId).maybeSingle();
  if (user) {
    await supabase.from('users')
      .update({ exports_this_month: (user.exports_this_month || 0) + 1 })
      .eq('id', userId);
  }
}

module.exports = { checkQuota, decrementQuota };
