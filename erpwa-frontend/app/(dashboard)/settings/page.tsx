"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/card";
import { Button } from "@/components/button";
import { useTheme } from "@/context/theme-provider";
import {
  Moon, Sun, Lock, Zap, CheckCircle, AlertTriangle,
  Clock, Users, MessageSquare, Image, Bot, FileText, BarChart3,
  Crown, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import api from "@/lib/api";

type SubscriptionStatus = {
  plan: {
    id: string; name: string; price: number; currency: string;
    conversationLimit: number; galleryLimit: number; chatbotLimit: number;
    templateLimit: number; formLimit: number; teamUsersLimit: number;
  } | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  isExpired: boolean;
  daysRemaining: number;
  usage: {
    templates: number; conversations: number; chatbots: number;
    teamUsers: number; gallery: number;
  } | null;
};

function formatLimit(val: number) {
  return val === -1 ? "∞" : val.toLocaleString();
}

function UsageBar({ current, limit, label, icon }: { current: number; limit: number; label: string; icon: React.ReactNode }) {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isFull = limit !== -1 && current >= limit;
  const isWarning = limit !== -1 && pct >= 80 && !isFull;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={`font-semibold tabular-nums ${isFull ? "text-destructive" : isWarning ? "text-amber-500" : "text-foreground"}`}>
          {current.toLocaleString()} / {formatLimit(limit)}
        </span>
      </div>
      {limit !== -1 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    api.get("/subscription/status")
      .then(r => setSub(r.data))
      .catch(() => setSub(null))
      .finally(() => setLoadingSub(false));
  }, []);

  const plan = sub?.plan;
  const expiryDate = sub?.subscriptionEnd ? new Date(sub.subscriptionEnd) : null;
  const isExpiringSoon = sub && !sub.isExpired && sub.daysRemaining <= 7;

  const planColorMap: Record<string, string> = {
    Free: "from-slate-500 to-slate-700",
    Basic: "from-blue-500 to-blue-700",
    Unlimited: "from-amber-500 to-orange-600",
    Custom: "from-amber-500 to-orange-600",
  };
  const planColor = plan ? (planColorMap[plan.name] || "from-primary to-primary/70") : "from-slate-500 to-slate-700";

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and subscription</p>
      </motion.div>

      {/* ── Subscription Plan Card ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {loadingSub ? (
          <Card className="p-6 animate-pulse h-48"><div /></Card>
        ) : (
          <Card className="overflow-hidden border-0 shadow-lg">
            {/* Hero banner */}
            <div className={`bg-gradient-to-br ${planColor} p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80 uppercase tracking-wide">
                      Current Plan
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold">
                    {plan ? plan.name : "No Plan"}
                  </h2>
                  {plan && plan.price > 0 && (
                    <p className="text-sm opacity-70 mt-1">
                      ${plan.price} / month
                    </p>
                  )}
                  {plan && plan.price === 0 && (
                    <p className="text-sm opacity-70 mt-1">Free tier</p>
                  )}
                </div>

                {/* Expiry Chip */}
                <div className="text-right">
                  {sub?.isExpired ? (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Expired
                    </span>
                  ) : expiryDate ? (
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 ${isExpiringSoon ? "bg-amber-400/30" : "bg-white/15"} text-white text-xs font-medium px-3 py-1.5 rounded-full`}>
                        <Clock className="w-3.5 h-3.5" />
                        {sub!.daysRemaining} day{sub!.daysRemaining !== 1 ? "s" : ""} left
                      </div>
                      <p className="text-[11px] opacity-60 mt-1">
                        Expires {expiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Usage stats */}
            {sub?.usage && plan && (
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Usage This Period
                </h3>
                <div className="grid gap-3">
                  <UsageBar current={sub.usage.templates} limit={plan.templateLimit} label="Message Templates" icon={<FileText className="w-3.5 h-3.5" />} />
                  <UsageBar current={sub.usage.conversations} limit={plan.conversationLimit} label="Conversations" icon={<MessageSquare className="w-3.5 h-3.5" />} />
                  <UsageBar current={sub.usage.chatbots} limit={plan.chatbotLimit} label="Chatbot Workflows" icon={<Bot className="w-3.5 h-3.5" />} />
                  <UsageBar current={sub.usage.teamUsers} limit={plan.teamUsersLimit} label="Team Members" icon={<Users className="w-3.5 h-3.5" />} />
                  <UsageBar current={sub.usage.gallery} limit={plan.galleryLimit} label="Gallery Items" icon={<Image className="w-3.5 h-3.5" />} />
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {(!plan || plan.price === 0) && (
              <div className="px-6 pb-6">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Unlock more features</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upgrade your plan to increase limits</p>
                  </div>
                  <Link href="/pricing">
                    <Button size="sm" className="gap-2 shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Plan feature highlights */}
            {plan && (
              <div className="px-6 pb-6 grid grid-cols-2 gap-2">
                {[
                  { label: `${formatLimit(plan.templateLimit)} Templates`, icon: <FileText className="w-3 h-3" /> },
                  { label: `${formatLimit(plan.conversationLimit)} Conversations`, icon: <MessageSquare className="w-3 h-3" /> },
                  { label: `${formatLimit(plan.chatbotLimit)} Chatbots`, icon: <Bot className="w-3 h-3" /> },
                  { label: `${formatLimit(plan.teamUsersLimit)} Team Members`, icon: <Users className="w-3 h-3" /> },
                  { label: `${formatLimit(plan.galleryLimit)} Gallery Items`, icon: <Image className="w-3 h-3" /> },
                  { label: `${formatLimit(plan.formLimit)} Forms`, icon: <BarChart3 className="w-3 h-3" /> },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </motion.div>

      {/* ── Appearance ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2 bg-transparent">
              {theme === "dark" ? <><Sun className="w-4 h-4" /> Light</> : <><Moon className="w-4 h-4" /> Dark</>}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Account ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Name</p>
                <p className="text-sm text-muted-foreground">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Business</p>
                <p className="text-sm text-muted-foreground">{user?.vendor?.name || "—"}</p>
              </div>
            </div>
            <Link href="/change-password">
              <Button variant="outline" className="w-full gap-2 mt-4 bg-transparent">
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
