// ============================================================
// GSL News Portal — Cron Job: Fetch News
// Runs at 06:00 and 13:00 CET via Vercel Cron
// ============================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllNews } from "@/lib/news/fetcher";
import { DEFAULT_RSS_SOURCES } from "@/lib/news/rss-sources";

export const maxDuration = 60; // Allow up to 60s for fetching
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Load configured sources from DB
    const { data: dbSources } = await supabase
      .from("news_sources")
      .select("*")
      .eq("is_active", true);

    // 2. If no sources in DB yet, use defaults
    let sources = dbSources;
    if (!sources || sources.length === 0) {
      // Seed default sources into DB
      const { data: seeded } = await supabase
        .from("news_sources")
        .upsert(
          DEFAULT_RSS_SOURCES.map((s) => ({
            name: s.name,
            url: s.url,
            source_type: "rss",
            category: s.category,
            language: s.language,
            region: s.region,
            is_active: true,
          })),
          { onConflict: "url", ignoreDuplicates: true }
        )
        .select();
      sources = seeded ?? [];
    }

    // 3. Fetch all articles
    const articles = await fetchAllNews(sources);
    console.log(`[Cron] Fetched ${articles.length} articles from ${sources.length} sources`);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new articles found",
        fetched: 0,
      });
    }

    // 4. Upsert into DB (deduplicate by external_id)
    const { data: inserted, error } = await supabase
      .from("news_articles")
      .upsert(
        articles.map((a) => ({
          title: a.title,
          summary: a.summary,
          content: a.content,
          source_name: a.source_name,
          source_url: a.source_url,
          source_id: a.source_id,
          image_url: a.image_url,
          category: a.category,
          language: a.language,
          region: a.region,
          published_at: a.published_at,
          fetched_at: new Date().toISOString(),
          reading_time_minutes: a.reading_time_minutes,
          external_id: a.external_id,
        })),
        { onConflict: "external_id", ignoreDuplicates: true }
      )
      .select("id");

    if (error) {
      console.error("[Cron] DB insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Update last_fetched_at on sources
    await supabase
      .from("news_sources")
      .update({ last_fetched_at: new Date().toISOString(), fetch_error: null })
      .in("id", sources.map((s: { id: string }) => s.id));

    // 6. Log the cron run
    await supabase.from("audit_logs").insert({
      action: "cron_fetch_news",
      details: {
        sources_count: sources.length,
        articles_fetched: articles.length,
        articles_inserted: inserted?.length ?? 0,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      sources: sources.length,
      fetched: articles.length,
      inserted: inserted?.length ?? 0,
    });
  } catch (error) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
