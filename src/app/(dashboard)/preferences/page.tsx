"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { NEWS_CATEGORIES, CATEGORY_LABELS, type NewsCategory, type SupportedLocale } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGIONS = [
  { id: "luxembourg", label: { fr: "Luxembourg", de: "Luxemburg", en: "Luxembourg" } },
  { id: "lorraine", label: { fr: "Lorraine", de: "Lothringen", en: "Lorraine" } },
  { id: "saarland", label: { fr: "Sarre", de: "Saarland", en: "Saarland" } },
  { id: "rhineland", label: { fr: "Rhénanie-Palatinat", de: "Rheinland-Pfalz", en: "Rhineland-Palatinate" } },
  { id: "wallonia", label: { fr: "Wallonie", de: "Wallonien", en: "Wallonia" } },
  { id: "trier", label: { fr: "Trèves", de: "Trier", en: "Trier" } },
];

const LANGUAGES = [
  { id: "fr" as SupportedLocale, label: "Français" },
  { id: "de" as SupportedLocale, label: "Deutsch" },
  { id: "en" as SupportedLocale, label: "English" },
];

const FREQUENCIES = [
  { id: "daily", labelKey: "preferences.daily" },
  { id: "weekly", labelKey: "preferences.weekly" },
  { id: "never", labelKey: "preferences.never" },
];

export default function PreferencesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [languages, setLanguages] = useState<SupportedLocale[]>(["fr"]);
  const [regions, setRegions] = useState<string[]>(["luxembourg"]);
  const [emailDigest, setEmailDigest] = useState(false);
  const [frequency, setFrequency] = useState("never");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCategories(data.preferred_categories ?? []);
        setLanguages(data.preferred_languages ?? ["fr"]);
        setRegions(data.preferred_regions ?? ["luxembourg"]);
        setEmailDigest(data.email_digest ?? false);
        setFrequency(data.email_digest_frequency ?? "never");
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleItem = <T extends string>(list: T[], item: T, setter: (v: T[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        preferred_categories: categories,
        preferred_languages: languages,
        preferred_regions: regions,
        email_digest: emailDigest,
        email_digest_frequency: frequency,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const visibleCategories = NEWS_CATEGORIES.filter((c) => c !== "internal");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("preferences.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("preferences.subtitle")}</p>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("preferences.categories")}</CardTitle>
          <CardDescription>{t("preferences.categoriesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((cat) => (
              <Button
                key={cat}
                variant={categories.includes(cat) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleItem(categories, cat, setCategories)}
              >
                {categories.includes(cat) && <Check className="h-3.5 w-3.5 mr-1" />}
                {CATEGORY_LABELS[cat]?.[locale] ?? cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("preferences.languages")}</CardTitle>
          <CardDescription>{t("preferences.languagesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.id}
                variant={languages.includes(lang.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleItem(languages, lang.id, setLanguages)}
              >
                {languages.includes(lang.id) && <Check className="h-3.5 w-3.5 mr-1" />}
                {lang.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("preferences.regions")}</CardTitle>
          <CardDescription>{t("preferences.regionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <Button
                key={region.id}
                variant={regions.includes(region.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleItem(regions, region.id, setRegions)}
              >
                {regions.includes(region.id) && <Check className="h-3.5 w-3.5 mr-1" />}
                {region.label[locale as keyof typeof region.label] ?? region.id}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("preferences.emailDigest")}</CardTitle>
          <CardDescription>{t("preferences.emailDigestDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEmailDigest(!emailDigest)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                emailDigest ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
                  emailDigest ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <span className="text-sm">{t("preferences.emailDigest")}</span>
          </div>
          {emailDigest && (
            <div className="flex gap-2">
              {FREQUENCIES.filter((f) => f.id !== "never").map((freq) => (
                <Button
                  key={freq.id}
                  variant={frequency === freq.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFrequency(freq.id)}
                >
                  {t(freq.labelKey)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? t("preferences.saved") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
