"use client";

import { LogOut, User, Menu, Sun, Moon, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <>
      <MobileSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/gsl-logo.svg" alt="GSL" className="h-7 w-7" />
            <span className="font-bold text-sm">{t("common.appName")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
              <div className="absolute right-0 top-full mt-1 rounded-lg border bg-popover p-1 shadow-lg z-50">
                {["fr", "de", "en"].map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className="block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    {l === "fr"
                      ? "Fran\u00e7ais"
                      : l === "de"
                        ? "Deutsch"
                        : "English"}
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

          {/* User info & sign out */}
          {user ? (
            <>
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {user.full_name || user.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.signOut")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => router.push("/login")}
            >
              {t("auth.login")}
            </Button>
          )}
        </div>
      </header>
    </>
  );
}
