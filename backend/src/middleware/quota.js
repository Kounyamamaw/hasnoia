// backend/src/middleware/quota.js
const { createClient } = require('@supabase/supabase-js');

const QUOTAS = { free: 1, pro: Infinity };

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

async function checkQuota(req, res, next) {
  const user = req.user;
  const quota = QUOTAS[user.plan] ?? 1;

  // Reset mensuel si nécessaire
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
      error: 'Quota atteint',
      plan: user.plan,
      upgradeUrl: process.env.LEMON_SQUEEZY_CHECKOUT_URL,
    });
  }

  next();
}

async function decrementQuota(userId) {
  const supabase = getSupabase();
  await supabase.rpc('increment_exports', { user_id: userId });
}

module.exports = { checkQuota, decrementQuota };
