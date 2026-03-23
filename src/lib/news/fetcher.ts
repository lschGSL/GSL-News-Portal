// ============================================================
// GSL News Portal — News Fetching Engine
// Hybrid: RSS + API aggregation
// ============================================================

import type { NewsCategory, SupportedLocale } from "@/lib/types";
import { estimateReadingTime } from "@/lib/utils";
import { createHash } from "crypto";

export interface FetchedArticle {
  title: string;
  summary: string;
  content: string | null;
  source_name: string;
  source_url: string;
  source_id: string | null;
  image_url: string | null;
  category: NewsCategory;
  language: SupportedLocale;
  region: string | null;
  published_at: string;
  reading_time_minutes: number;
  external_id: string;
}

// Generate a deterministic ID for deduplication
function generateExternalId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

// ---- RSS Fetching ----
export async function fetchRssFeed(source: {
  name: string;
  url: string;
  category: NewsCategory;
  language: SupportedLocale;
  region: string | null;
  id?: string;
}): Promise<FetchedArticle[]> {
  try {
    // Dynamic import for rss-parser (Node.js only)
    const RSSParser = (await import("rss-parser")).default;
    const parser = new RSSParser({
      timeout: 10000,
      headers: {
        "User-Agent": "GSL-News-Portal/1.0",
      },
    });

    const feed = await parser.parseURL(source.url);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items?.slice(0, 15) ?? []) {
      if (!item.title || !item.link) continue;

      const summary =
        item.contentSnippet?.slice(0, 300) ??
        item.content?.replace(/<[^>]*>/g, "").slice(0, 300) ??
        "";

      const imageMatch = item.content?.match(/<img[^>]+src="([^"]+)"/);
      const imageUrl =
        item.enclosure?.url ??
        (item as Record<string, unknown>)["media:content"]?.toString() ??
        imageMatch?.[1] ??
        null;

      articles.push({
        title: item.title,
        summary,
        content: item.content ?? null,
        source_name: source.name,
        source_url: item.link,
        source_id: source.id ?? null,
        image_url: imageUrl,
        category: source.category,
        language: source.language,
        region: source.region,
        published_at: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        reading_time_minutes: estimateReadingTime(
          item.content?.replace(/<[^>]*>/g, "") ?? summary
        ),
        external_id: generateExternalId(item.link),
      });
    }

    return articles;
  } catch (error) {
    console.error(`[RSS] Error fetching ${source.name} (${source.url}):`, error);
    return [];
  }
}

// ---- GNews API Fetching (free tier) ----
export async function fetchGNewsArticles(params: {
  category?: string;
  query?: string;
  language: SupportedLocale;
  country?: string;
  max?: number;
  targetCategory?: NewsCategory;
}): Promise<FetchedArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    console.warn("[GNews] No API key configured, skipping API fetch");
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      apikey: apiKey,
      lang: params.language,
      max: String(params.max ?? 10),
    });

    if (params.country) searchParams.set("country", params.country);

    let endpoint = "https://gnews.io/api/v4/";
    if (params.query) {
      endpoint += "search";
      searchParams.set("q", params.query);
    } else {
      endpoint += "top-headlines";
      if (params.category) searchParams.set("topic", params.category);
    }

    const res = await fetch(`${endpoint}?${searchParams}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`GNews API ${res.status}: ${res.statusText}`);

    const data = await res.json();
    const categoryMap: Record<string, NewsCategory> = {
      business: "economy",
      finance: "finance",
      world: "world",
      health: "wellness",
      general: "local",
      science: "world",
      technology: "economy",
      entertainment: "positive",
    };

    return (data.articles ?? []).map(
      (article: {
        title: string;
        description: string;
        content: string;
        url: string;
        image: string;
        publishedAt: string;
        source: { name: string };
      }) => ({
        title: article.title,
        summary: article.description ?? "",
        content: article.content ?? null,
        source_name: article.source?.name ?? "GNews",
        source_url: article.url,
        source_id: null,
        image_url: article.image ?? null,
        category: params.targetCategory ?? categoryMap[params.category ?? ""] ?? "world",
        language: params.language,
        region: params.country === "lu" ? "luxembourg" : null,
        published_at: article.publishedAt ?? new Date().toISOString(),
        reading_time_minutes: estimateReadingTime(
          article.content?.replace(/<[^>]*>/g, "") ?? article.description ?? ""
        ),
        external_id: generateExternalId(article.url),
      })
    );
  } catch (error) {
    console.error("[GNews] Error fetching articles:", error);
    return [];
  }
}

// ---- Master Fetch: Orchestrates all sources ----
export async function fetchAllNews(sources: Array<{
  id: string;
  name: string;
  url: string;
  source_type: string;
  category: NewsCategory;
  language: SupportedLocale;
  region: string | null;
}>): Promise<FetchedArticle[]> {
  const rssSources = sources.filter((s) => s.source_type === "rss");

  // Fetch all RSS feeds in parallel (batches of 5 to avoid overwhelming)
  const batchSize = 5;
  const allArticles: FetchedArticle[] = [];

  for (let i = 0; i < rssSources.length; i += batchSize) {
    const batch = rssSources.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((source) =>
        fetchRssFeed({
          name: source.name,
          url: source.url,
          category: source.category,
          language: source.language,
          region: source.region,
          id: source.id,
        })
      )
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }
  }

  // Also fetch from GNews API for each language and category
  const gnewsResults = await Promise.allSettled([
    // Economy & Finance — Luxembourg focus
    fetchGNewsArticles({ language: "fr", country: "lu", category: "business" }),
    fetchGNewsArticles({ language: "de", country: "lu", category: "business" }),
    fetchGNewsArticles({ language: "en", country: "lu", category: "business" }),
    // World news
    fetchGNewsArticles({ language: "fr", category: "world" }),
    fetchGNewsArticles({ language: "en", category: "world" }),
    fetchGNewsArticles({ language: "de", category: "world" }),
    // Fiscal / Tax / Legal — Luxembourg focus
    fetchGNewsArticles({ language: "fr", query: "fiscalité impôts Luxembourg", targetCategory: "fiscal" }),
    fetchGNewsArticles({ language: "fr", query: "CSSF CNPD réglementation Luxembourg", targetCategory: "fiscal" }),
    fetchGNewsArticles({ language: "en", query: "Luxembourg tax regulation CSSF compliance", targetCategory: "fiscal" }),
    fetchGNewsArticles({ language: "fr", query: "TVA Luxembourg AED loi fiscale", targetCategory: "fiscal" }),
    // Wellness / Health
    fetchGNewsArticles({ language: "fr", query: "bien-être santé", targetCategory: "wellness" }),
    fetchGNewsArticles({ language: "de", category: "health" }),
    fetchGNewsArticles({ language: "en", category: "health" }),
    // Positive News
    fetchGNewsArticles({ language: "en", query: "positive good news", targetCategory: "positive" }),
    fetchGNewsArticles({ language: "fr", query: "bonnes nouvelles positif", targetCategory: "positive" }),
    // Grande Région
    fetchGNewsArticles({ language: "fr", query: "Lorraine Metz Thionville", targetCategory: "region" }),
    fetchGNewsArticles({ language: "de", query: "Saarland Trier Großregion", targetCategory: "region" }),
  ]);

  for (const result of gnewsResults) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Deduplicate by external_id
  const seen = new Set<string>();
  return allArticles.filter((article) => {
    if (seen.has(article.external_id)) return false;
    seen.add(article.external_id);
    return true;
  });
}
