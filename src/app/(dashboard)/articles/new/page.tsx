"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Save, Send, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { createClient } from "@/lib/supabase/client";
import { NEWS_CATEGORIES, CATEGORY_LABELS, type NewsCategory, type SupportedLocale } from "@/lib/types";
import Link from "next/link";

export default function NewArticlePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsCategory>("internal");
  const [language, setLanguage] = useState<SupportedLocale>(locale as SupportedLocale);
  const [imageUrl, setImageUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (submitForReview: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: dbError } = await supabase.from("internal_articles").insert({
      title,
      summary,
      content,
      author_id: user.id,
      category,
      language,
      status: submitForReview ? "pending_review" : "draft",
      image_url: imageUrl || null,
      attachment_urls: attachments,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push("/articles");
    router.refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(fileName, file);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(data.path);

    setAttachments((prev) => [...prev, urlData.publicUrl]);
  };

  const categories = NEWS_CATEGORIES.filter((c) => c !== "internal");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("articles.newArticle")}</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("articles.articleTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={t("articles.articleTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />

          <Textarea
            placeholder={t("articles.summary")}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t("articles.category")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="w-full h-9 rounded-lg border bg-transparent px-3 text-sm"
              >
                <option value="internal">
                  {CATEGORY_LABELS.internal[locale] ?? "Internal"}
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]?.[locale] ?? cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t("articles.language")}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
                className="w-full h-9 rounded-lg border bg-transparent px-3 text-sm"
              >
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t("articles.coverImage")}</label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("articles.content")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder={t("articles.content") + "..."}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("articles.attachments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:bg-accent transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("articles.uploadFile")}</span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            />
          </label>
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-sm rounded-lg bg-muted p-2">
                  <span className="truncate flex-1">{url.split("/").pop()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t("articles.saveDraft")}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          {t("articles.submitForReview")}
        </Button>
      </div>
    </div>
  );
}
