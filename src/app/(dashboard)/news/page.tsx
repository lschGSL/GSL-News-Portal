import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NewsFeed, NewsFeedSkeleton } from "@/components/news/news-feed";
import { Clock, Sparkles } from "lucide-react";
import type { NewsArticle, UserPreferences } from "@/lib/types";

export default async function NewsPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load user preferences if logged in
  let preferences: UserPreferences | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();
    preferences = data;
  }

  // Fetch initial articles
  let query = supabase
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(20);

  // Apply preferences for personalized feed
  if (preferences?.preferred_categories?.length) {
    query = query.in("category", preferences.preferred_categories);
  }
  if (preferences?.preferred_languages?.length) {
    query = query.in("language", preferences.preferred_languages);
  }

  const { data: articles } = await query;

  // Get last fetch time
  const { data: lastAudit } = await supabase
    .from("audit_logs")
    .select("created_at")
    .eq("action", "cron_fetch_news")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const lastUpdate = lastAudit?.created_at
    ? new Date(lastAudit.created_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Determine next update time
  const now = new Date();
  const hour = now.getHours();
  const nextUpdateLabel = hour < 6
    ? t("news.morningEdition")
    : hour < 13
    ? t("news.afternoonEdition")
    : t("news.morningEdition");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {preferences
              ? t("news.personalizedFeed")
              : t("news.latestNews")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Luxembourg & Grande Région
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {lastUpdate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("news.lastUpdate")}: {lastUpdate}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1">
            {t("news.nextUpdate")}: {nextUpdateLabel}
          </span>
        </div>
      </div>

      {/* News Feed */}
      <Suspense fallback={<NewsFeedSkeleton />}>
        <NewsFeed
          initialArticles={(articles as NewsArticle[]) ?? []}
          preferences={preferences}
          userId={user?.id}
        />
      </Suspense>
    </div>
  );
}
