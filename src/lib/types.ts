// ============================================================
// GSL News Portal — Core Type Definitions
// ============================================================

// --- News Categories ---
export const NEWS_CATEGORIES = [
  "finance",
  "economy",
  "fiscal",
  "local",
  "region",
  "world",
  "wellness",
  "positive",
  "internal",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<NewsCategory, Record<string, string>> = {
  finance: { fr: "Finance", de: "Finanzen", en: "Finance" },
  economy: { fr: "Économie", de: "Wirtschaft", en: "Economy" },
  fiscal: { fr: "Fiscalité", de: "Steuern", en: "Tax & Fiscal" },
  local: { fr: "Local", de: "Lokal", en: "Local" },
  region: { fr: "Grande Région", de: "Großregion", en: "Greater Region" },
  world: { fr: "Monde", de: "Welt", en: "World" },
  wellness: { fr: "Bien-être", de: "Wohlbefinden", en: "Wellness" },
  positive: { fr: "Positive News", de: "Positive Nachrichten", en: "Positive News" },
  internal: { fr: "Interne", de: "Intern", en: "Internal" },
};

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  finance: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  economy: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  fiscal: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  local: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  region: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  world: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  wellness: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  positive: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20",
  internal: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
};

// --- Supported Languages ---
export const SUPPORTED_LOCALES = ["fr", "de", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// --- User Roles ---
export type UserRole = "user" | "editor" | "admin";

// --- News Article (external, fetched automatically) ---
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  category: NewsCategory;
  language: SupportedLocale;
  published_at: string;
  fetched_at: string;
  region: string | null;
  is_featured: boolean;
  reading_time_minutes: number;
}

// --- Internal Article (created by editors/admins) ---
export type ArticleStatus = "draft" | "pending_review" | "published" | "rejected";

export interface InternalArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  category: NewsCategory;
  language: SupportedLocale;
  status: ArticleStatus;
  image_url: string | null;
  attachment_urls: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  review_comment: string | null;
}

// --- User Preferences ---
export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_categories: NewsCategory[];
  preferred_languages: SupportedLocale[];
  preferred_regions: string[];
  email_digest: boolean;
  email_digest_frequency: "daily" | "weekly" | "never";
  created_at: string;
  updated_at: string;
}

// --- User Profile ---
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

// --- RSS Source Configuration ---
export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  language: SupportedLocale;
  region: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
}

// --- Reading History ---
export interface ReadingHistoryEntry {
  id: string;
  user_id: string;
  article_id: string;
  article_type: "external" | "internal";
  read_at: string;
  is_bookmarked: boolean;
}
