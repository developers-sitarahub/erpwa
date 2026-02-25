"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-provider";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "react-toastify";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

const topMenuItems: NavItem[] = [
  { href: "/admin-super/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

const bottomMenuItems: NavItem[] = [
  { href: "/admin-super/settings", icon: Settings, label: "Settings" },
];

export function SidebarSuperAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [requestedCount, setRequestedCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch pending vendor count for badge
  useEffect(() => {
    api
      .get("/super-admin/vendors")
      .then((r) => {
        const count = r.data.filter(
          (v: {
            whatsappStatus: string;
            owner?: { onboardingStatus: string } | null;
          }) =>
            v.owner !== null &&
            v.owner?.onboardingStatus !== "activated" &&
            v.whatsappStatus !== "connected",
        ).length;
        setRequestedCount(count);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/super-admin/logout");
      router.push("/admin-login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const renderItem = (
    { href, icon: Icon, label, badge }: NavItem,
    collapsed = false,
  ) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <div key={href} className="group relative">
        <Link
          href={href}
          onClick={() => {
            if (isMobile) setIsMobileOpen(false);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? label : undefined}
        >
          <Icon className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate flex-1">{label}</span>}
          {/* Badge */}
          {!collapsed && badge !== undefined && badge > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
              {badge}
            </span>
          )}
          {/* Badge (collapsed — dot) */}
          {collapsed && badge !== undefined && badge > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </Link>

        {collapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-sidebar-foreground text-sidebar px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap flex items-center gap-1.5">
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                  {badge}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const vendorGroup = (collapsed = false) => (
    <div className="space-y-0.5">
      {/* Group label */}
      {!collapsed && (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Vendors
        </p>
      )}
      {collapsed && <div className="border-t border-sidebar-border/50 my-1" />}
      {renderItem(
        {
          href: "/admin-super/vendors/requested",
          icon: Clock,
          label: "Requested",
          badge: requestedCount,
        },
        collapsed,
      )}
      {renderItem(
        {
          href: "/admin-super/vendors/activated",
          icon: ShieldCheck,
          label: "Activated",
        },
        collapsed,
      )}
    </div>
  );

  const logoutBtn = (collapsed = false) => (
    <button
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-sidebar-accent/50 w-full text-sidebar-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <LogOut className="w-5 h-5" />
      {!collapsed && "Logout"}
    </button>
  );

  /* ---- MOBILE ---- */
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen((v) => !v)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground md:hidden"
        >
          {isMobileOpen ? <X /> : <Menu />}
        </button>

        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-center px-2 h-16 border-b border-sidebar-border">
            <Logo className="h-12 w-full max-w-[220px]" />
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {topMenuItems.map((item) => renderItem(item, false))}
            {vendorGroup(false)}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            {bottomMenuItems.map((item) => renderItem(item, false))}
            {logoutBtn(false)}
          </div>
        </aside>
      </>
    );
  }

  /* ---- DESKTOP ---- */
  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-2 h-16 border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "justify-center w-full" : "justify-start pl-4 flex-1",
          )}
        >
          <Logo
            collapsed={isCollapsed}
            isSidebar={true}
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-12 w-12" : "h-12 w-full max-w-[220px]",
            )}
          />
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent ml-1"
          >
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute right-2 top-5 p-1.5 rounded-lg hover:bg-sidebar-accent"
          >
            <ChevronRight className="w-4 h-4 rotate-180 text-sidebar-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {topMenuItems.map((item) => renderItem(item, isCollapsed))}
        {vendorGroup(isCollapsed)}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomMenuItems.map((item) => renderItem(item, isCollapsed))}
        {logoutBtn(isCollapsed)}
      </div>
    </aside>
  );
}

export default SidebarSuperAdmin;
