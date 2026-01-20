"use client"

import type React from "react"

import { Sidebar } from "./sidebar"

interface LayoutWrapperProps {
  children: React.ReactNode
  userRole?: "admin" | "sales_executive"
}

export function LayoutWrapper({ children, userRole = "sales_executive" }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
