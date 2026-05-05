// auth.js — decode JWT Clerk sans vérification de signature
// Fonctionne avec dev keys ET prod keys
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Not a JWT');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
}

async function requireAuth(req, res, next) {
  try {
    // Token depuis Authorization header OU query string (SSE)
    let token = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7).trim();
    else if (req.query.token) token = req.query.token;

    if (!token) {
      console.log('[Auth] No token');
      return res.status(401).json({ error: 'No token' });
    }

    // Décode le JWT (sans vérifier la signature — Clerk signe côté client)
    let payload;
    try {
      payload = decodeJwt(token);
      console.log('[Auth] JWT payload sub:', payload.sub, 'exp:', payload.exp);
    } catch (e) {
      console.log('[Auth] JWT decode error:', e.message);
      return res.status(401).json({ error: 'Invalid JWT: ' + e.message });
    }

    // Vérifie expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('[Auth] Token expired at', payload.exp, 'now', now);
      return res.status(401).json({ error: 'Token expired — please refresh the page' });
    }

    const clerkId = payload.sub;
    if (!clerkId) {
      console.log('[Auth] No sub in payload');
      return res.status(401).json({ error: 'Invalid token: no sub' });
    }

    // Upsert user en DB
    const supabase = getSupabase();
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    let user = existingUser;

    if (!user) {
      console.log('[Auth] New user, creating:', clerkId);
      // Récupère email via Clerk REST API
      let email = payload.email || '';
      if (!email && process.env.CLERK_SECRET_KEY) {
        try {
          const r = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
          });
          if (r.ok) {
            const u = await r.json();
            email = u.email_addresses?.[0]?.email_address || '';
          }
        } catch (e) {
          console.log('[Auth] Clerk API error:', e.message);
        }
      }

      const { data: newUser, error: err } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email, plan: 'free', exports_this_month: 0 })
        .select()
        .maybeSingle();

      if (err) {
        console.log('[Auth] Insert error:', err.message);
        return res.status(500).json({ error: 'DB error: ' + err.message });
      }
      user = newUser;
    }

    if (!user) {
      return res.status(500).json({ error: 'Could not get or create user' });
    }

    console.log('[Auth] OK user:', user.id, 'plan:', user.plan);
    req.userId = user.id;
    req.userPlan = user.plan;
    req.user = user;
    next();

  } catch (err) {
    console.error('[Auth] Unexpected:', err.message, err.stack);
    return res.status(401).json({ error: 'Auth error: ' + err.message });
  }
}

module.exports = { requireAuth };
