import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar user={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={profile} />
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
        <footer className="border-t py-4">
          <div className="px-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GSL Group. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
