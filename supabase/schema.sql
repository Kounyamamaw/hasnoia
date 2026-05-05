-- supabase/schema.sql
-- À exécuter dans l'éditeur SQL de Supabase

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  exports_this_month INTEGER DEFAULT 0,
  exports_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  lemon_customer_id TEXT,
  lemon_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table exports
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  pages_count INTEGER DEFAULT 0,
  assets_count INTEGER DEFAULT 0,
  zip_size_kb INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour incrémenter le compteur d'exports
CREATE OR REPLACE FUNCTION increment_exports(user_id UUID)
RETURNS VOID AS $$
  UPDATE users
  SET exports_this_month = exports_this_month + 1,
      updated_at = NOW()
  WHERE id = user_id;
$$ LANGUAGE SQL;

-- Index pour les queries fréquentes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Le backend utilise la service key → bypass RLS
-- Les policies sont là pour protéger contre l'accès direct depuis le client

-- Storage bucket pour les ZIPs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT DO NOTHING;
