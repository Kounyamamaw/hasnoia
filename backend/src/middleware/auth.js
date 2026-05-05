// backend/src/middleware/auth.js — compatible Clerk v6
const { createClerkClient } = require('@clerk/backend');
const { createClient } = require('@supabase/supabase-js');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

async function requireAuth(req, res, next) {
  try {
    // Supporte le token dans Authorization header OU dans query string (pour SSE)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Vérifie le JWT Clerk
    let payload;
    try {
      payload = await clerk.verifyToken(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const clerkId = payload.sub;
    if (!clerkId) return res.status(401).json({ error: 'Invalid token payload' });

    req.clerkId = clerkId;
    const supabase = getSupabase();

    // Récupère ou crée l'user en DB
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      let email = '';
      try {
        const clerkUser = await clerk.users.getUser(clerkId);
        email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
      } catch {}

      const { data: newUser } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email, plan: 'free', exports_this_month: 0 })
        .select()
        .single();
      user = newUser;
    }

    if (!user) return res.status(500).json({ error: 'Failed to get user' });

    req.userId = user.id;
    req.userPlan = user.plan;
    req.user = user;
    next();

  } catch (err) {
    console.error('[Auth]', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = { requireAuth };
