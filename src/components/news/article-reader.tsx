"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, ExternalLink, Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArticleReaderProps {
  url: string;
  title: string;
  sourceName: string;
  onClose: () => void;
}

export function ArticleReader({ url, title, sourceName, onClose }: ArticleReaderProps) {
  const t = useTranslations();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm",
        isFullscreen ? "p-0" : "p-0 sm:p-4 lg:p-8"
      )}
    >
      {/* Header toolbar */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2 border-b bg-background shrink-0",
          isFullscreen ? "" : "sm:rounded-t-lg"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{title}</p>
            <Badge variant="outline" className="text-[10px] mt-0.5">
              {sourceName}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" title={t("news.openOriginal")}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div
        className={cn(
          "flex-1 overflow-hidden bg-white dark:bg-zinc-900",
          isFullscreen ? "" : "sm:rounded-b-lg sm:border-x sm:border-b"
        )}
      >
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <p className="text-muted-foreground">{t("news.cannotEmbed")}</p>
            <Button asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("news.openOriginal")}
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={url}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onError={() => setIframeError(true)}
          />
        )}
      </div>
    </div>
  );
}
