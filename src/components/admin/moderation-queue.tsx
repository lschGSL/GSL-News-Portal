"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeDate } from "@/lib/utils";

interface ModerationArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  language: string;
  created_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
}

export function ModerationQueue({ articles }: { articles: ModerationArticle[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("common.noResults")}
        </CardContent>
      </Card>
    );
  }

  const handleAction = async (articleId: string, action: "published" | "rejected") => {
    setProcessing(articleId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("internal_articles")
      .update({
        status: action,
        reviewed_by: user?.id,
        review_comment: comments[articleId] || null,
        published_at: action === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    setProcessing(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const author = article.author as { full_name: string } | null;
        return (
          <Card key={article.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{author?.full_name ?? "Unknown"}</span>
                    <span>·</span>
                    <span>{formatRelativeDate(article.created_at)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {article.language.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <a href={`/articles/${article.id}`} target="_blank">
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </a>
              </div>
              <Textarea
                placeholder={t("admin.reviewComment") + "..."}
                value={comments[article.id] ?? ""}
                onChange={(e) =>
                  setComments((prev) => ({ ...prev, [article.id]: e.target.value }))
                }
                rows={2}
                className="text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  disabled={processing === article.id}
                  onClick={() => handleAction(article.id, "rejected")}
                >
                  {processing === article.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <X className="h-3.5 w-3.5 mr-1" />
                  )}
                  {t("admin.reject")}
                </Button>
                <Button
                  size="sm"
                  disabled={processing === article.id}
                  onClick={() => handleAction(article.id, "published")}
                >
                  {processing === article.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  {t("admin.approve")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
