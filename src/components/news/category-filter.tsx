"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  Receipt,
  MapPin,
  Globe,
  Earth,
  Heart,
  Sun,
  Building2,
  Briefcase,
} from "lucide-react";
import { NEWS_CATEGORIES, CATEGORY_LABELS, type NewsCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  finance: TrendingUp,
  economy: BarChart3,
  fiscal: Receipt,
  local: MapPin,
  region: Globe,
  world: Earth,
  wellness: Heart,
  positive: Sun,
  professional: Briefcase,
  internal: Building2,
};

interface CategoryFilterProps {
  selectedCategory: NewsCategory | "all";
  onSelect: (category: NewsCategory | "all") => void;
  showInternal?: boolean;
}

export function CategoryFilter({
  selectedCategory,
  onSelect,
  showInternal = false,
}: CategoryFilterProps) {
  const t = useTranslations();
  const locale = useLocale();

  const categories = showInternal
    ? NEWS_CATEGORIES
    : NEWS_CATEGORIES.filter((c) => c !== "internal");

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        size="sm"
        className="shrink-0 text-xs"
        onClick={() => onSelect("all")}
      >
        {t("common.all")}
      </Button>
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat];
        return (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            className={cn("shrink-0 text-xs gap-1.5")}
            onClick={() => onSelect(cat)}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {CATEGORY_LABELS[cat]?.[locale] ?? cat}
          </Button>
        );
      })}
    </div>
  );
}
