"use client"

import { Bell, Search, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/button"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const showSearch = pathname === "/dashboard"

  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    window.location.href = "/"
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4 h-16">
        {/* Title */}
        {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}

        {/* Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {showSearch && (
            <div className="hidden md:flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder-muted-foreground"
              />
            </div>
          )}

          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
            <Bell className="w-5 h-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <User className="w-5 h-5" />
              <span className="sr-only">User menu</span>
            </Button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{userEmail || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">{userRole || "user"}</p>
                </div>

                <Link href="/settings">
                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </Link>
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
  )
}
