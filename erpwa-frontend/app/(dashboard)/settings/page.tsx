"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-provider"
import { Sun, Moon, Lock } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your dashboard preferences and account settings</p>
      </div>

      {/* Appearance Settings */}
      <Card className="border-border bg-card p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize how the dashboard looks</p>
        </div>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
              </div>
            </div>
            <Button onClick={toggleTheme} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Settings */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground mb-1">Account</h2>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Email</p>
            <p className="font-medium text-foreground">user@example.com</p>
          </div>

          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Role</p>
            <p className="font-medium text-foreground">Sales Executive</p>
          </div>

          <Link href="/change-password" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
