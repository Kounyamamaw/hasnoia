// backend/src/middleware/auth.js
// Vérifie le JWT Clerk sur chaque requête protégée

const { createClerkClient } = require('@clerk/backend');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.split(' ')[1];
    const { sub: clerkId } = await clerk.verifyToken(token);

    req.clerkId = clerkId;

    // Récupère l'user en DB (ou le crée s'il n'existe pas)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      const clerkUser = await clerk.users.getUser(clerkId);
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          plan: 'free',
          exports_this_month: 0,
        })
        .select()
        .single();
      user = newUser;
    }

    req.userId = user.id;
    req.userPlan = user.plan;
    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = { requireAuth };
