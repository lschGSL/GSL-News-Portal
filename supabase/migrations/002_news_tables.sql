-- ============================================================
-- GSL News Portal — Additional tables for News module
-- Run AFTER 001_initial_schema.sql (GSL Apps Portal)
-- Safe to run on existing GSL Apps Supabase project
-- ============================================================

-- -----------------------------------------------
-- 1. News Categories
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

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);

-- -----------------------------------------------
-- 2. RSS/API News Sources
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

ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_select" ON news_sources FOR SELECT USING (true);
CREATE POLICY "sources_manage" ON news_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- -----------------------------------------------
-- 3. External News Articles (auto-fetched)
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
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_external_id ON news_articles(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles(language);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_select" ON news_articles FOR SELECT USING (true);
CREATE POLICY "news_insert_service" ON news_articles FOR INSERT WITH CHECK (true);

-- -----------------------------------------------
-- 4. Internal Articles (created by editors)
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

ALTER TABLE internal_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_select" ON internal_articles FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));
CREATE POLICY "internal_insert" ON internal_articles FOR INSERT
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "internal_update" ON internal_articles FOR UPDATE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- -----------------------------------------------
-- 5. User Preferences (news-specific)
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

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preferences_select_own" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "preferences_insert_own" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "preferences_update_own" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------
-- 6. Reading History & Bookmarks
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

ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_select_own" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_insert_own" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "history_update_own" ON reading_history FOR UPDATE USING (auth.uid() = user_id);
