import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";
import { estimateReadingTime, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("internal_articles")
    .select(`
      *,
      author:profiles!internal_articles_author_id_fkey(full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (!article) notFound();

  const author = article.author as Record<string, string> | null;
  const readingTime = estimateReadingTime(article.content ?? "");
  const locale = "fr";

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/articles">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </Link>

      {/* Cover Image */}
      {article.image_url && (
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          className={cn(
            "border",
            CATEGORY_COLORS[article.category as keyof typeof CATEGORY_COLORS] ?? ""
          )}
          variant="outline"
        >
          {CATEGORY_LABELS[article.category as keyof typeof CATEGORY_LABELS]?.[locale] ?? article.category}
        </Badge>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {author?.full_name ?? "Unknown"}
        </span>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatRelativeDate(article.published_at ?? article.created_at, locale)}
        </span>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {readingTime} min
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>

      {/* Summary */}
      {article.summary && (
        <p className="text-lg text-muted-foreground leading-relaxed">
          {article.summary}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Attachments */}
      {article.attachment_urls?.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-3">{t("articles.attachments")}</h3>
          <div className="space-y-2">
            {article.attachment_urls.map((url: string, i: number) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
