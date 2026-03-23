import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NewsCard } from "@/components/news/news-card";
import { Button } from "@/components/ui/button";
import { PenSquare, FileText } from "lucide-react";
import Link from "next/link";
import type { InternalArticle } from "@/lib/types";

export default async function ArticlesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch published internal articles
  const { data: articles } = await supabase
    .from("internal_articles")
    .select(`
      *,
      author:profiles!internal_articles_author_id_fkey(full_name, avatar_url)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  // Get user profile for role check
  let isEditor = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isEditor = profile?.role === "editor" || profile?.role === "admin";
  }

  // Get user's drafts if editor
  let myDrafts: InternalArticle[] = [];
  if (user && isEditor) {
    const { data } = await supabase
      .from("internal_articles")
      .select(`
        *,
        author:profiles!internal_articles_author_id_fkey(full_name, avatar_url)
      `)
      .eq("author_id", user.id)
      .neq("status", "published")
      .order("updated_at", { ascending: false });
    myDrafts = (data ?? []).map((d) => ({
      ...d,
      author_name: (d.author as Record<string, string>)?.full_name ?? "",
      author_avatar_url: (d.author as Record<string, string>)?.avatar_url ?? null,
    })) as InternalArticle[];
  }

  const publishedArticles = (articles ?? []).map((a) => ({
    ...a,
    author_name: (a.author as Record<string, string>)?.full_name ?? "",
    author_avatar_url: (a.author as Record<string, string>)?.avatar_url ?? null,
  })) as InternalArticle[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t("articles.title")}
          </h1>
        </div>
        {isEditor && (
          <Link href="/articles/new">
            <Button>
              <PenSquare className="h-4 w-4 mr-2" />
              {t("articles.newArticle")}
            </Button>
          </Link>
        )}
      </div>

      {/* User's Drafts */}
      {myDrafts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Mes articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myDrafts.map((article) => (
              <div key={article.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      article.status === "draft"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : article.status === "pending_review"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        : "bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {t(`articles.status.${article.status}`)}
                  </span>
                </div>
                <Link href={`/articles/${article.id}/edit`}>
                  <NewsCard article={article} type="internal" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Published Articles */}
      <section>
        {publishedArticles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("common.noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedArticles.map((article) => (
              <NewsCard key={article.id} article={article} type="internal" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
