"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/card";
import { Button } from "@/components/button";
import { useTheme } from "@/context/theme-provider";
import { Moon, Sun, Lock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

type Admin = { email: string; name: string | null };

export default function SuperAdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    api
      .get("/super-admin/me")
      .then((r) =>
        setAdmin({ email: r.data.admin.email, name: r.data.admin.name }),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Super Admin preferences
        </p>
      </motion.div>

      <div className="grid gap-6 max-w-2xl">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-2 bg-transparent"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Account
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {admin?.name ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {admin?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Super Admin
                  </p>
                </div>
              </div>

              <Link href="/admin-super-change-password">
                <Button
                  variant="outline"
                  className="w-full gap-2 mt-4 bg-transparent"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
