"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { setSuperAdminAccessToken, getSuperAdminAccessToken } from "@/lib/api";
import { SidebarSuperAdmin } from "@/components/sidebar-super-admin";
import { HeaderSuperAdmin } from "@/components/header-super-admin";
import { SidebarProvider, useSidebar } from "@/context/sidebar-provider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restoreSASession = async () => {
      // If we already have a token in memory, just verify it
      if (getSuperAdminAccessToken()) {
        try {
          await api.get("/super-admin/me");
          if (!cancelled) setSessionReady(true);
          return;
        } catch {
          // Token might be expired, try refresh below
        }
      }

      // No token in memory — try refreshing via the saRefreshToken cookie
      try {
        const res = await api.post<{ accessToken: string }>("/super-admin/refresh");
        setSuperAdminAccessToken(res.data.accessToken);
        if (!cancelled) setSessionReady(true);
      } catch {
        // No valid session at all — redirect to login
        if (!cancelled) {
          setSuperAdminAccessToken(null);
          router.replace("/admin-login");
        }
      }
    };

    restoreSASession();

    const handleSALogout = () => {
      setSuperAdminAccessToken(null);
      router.replace("/admin-login");
    };

    window.addEventListener("sa:auth:logout", handleSALogout);
    return () => {
      cancelled = true;
      window.removeEventListener("sa:auth:logout", handleSALogout);
    };
  }, [router]);

  if (!sessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarSuperAdmin />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-20 ${
          !isCollapsed ? "md:ml-64" : ""
        }`}
      >
        <HeaderSuperAdmin />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
