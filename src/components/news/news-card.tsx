"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, CATEGORY_COLORS, type NewsArticle, type InternalArticle } from "@/lib/types";
import { formatRelativeDate, truncateText } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: NewsArticle | InternalArticle;
  type: "external" | "internal";
  isBookmarked?: boolean;
  onBookmark?: () => void;
  featured?: boolean;
}

export function NewsCard({
  article,
  type,
  isBookmarked = false,
  onBookmark,
  featured = false,
}: NewsCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const category = article.category;
  const categoryLabel = CATEGORY_LABELS[category]?.[locale] ?? category;
  const categoryColor = CATEGORY_COLORS[category] ?? "";

  const publishedAt =
    type === "external"
      ? (article as NewsArticle).published_at
      : (article as InternalArticle).published_at ?? (article as InternalArticle).created_at;

  const sourceName =
    type === "external"
      ? (article as NewsArticle).source_name
      : (article as InternalArticle).author_name;

  const readingTime =
    type === "external"
      ? (article as NewsArticle).reading_time_minutes
      : null;

  const articleUrl =
    type === "external"
      ? (article as NewsArticle).source_url
      : `/articles/${article.id}`;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md hover:border-primary/20",
        featured && "md:col-span-2 md:row-span-2"
      )}
    >
      <a
        href={articleUrl}
        target={type === "external" ? "_blank" : undefined}
        rel={type === "external" ? "noopener noreferrer" : undefined}
        className="flex flex-col h-full"
      >
        {/* Image */}
        {article.image_url && (
          <div className={cn("relative overflow-hidden bg-muted", featured ? "h-56" : "h-40")}>
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Category & Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("border text-[11px] font-medium", categoryColor)} variant="outline">
              {categoryLabel}
            </Badge>
            {article.language && article.language !== locale && (
              <Badge variant="outline" className="text-[11px]">
                {article.language.toUpperCase()}
              </Badge>
            )}
            {type === "external" && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {sourceName}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-semibold leading-snug group-hover:text-primary transition-colors",
              featured ? "text-xl" : "text-sm"
            )}
          >
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {truncateText(article.summary, featured ? 200 : 120)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatRelativeDate(publishedAt, locale)}</span>
              {readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime} min
                </span>
              )}
            </div>
            {onBookmark && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookmark();
                }}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </a>
    </Card>
  );
}
