"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/card";
import {
  MessagesSquare,
  IndianRupee,
  Send,
  CalendarDays,
  RefreshCw,
  Zap,
  ShieldCheck,
  Megaphone,
  Wrench,
  BarChart3,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { whatsappAnalyticsAPI } from "@/lib/whatsappAnalyticsApi";
import { toast } from "react-toastify";

/* ─── Types ─────────────────────────────────────────── */
interface BillingSummary {
  totalMessages: number;
  totalConversations: number;
  serviceConversations: number;
  utilityConversations: number;
  marketingConversations: number;
  authenticationConversations: number;
  totalMetaCost: number;
  totalChargedCost: number;
}

interface DashboardSummary {
  messagesToday: number;
  messagesThisMonth: number;
  conversationsThisMonth: number;
  costThisMonth: number;
}

/* ─── Animated Number ───────────────────────────────── */
function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * end;
      setDisplay(start);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
}

/* ─── Category Config ───────────────────────────────── */
const categoryConfig: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    darkBg: string;
  }
> = {
  service: {
    label: "Service",
    icon: <Wrench className="w-5 h-5" />,
    gradient: "from-emerald-500 to-teal-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    darkBg: "dark:bg-emerald-950/30",
  },
  utility: {
    label: "Utility",
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-blue-500 to-indigo-600",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200 dark:border-blue-800",
    darkBg: "dark:bg-blue-950/30",
  },
  marketing: {
    label: "Marketing",
    icon: <Megaphone className="w-5 h-5" />,
    gradient: "from-orange-500 to-rose-600",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200 dark:border-orange-800",
    darkBg: "dark:bg-orange-950/30",
  },
  authentication: {
    label: "Auth",
    icon: <ShieldCheck className="w-5 h-5" />,
    gradient: "from-purple-500 to-violet-600",
    textColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200 dark:border-purple-800",
    darkBg: "dark:bg-purple-950/30",
  },
};

/* ─── Pricing Table ─────────────────────────────────── */
const pricingTable = [
  { category: "Service", meta: 0.0, markup: 0.0, total: 0.0 },
  { category: "Utility", meta: 0.115, markup: 0.0, total: 0.115 },
  { category: "Marketing", meta: 0.8631, markup: 0.0, total: 0.8631 },
  { category: "Authentication", meta: 0.115, markup: 0.0, total: 0.115 },
];

/* ═══════════════════════════════════════════════════════
   MAIN INSIGHTS PAGE
═══════════════════════════════════════════════════════ */
export default function InsightsPage() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "pricing">(
    "overview",
  );

  /* ─── Fetch All Data ──────────────────────────────── */
  const fetchAll = useCallback(async () => {
    if (!vendorId) return;

    try {
      const [billingRes, dashRes] = await Promise.all([
        whatsappAnalyticsAPI.getBillingSummary(vendorId),
        whatsappAnalyticsAPI.getDashboardSummary(vendorId),
      ]);

      if (billingRes.data?.success) setBilling(billingRes.data.data);
      if (dashRes.data?.success) setDashboard(dashRes.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      // Only show toast if it's the first load to avoid constant annoying notifications
      if (loading) {
        toast.error("Failed to load insights data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId, loading]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  /* ─── Loading State ───────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto" />
            <BarChart3 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground mt-4 font-medium">
            Loading insights...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* ─── Header ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              WhatsApp Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 ml-[52px]">
              Billing analytics, conversation costs & wallet overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-muted rounded-lg p-1 gap-0.5">
              {(["overview", "pricing"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════
              OVERVIEW TAB
          ═══════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* ─── Quick Stats Row ────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Messages Today */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Today
                        </span>
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                          <Send className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber value={dashboard?.messagesToday ?? 0} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Messages sent today
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Messages This Month */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          This Month
                        </span>
                        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                          <CalendarDays className="w-4 h-4 text-purple-500" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber
                          value={dashboard?.messagesThisMonth ?? 0}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Messages this month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Conversations This Month */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className="relative overflow-hidden border-l-4 border-l-green-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Conversations
                        </span>
                        <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                          <MessagesSquare className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber
                          value={dashboard?.conversationsThisMonth ?? 0}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Conversations this month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Cost This Month */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Spent
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <IndianRupee className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        <AnimatedNumber
                          value={billing?.totalMetaCost ?? 0}
                          prefix="₹"
                          decimals={2}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Total spent
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* ─── Category Breakdown ──────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Conversation Breakdown
                    </CardTitle>
                    <CardDescription>
                      {billing?.totalConversations ?? 0} total conversations
                      across all categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(categoryConfig).map(
                        ([key, config], idx) => {
                          const count =
                            (billing?.[
                              `${key}Conversations` as keyof BillingSummary
                            ] as number) ?? 0;
                          const total = billing?.totalConversations || 1;
                          const pct = ((count / total) * 100).toFixed(1);

                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + idx * 0.08 }}
                              whileHover={{ scale: 1.02 }}
                              className={`relative rounded-xl border-2 ${config.borderColor} ${config.bgColor} ${config.darkBg} p-5 transition-all hover:shadow-lg`}
                            >
                              {/* Percentage badge */}
                              <div className="absolute top-3 right-3">
                                <span
                                  className={`text-[10px] font-bold ${config.textColor} bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded-full`}
                                >
                                  {pct}%
                                </span>
                              </div>

                              <div className="flex flex-col items-center text-center space-y-2.5">
                                <div
                                  className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md`}
                                >
                                  {config.icon}
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-foreground">
                                    {count}
                                  </p>
                                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                    {config.label}
                                  </p>
                                </div>
                              </div>

                              {/* Mini progress bar */}
                              <div className="mt-3 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{
                                    delay: 0.5 + idx * 0.1,
                                    duration: 0.8,
                                  }}
                                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                                />
                              </div>
                            </motion.div>
                          );
                        },
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              PRICING TAB
          ═══════════════════════════════════════════ */}
          {activeTab === "pricing" && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    WhatsApp Conversation Pricing (India)
                  </CardTitle>
                  <CardDescription>
                    Official Meta conversation rates (India)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground/80 bg-muted/30 border-b border-border">
                          <th className="px-6 py-4 text-left font-bold">
                            Category
                          </th>
                          <th className="px-6 py-4 text-right font-bold">
                            Price Per Conversation (INR)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingTable.map((row, i) => {
                          const catKey = row.category.toLowerCase();
                          const cat =
                            categoryConfig[catKey] || categoryConfig.service;
                          return (
                            <motion.tr
                              key={row.category}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg bg-gradient-to-br ${cat.gradient} text-white shadow-sm`}
                                  >
                                    {cat.icon}
                                  </div>
                                  <span className="font-semibold text-foreground">
                                    {row.category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="inline-flex items-center gap-1.5 text-lg font-bold text-foreground">
                                  ₹{row.total === 0 ? "0.00" : Number(row.total.toFixed(4))}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">How pricing works</p>
                        <p>
                          Meta charges per <strong>conversation</strong>{" "}
                          (24-hour session), not per message. Multiple messages
                          within the same conversation window are covered by a
                          single charge. Prices shown are official Meta rates.
                        </p>
                        <div className="mt-3">
                          <a 
                            href="https://business.whatsapp.com/products/platform-pricing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline underline-offset-2"
                          >
                            View pricing for other countries <span aria-hidden="true">&rarr;</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
