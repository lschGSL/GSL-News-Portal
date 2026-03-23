-- ============================================================
-- Register GSL News Portal in the GSL Apps Portal
-- Run this in the Supabase SQL Editor
-- ============================================================
-- IMPORTANT: Replace 'https://news.your-domain.com' with your
-- actual News Portal deployment URL (e.g. Vercel URL)
-- ============================================================

INSERT INTO applications (name, slug, description, url, icon_url, visibility, is_active)
VALUES (
  'GSL News',
  'gsl-news',
  'Portail d''actualités financières et économiques — Finance, Économie, Fiscalité, Grande Région et plus.',
  'https://news.your-domain.com',  -- ← REMPLACEZ PAR VOTRE URL
  NULL,
  'internal',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
