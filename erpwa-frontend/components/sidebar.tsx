"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Send, Users, FileText, Settings, LogOut, ChevronRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/context/sidebar-provider"
import { useState, useEffect } from "react"

interface SidebarProps {
  userRole?: "admin" | "sales_executive"
}

export function Sidebar({ userRole = "sales_executive" }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/inbox", icon: MessageSquare, label: "Inbox" },
    { href: "/send-message", icon: Send, label: "Send Message" },
    { href: "/leads", icon: Users, label: "Leads" },
    { href: "/templates", icon: FileText, label: "Templates" },
    ...(userRole === "admin" ? [{ href: "/users", icon: Users, label: "Users" }] : []),
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground md:hidden"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-transform duration-300 ease-in-out z-40 w-64",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between px-4 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold text-sidebar-foreground">WhatsApp</h1>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <button
              onClick={() => {
                localStorage.removeItem("userRole")
                localStorage.removeItem("userEmail")
                window.location.href = "/"
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </>
    )
  }

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 bg-sidebar border-r border-sidebar-border h-screen flex-col transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-between px-4 py-6 border-b border-sidebar-border">
        <div className={cn("flex items-center", isCollapsed ? "w-full justify-center" : "gap-2")}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <h1 className="text-lg font-bold text-sidebar-foreground">WhatsApp</h1>}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 ml-2"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  isCollapsed && "justify-center px-0",
                )}
                title={isCollapsed ? item.label : ""}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>

              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-sidebar-foreground text-sidebar px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="group relative">
          <button
            onClick={() => {
              localStorage.removeItem("userRole")
              localStorage.removeItem("userEmail")
              window.location.href = "/"
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-all duration-200",
              isCollapsed && "justify-center px-0",
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          {isCollapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-sidebar-foreground text-sidebar px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
