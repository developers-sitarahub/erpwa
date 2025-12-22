"use client";

import type React from "react";
import { SidebarAdmin } from "@/components/sidebar-admin";
import { HeaderAdmin } from "@/components/header-admin";
import { SidebarProvider } from "@/context/sidebar-provider";
import { useSidebar } from "@/context/sidebar-provider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      <SidebarAdmin />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-20 ${
          !isCollapsed ? "md:ml-64" : ""
        }`}
      >
        <HeaderAdmin />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
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
