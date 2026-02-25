"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, Store, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";

type Stats = { vendors: number; users: number; leads: number };

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ vendors: 0, users: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/super-admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Vendors",
      sub: "Active vendors on platform",
      value: stats.vendors,
      icon: Store,
      color: "text-cyan-400",
    },
    {
      label: "Platform Users",
      sub: "All users in system",
      value: stats.users,
      icon: Users,
      color: "text-purple-400",
    },
    {
      label: "Total Leads",
      sub: "Leads across all vendors",
      value: stats.leads,
      icon: TrendingUp,
      color: "text-green-400",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back! Here's an overview of the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, sub, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <p className="text-4xl font-bold text-foreground">
                  {value.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
