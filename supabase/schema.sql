-- ============================================================
-- GSL News Portal — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- 1. User Profiles
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- 2. News Categories (reference)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  label_fr TEXT NOT NULL,
  label_de TEXT NOT NULL,
  label_en TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO categories (slug, label_fr, label_de, label_en, icon, sort_order) VALUES
  ('finance',  'Finance',       'Finanzen',            'Finance',         'trending-up',    1),
  ('economy',  'Économie',      'Wirtschaft',          'Economy',         'bar-chart-3',    2),
  ('fiscal',   'Fiscalité',     'Steuern',             'Tax & Fiscal',    'receipt',        3),
  ('local',    'Local',         'Lokal',               'Local',           'map-pin',        4),
  ('region',   'Grande Région', 'Großregion',          'Greater Region',  'globe',          5),
  ('world',    'Monde',         'Welt',                'World',           'earth',          6),
  ('wellness', 'Bien-être',     'Wohlbefinden',        'Wellness',        'heart',          7),
  ('positive', 'Positive News', 'Positive Nachrichten', 'Positive News',  'sun',            8),
  ('internal', 'Interne',       'Intern',              'Internal',        'building-2',     9)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------
-- 3. RSS/API News Sources
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss', 'api', 'manual')),
  category TEXT NOT NULL REFERENCES categories(slug),
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'de', 'en')),
  region TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  fetch_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 4. External News Articles (auto-fetched)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_id UUID REFERENCES news_sources(id),
  image_url TEXT,
  category TEXT NOT NULL REFERENCES categories(slug),
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'de', 'en')),
  region TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  reading_time_minutes INT NOT NULL DEFAULT 1,
  external_id TEXT UNIQUE, -- dedup key (link URL hash)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles(language);

-- -----------------------------------------------
-- 5. Internal Articles (created by editors)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS internal_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author_id UUID NOT NULL REFERENCES profiles(id),
  category TEXT NOT NULL REFERENCES categories(slug) DEFAULT 'internal',
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'de', 'en')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  image_url TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  review_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_articles_status ON internal_articles(status);
CREATE INDEX IF NOT EXISTS idx_internal_articles_author ON internal_articles(author_id);

-- -----------------------------------------------
-- 6. User Preferences
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_categories TEXT[] NOT NULL DEFAULT '{finance,economy,local,region,world}',
  preferred_languages TEXT[] NOT NULL DEFAULT '{fr}',
  preferred_regions TEXT[] NOT NULL DEFAULT '{luxembourg}',
  email_digest BOOLEAN NOT NULL DEFAULT FALSE,
  email_digest_frequency TEXT NOT NULL DEFAULT 'never' CHECK (email_digest_frequency IN ('daily', 'weekly', 'never')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- -----------------------------------------------
-- 7. Reading History & Bookmarks
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id UUID NOT NULL,
  article_type TEXT NOT NULL CHECK (article_type IN ('external', 'internal')),
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_history_unique ON reading_history(user_id, article_id, article_type);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);

-- -----------------------------------------------
-- 8. Audit Log
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- -----------------------------------------------
-- 9. Row Level Security (RLS)
-- -----------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Preferences: users manage own
CREATE POLICY "preferences_select_own" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "preferences_insert_own" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "preferences_update_own" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Reading history: users manage own
CREATE POLICY "history_select_own" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_insert_own" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "history_update_own" ON reading_history FOR UPDATE USING (auth.uid() = user_id);

-- News articles: everyone can read
CREATE POLICY "news_select" ON news_articles FOR SELECT USING (true);
CREATE POLICY "news_insert_service" ON news_articles FOR INSERT WITH CHECK (true);

-- Internal articles: read published or own, insert/update own
CREATE POLICY "internal_select" ON internal_articles FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin')
  ));
CREATE POLICY "internal_insert" ON internal_articles FOR INSERT
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "internal_update" ON internal_articles FOR UPDATE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- News sources: read all, manage by admins
CREATE POLICY "sources_select" ON news_sources FOR SELECT USING (true);
CREATE POLICY "sources_manage" ON news_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Categories: read all
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);

-- Audit logs: admins only
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (true);
