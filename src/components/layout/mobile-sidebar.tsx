"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Newspaper,
  Rss,
  FileText,
  PenSquare,
  Shield,
  Settings,
  Bookmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/types";

interface MobileSidebarProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ user, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor" || isAdmin;

  const navigation = [
    { name: t("nav.news"), href: "/news", icon: Newspaper },
    ...(user
      ? [{ name: t("nav.myFeed"), href: "/news?view=feed", icon: Rss }]
      : []),
    { name: t("nav.internal"), href: "/articles", icon: FileText },
    ...(user
      ? [{ name: t("nav.preferences"), href: "/preferences", icon: Bookmark }]
      : []),
  ];

  const editorNavigation = [
    { name: t("nav.newArticle"), href: "/articles/new", icon: PenSquare },
  ];

  const adminNavigation = [
    { name: t("nav.admin"), href: "/admin", icon: Shield },
    { name: t("nav.settings"), href: "/admin/settings", icon: Settings },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar panel */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-sidebar-background shadow-xl">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-sm text-sidebar-foreground">
              {t("common.appName")}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.news")}
          </div>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          {isEditor && (
            <>
              <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {t("nav.editor")}
              </div>
              {editorNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
          {isAdmin && (
            <>
              <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Administration
              </div>
              {adminNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        {user && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground">
                {user.full_name?.[0]?.toUpperCase() ||
                  user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.full_name || user.email}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
