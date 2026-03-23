"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Newspaper,
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  PenSquare,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";

interface HeaderProps {
  user: UserProfile | null;
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setLangOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor" || isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/news" className="flex items-center gap-2 font-bold text-lg">
          <Newspaper className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t("common.appName")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/news">
            <Button variant="ghost" size="sm">
              {t("nav.news")}
            </Button>
          </Link>
          {user && (
            <Link href="/news?view=feed">
              <Button variant="ghost" size="sm">
                {t("nav.myFeed")}
              </Button>
            </Link>
          )}
          <Link href="/articles">
            <Button variant="ghost" size="sm">
              {t("nav.internal")}
            </Button>
          </Link>
          {isEditor && (
            <Link href="/articles/new">
              <Button variant="ghost" size="sm">
                <PenSquare className="h-4 w-4 mr-1" />
                {t("nav.newArticle")}
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                {t("nav.admin")}
              </Button>
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLangOpen(!langOpen)}
            >
              <Languages className="h-4 w-4" />
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-lg border bg-popover p-1 shadow-lg">
                {["fr", "de", "en"].map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className="block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    {l === "fr" ? "Français" : l === "de" ? "Deutsch" : "English"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Menu */}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/preferences">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">{t("common.signOut")}</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">{t("auth.login")}</Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t md:hidden">
          <nav className="flex flex-col p-4 gap-1">
            <Link href="/news" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t("nav.news")}
              </Button>
            </Link>
            {user && (
              <Link href="/news?view=feed" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  {t("nav.myFeed")}
                </Button>
              </Link>
            )}
            <Link href="/articles" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t("nav.internal")}
              </Button>
            </Link>
            {isEditor && (
              <Link href="/articles/new" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <PenSquare className="h-4 w-4 mr-2" />
                  {t("nav.newArticle")}
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  {t("nav.admin")}
                </Button>
              </Link>
            )}
            {user && (
              <>
                <Link href="/preferences" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    {t("nav.preferences")}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("common.signOut")}
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
