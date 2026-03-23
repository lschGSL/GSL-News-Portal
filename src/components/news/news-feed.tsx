"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { NewsCard } from "./news-card";
import { CategoryFilter } from "./category-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { NewsArticle, NewsCategory, UserPreferences } from "@/lib/types";

interface NewsFeedProps {
  initialArticles: NewsArticle[];
  preferences?: UserPreferences | null;
  userId?: string;
}

export function NewsFeed({ initialArticles, preferences, userId }: NewsFeedProps) {
  const t = useTranslations();
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>(initialArticles);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 20;

  // Apply filters
  useEffect(() => {
    let result = articles;

    if (selectedCategory !== "all") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.source_name.toLowerCase().includes(q)
      );
    }

    setFilteredArticles(result);
  }, [articles, selectedCategory, searchQuery]);

  // Load bookmarks
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("reading_history")
      .select("article_id")
      .eq("user_id", userId)
      .eq("is_bookmarked", true)
      .then(({ data }) => {
        if (data) {
          setBookmarks(new Set(data.map((r) => r.article_id)));
        }
      });
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const supabase = createClient();
    const from = page * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .range(from, to);

    // Apply user preferences for personalized feed
    if (preferences?.preferred_categories?.length) {
      query = query.in("category", preferences.preferred_categories);
    }
    if (preferences?.preferred_languages?.length) {
      query = query.in("language", preferences.preferred_languages);
    }

    const { data, error } = await query;

    if (!error && data) {
      setArticles((prev) => [...prev, ...(data as NewsArticle[])]);
      setPage((p) => p + 1);
      if (data.length < perPage) setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, page, preferences]);

  const handleBookmark = async (articleId: string) => {
    if (!userId) return;
    const supabase = createClient();
    const isCurrentlyBookmarked = bookmarks.has(articleId);

    if (isCurrentlyBookmarked) {
      setBookmarks((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      await supabase
        .from("reading_history")
        .update({ is_bookmarked: false })
        .eq("user_id", userId)
        .eq("article_id", articleId);
    } else {
      setBookmarks((prev) => new Set(prev).add(articleId));
      await supabase.from("reading_history").upsert(
        {
          user_id: userId,
          article_id: articleId,
          article_type: "external",
          is_bookmarked: true,
        },
        { onConflict: "user_id,article_id,article_type" }
      );
    }
  };

  const refreshFeed = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(perPage);

    if (preferences?.preferred_categories?.length) {
      query = query.in("category", preferences.preferred_categories);
    }
    if (preferences?.preferred_languages?.length) {
      query = query.in("language", preferences.preferred_languages);
    }

    const { data } = await query;
    if (data) {
      setArticles(data as NewsArticle[]);
      setPage(1);
      setHasMore(true);
    }
    setLoading(false);
  };

  // Featured article (first one)
  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={refreshFeed} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("common.noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Featured Card */}
          {featured && (
            <NewsCard
              key={featured.id}
              article={featured}
              type="external"
              featured
              isBookmarked={bookmarks.has(featured.id)}
              onBookmark={userId ? () => handleBookmark(featured.id) : undefined}
            />
          )}
          {/* Rest */}
          {rest.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              type="external"
              isBookmarked={bookmarks.has(article.id)}
              onBookmark={userId ? () => handleBookmark(article.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && filteredArticles.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {loading ? t("common.loading") : t("common.readMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function NewsFeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 md:col-span-2 md:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
