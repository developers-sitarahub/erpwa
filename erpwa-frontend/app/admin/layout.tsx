"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarAdmin } from "@/components/sidebar-admin"
import { HeaderAdmin } from "@/components/header-admin"
import { SidebarProvider } from "@/context/sidebar-provider"
import { useSidebar } from "@/context/sidebar-provider"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex h-screen bg-background">
      <SidebarAdmin />
      {/* Made margin responsive - no margin on mobile, adapts to collapsed state on desktop */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-20 ${!isCollapsed ? "md:ml-64" : ""}`}
      >
        <HeaderAdmin />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "admin") {
      router.push("/")
    }
  }, [router])

  if (!mounted) return null

  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
