"use client";

import type React from "react";
import { SidebarSuperAdmin } from "@/components/sidebar-super-admin";
import { HeaderSuperAdmin } from "@/components/header-super-admin";
import { SidebarProvider, useSidebar } from "@/context/sidebar-provider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

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
