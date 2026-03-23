import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string, locale: string = "fr"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const labels: Record<string, Record<string, string>> = {
    justNow: { fr: "À l'instant", de: "Gerade eben", en: "Just now" },
    minutesAgo: { fr: "min", de: "Min", en: "min ago" },
    hoursAgo: { fr: "h", de: "Std", en: "h ago" },
    daysAgo: { fr: "j", de: "T", en: "d ago" },
  };

  if (diffMinutes < 1) return labels.justNow[locale] ?? labels.justNow.en;
  if (diffMinutes < 60) return `${diffMinutes} ${labels.minutesAgo[locale] ?? labels.minutesAgo.en}`;
  if (diffHours < 24) return `${diffHours} ${labels.hoursAgo[locale] ?? labels.hoursAgo.en}`;
  if (diffDays < 7) return `${diffDays} ${labels.daysAgo[locale] ?? labels.daysAgo.en}`;

  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
