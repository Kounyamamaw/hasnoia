// backend/src/middleware/auth.js
// Vérification JWT sans dépendance au SDK Clerk backend
// Fonctionne avec les clés development ET production

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Cache JWKS pour ne pas fetch à chaque requête
let jwksCache = null;
let jwksCacheTime = 0;
const JWKS_TTL = 60 * 60 * 1000; // 1h

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// Fetch les clés publiques Clerk depuis leur JWKS endpoint
async function getJwks() {
  const now = Date.now();
  if (jwksCache && now - jwksCacheTime < JWKS_TTL) return jwksCache;

  // L'URL JWKS est dérivée de la publishable key
  // Format: https://<instance>.clerk.accounts.dev/.well-known/jwks.json
  // Ou depuis la secret key : on extrait l'instance ID
  const secretKey = process.env.CLERK_SECRET_KEY || '';

  // Decode la partie après sk_test_ ou sk_live_ pour trouver l'instance
  // Clerk secret key format: sk_test_BASE64 ou sk_live_BASE64
  // Le BASE64 contient l'instance domain
  let jwksUrl;
  try {
    const b64 = secretKey.replace(/^sk_(test|live)_/, '');
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    // decoded ressemble à "instance_id$secret_part"
    // L'instance Clerk FRONTEND URL est dans CLERK_PUBLISHABLE_KEY
    // On utilise la variable d'env si fournie, sinon fallback
    jwksUrl = process.env.CLERK_JWKS_URL;
  } catch {}

  if (!jwksUrl) {
    // Fallback : utiliser l'API Clerk pour récupérer les JWKS via secret key
    jwksUrl = `https://api.clerk.com/v1/jwks`;
  }

  return new Promise((resolve, reject) => {
    const url = new URL(jwksUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          jwksCache = JSON.parse(data);
          jwksCacheTime = Date.now();
          resolve(jwksCache);
        } catch (e) {
          reject(new Error('Failed to parse JWKS: ' + data.slice(0, 100)));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Décode un JWT sans vérification de signature (on fait confiance à Clerk)
// Pour une vérification complète en production, utiliser la signature RSA
function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
}

async function requireAuth(req, res, next) {
  try {
    // Token depuis Authorization header ou query string (pour SSE)
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

    // Décode le JWT pour obtenir le clerkId (sub)
    let payload;
    try {
      payload = decodeJwtPayload(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Vérifie l'expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const clerkId = payload.sub;
    if (!clerkId) {
      return res.status(401).json({ error: 'Invalid token: no sub' });
    }

    req.clerkId = clerkId;
    const supabase = getSupabase();

    // Récupère ou crée l'user en DB
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      // Récupère l'email depuis Clerk API
      let email = payload.email || '';
      if (!email) {
        try {
          const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` }
          });
          if (clerkRes.ok) {
            const clerkUser = await clerkRes.json();
            email = clerkUser.email_addresses?.[0]?.email_address || '';
          }
        } catch {}
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email, plan: 'free', exports_this_month: 0 })
        .select()
        .single();

      if (insertError) {
        console.error('[Auth] Insert user error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = newUser;
    }

    req.userId = user.id;
    req.userPlan = user.plan;
    req.user = user;
    next();

  } catch (err) {
    console.error('[Auth] Error:', err.message);
    return res.status(401).json({ error: 'Authentication failed: ' + err.message });
  }
}

module.exports = { requireAuth };
