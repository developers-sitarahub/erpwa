"use client";

import { Bell, User, LogOut, ShieldCheck, Settings } from "lucide-react";
import { Button } from "@/components/button";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";

const pageTitles: Record<string, string> = {
  "/admin-super/dashboard": "Super Admin Dashboard",
  "/admin-super/vendors": "Vendors",
  "/admin-super/settings": "Settings",
};

export function HeaderSuperAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path),
    )?.[1] ?? "Super Admin";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/super-admin/logout");
      router.push("/admin-login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <header className="border-b border-sidebar-border bg-card sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4 h-16">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>

        <div className="flex items-center gap-4 ml-auto">
          {/* Notification bell (decorative, same as main admin) */}
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <Bell className="w-5 h-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <User className="w-5 h-5" />
              <span className="sr-only">User menu</span>
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Super Admin
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Platform Administrator
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/admin-super/settings")}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderSuperAdmin;
