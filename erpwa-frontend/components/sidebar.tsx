"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Send, Users, FileText, Settings, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/context/sidebar-provider"

interface SidebarProps {
  userRole?: "admin" | "sales_executive"
}

export function Sidebar({ userRole = "sales_executive" }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/inbox", icon: MessageSquare, label: "Inbox" },
    { href: "/send-message", icon: Send, label: "Send Message" },
    { href: "/leads", icon: Users, label: "Leads" },
    { href: "/templates", icon: FileText, label: "Templates" },
    ...(userRole === "admin" ? [{ href: "/users", icon: Users, label: "Users" }] : []),
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo Section */}
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

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
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

      {/* Logout Button */}
      <div className="border-t border-sidebar-border p-3">
        <div className="group relative">
          <button
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
