import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Users, Newspaper, Clock } from "lucide-react";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import { SourceManager } from "@/components/admin/source-manager";

export default async function AdminPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/news");

  // Stats
  const [
    { count: totalArticles },
    { count: pendingReviews },
    { count: totalUsers },
    { count: totalSources },
  ] = await Promise.all([
    supabase.from("news_articles").select("*", { count: "exact", head: true }),
    supabase.from("internal_articles").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("news_sources").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  // Pending articles for moderation
  const { data: pendingArticles } = await supabase
    .from("internal_articles")
    .select(`
      *,
      author:profiles!internal_articles_author_id_fkey(full_name, avatar_url)
    `)
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  // Active sources
  const { data: sources } = await supabase
    .from("news_sources")
    .select("*")
    .order("name");

  // Last cron run
  const { data: lastCron } = await supabase
    .from("audit_logs")
    .select("created_at, details")
    .eq("action", "cron_fetch_news")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {t("admin.dashboard")}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-primary/60" />
              <div>
                <p className="text-2xl font-bold">{totalArticles ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("admin.totalArticles")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-amber-500/60" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("admin.pendingReviews")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-500/60" />
              <div>
                <p className="text-2xl font-bold">{totalUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("admin.totalUsers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500/60" />
              <div>
                <p className="text-2xl font-bold">{totalSources ?? 0}</p>
                <p className="text-xs text-muted-foreground">Sources actives</p>
              </div>
            </div>
            {lastCron && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Dernier cron:{" "}
                {new Date(lastCron.created_at).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("admin.pendingReviews")}</h2>
        <ModerationQueue articles={pendingArticles ?? []} />
      </section>

      {/* Source Management */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("admin.manageSources")}</h2>
        <SourceManager sources={sources ?? []} />
      </section>
    </div>
  );
}
