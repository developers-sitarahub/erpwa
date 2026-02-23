"use client";

import type React from "react";
import { SidebarProvider } from "@/context/sidebar-provider";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useSidebar } from "@/context/sidebar-provider";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (
      user.role === "vendor_owner" ||
      user.role === "vendor_admin" ||
      user.role === "owner"
    ) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  if (
    user.role === "vendor_owner" ||
    user.role === "vendor_admin" ||
    user.role === "owner"
  ) {
    return null; // Admins use /admin/dashboard
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
