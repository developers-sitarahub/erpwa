"use client";

import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/button";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/authContext";

export function HeaderAdmin() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const showSearch = pathname === "/admin/dashboard";
  const { logout, user } = useAuth();
  const searchParams = useSearchParams();
  const isChatOpen = !!searchParams.get("chatId");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-sidebar-border bg-card sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4 h-16">
        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground">
          Admin Dashboard
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {showSearch && (
            <div className="hidden md:flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder-muted-foreground"
              />
            </div>
          )}

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <Bell className="w-5 h-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              disabled={isChatOpen}
              className={`text-foreground hover:bg-muted ${isChatOpen ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <User className="w-5 h-5" />
              <span className="sr-only">User menu</span>
            </Button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role || "admin"}
                  </p>
                </div>

                <Link href="/admin/settings">
                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </Link>
                <button
                  onClick={logout}
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

export default HeaderAdmin;
