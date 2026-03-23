"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Rss, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, type NewsCategory, type SupportedLocale } from "@/lib/types";

interface Source {
  id: string;
  name: string;
  url: string;
  source_type: string;
  category: string;
  language: string;
  region: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
}

export function SourceManager({ sources }: { sources: Source[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // New source form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<NewsCategory>("local");
  const [language, setLanguage] = useState<SupportedLocale>("fr");
  const [region, setRegion] = useState("");

  const handleAdd = async () => {
    if (!name || !url) return;
    setProcessing("add");
    const supabase = createClient();

    await supabase.from("news_sources").insert({
      name,
      url,
      source_type: "rss",
      category,
      language,
      region: region || null,
      is_active: true,
    });

    setName("");
    setUrl("");
    setShowAdd(false);
    setProcessing(null);
    router.refresh();
  };

  const toggleSource = async (id: string, active: boolean) => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from("news_sources").update({ is_active: !active }).eq("id", id);
    setProcessing(null);
    router.refresh();
  };

  const deleteSource = async (id: string) => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from("news_sources").delete().eq("id", id);
    setProcessing(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {/* Add Source Form */}
      {showAdd ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={t("admin.sourceName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder={t("admin.sourceUrl")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="h-9 rounded-lg border bg-transparent px-3 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
                  <option key={key} value={key}>
                    {labels[locale] ?? key}
                  </option>
                ))}
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
                className="h-9 rounded-lg border bg-transparent px-3 text-sm"
              >
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
            <Input
              placeholder={t("admin.sourceRegion") + " (optional)"}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={processing === "add"}>
                {processing === "add" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1" />
                )}
                {t("admin.addSource")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.addSource")}
        </Button>
      )}

      {/* Sources List */}
      <div className="space-y-2">
        {sources.map((source) => (
          <Card key={source.id} className={!source.is_active ? "opacity-50" : ""}>
            <CardContent className="py-3 flex items-center gap-3">
              <Rss className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{source.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {CATEGORY_LABELS[source.category as keyof typeof CATEGORY_LABELS]?.[locale] ?? source.category}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {source.language.toUpperCase()}
                  </Badge>
                  {source.region && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {source.region}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{source.url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleSource(source.id, source.is_active)}
                  disabled={processing === source.id}
                >
                  {source.is_active ? (
                    <Power className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteSource(source.id)}
                  disabled={processing === source.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
