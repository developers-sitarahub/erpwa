"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Rocket, Star, Infinity as InfinityIcon, Zap,
  Check, Loader2, AlertTriangle, ArrowRight, RefreshCw,
  Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/button";
import api from "@/lib/api";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";

type Plan = {
  id: string; name: string; price: number; currency: string;
  durationDays: number; conversationLimit: number; galleryLimit: number;
  chatbotLimit: number; templateLimit: number; formLimit: number; teamUsersLimit: number;
};

type SubscriptionStatus = {
  plan: Plan | null;
  subscriptionEnd: string | null;
  isExpired: boolean;
  daysRemaining: number;
};

const PLAN_META: Record<string, { icon: React.ReactNode; accent: string; gradient: string; glow: string; badge?: string }> = {
  Free:    { icon: <Star className="w-4 h-4" />,         accent: "text-slate-400",   gradient: "from-slate-700 via-slate-800 to-slate-900", glow: "shadow-slate-500/10" },
  Basic:   { icon: <Rocket className="w-4 h-4" />,       accent: "text-blue-400",    gradient: "from-blue-600 via-blue-700 to-blue-900",     glow: "shadow-blue-500/10", badge: "Popular" },
  Custom:  { icon: <InfinityIcon className="w-4 h-4" />, accent: "text-amber-400",   gradient: "from-amber-500 via-orange-600 to-red-700",  glow: "shadow-amber-500/20", badge: "Enterprise" },
};

function fmtLimit(val: number) {
  return val === -1 ? "∞" : val.toLocaleString();
}

export function SubscriptionPlansSection() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const { updateUser } = useAuth();
  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        api.get("/subscription/plans"),
        api.get("/subscription/status"),
      ]);
      setPlans(plansRes.data);
      setStatus(statusRes.data);

      // 🔥 Also refresh the global auth user to update the timer/badges everywhere
      try {
        const meRes = await api.get("/auth/me");
        updateUser(meRes.data.user);
      } catch (e) {
        console.warn("Failed to refresh user after plan fetch", e);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const { initiatePayment, loading: paying } = useRazorpay(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 border border-border/50 rounded-2xl bg-card/50">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">Checking plans...</p>
      </div>
    );
  }

  const currentPlanId = status?.plan?.id;
  const isOnPaidPlan = status?.plan && status.plan.price > 0;
  const isExpiringSoon = status && !status.isExpired && status.daysRemaining <= 5;
  const isExpired = status?.isExpired;
  
  // Custom wa number from env
  const waNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919999999999";

  // Only show if on free plan, expired, or expiring soon
  const shouldShow = !isOnPaidPlan || isExpired || isExpiringSoon;
  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Alert banner */}
      {(isExpired || isExpiringSoon) && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-semibold shadow-sm border",
            isExpired 
              ? "bg-destructive/10 border-destructive/30 text-destructive shadow-destructive/5" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-amber-500/5"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isExpired ? "bg-destructive/20" : "bg-amber-500/20"
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold mb-0.5">{isExpired ? "Subscription Expired" : "Expiration Warning"}</h4>
            <p className="text-sm opacity-80 font-medium">
              {isExpired
                ? "Your access has been limited. Upgrade now to restore all features."
                : `Your ${status?.plan?.name} plan expires in ${status?.daysRemaining} days. Renew now to avoid interruption.`}
            </p>
          </div>
          <Zap className="w-5 h-5 animate-pulse opacity-50 hidden sm:block" />
        </motion.div>
      )}

      <div className="flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xl font-black text-foreground tracking-tight">Level Up Your Business</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Choose a professional plan to unlock advanced tools</p>
        </div>
        <button
          onClick={fetchData}
          className="text-muted-foreground hover:text-primary transition-all p-2 rounded-xl hover:bg-primary/10 active:scale-90"
          title="Refresh Plans"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...plans]
          .sort((a, b) => {
            const order = ["Free", "Basic", "Custom", "Unlimited"];
            const idxA = order.indexOf(a.name);
            const idxB = order.indexOf(b.name);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
          })
          .map((plan, i) => {
            const isFreeDisabled = plan.name === "Free" && isOnPaidPlan;
          const meta = PLAN_META[plan.name] || (plan.name === "Unlimited" ? PLAN_META.Custom : PLAN_META.Free);
          const isCurrent = plan.id === currentPlanId;
          const isPaid = plan.price > 0;
          const isCustom = plan.name === "Unlimited" || plan.name === "Custom";
          const isBasic = plan.name === "Basic";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (0.05 * i) }}
              className={cn(
                "relative rounded-3xl overflow-hidden border bg-card flex flex-col group transition-all duration-300",
                isCurrent ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60 hover:border-primary/30",
                isBasic && "lg:scale-[1.03] lg:z-10 shadow-xl shadow-blue-500/5",
                meta.glow && `hover:${meta.glow}`
              )}
            >
              {/* Popular / Enterprise Badge */}
              {meta.badge && (
                <div className="absolute top-2 right-2 z-20">
                  <div className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter text-white shadow-sm",
                    isBasic ? "bg-linear-to-r from-blue-600 to-blue-700" : "bg-linear-to-r from-amber-500 to-orange-600"
                  )}>
                    {meta.badge}
                  </div>
                </div>
              )}

              {/* Header section with gradient */}
              <div className={cn(
                "bg-linear-to-br p-5 text-white relative overflow-hidden",
                meta.gradient
              )}>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className={cn("flex items-center gap-1.5 mb-3 text-[10px] font-black uppercase tracking-widest", meta.accent)}>
                    <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
                      {meta.icon}
                    </div>
                    {plan.name === "Unlimited" ? "Custom" : plan.name}
                  </div>
                  <div className="text-3xl font-black flex items-baseline gap-1">
                    {plan.price === 0 ? "Free" : (isCustom ? "Custom" : `₹${plan.price.toLocaleString("en-IN")}`)}
                    {isPaid && !isCustom && <span className="text-[10px] font-medium opacity-60 uppercase">/{plan.durationDays}d</span>}
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="p-5 flex-1 space-y-3 bg-card/30">
                {[
                  { label: "Templates", val: plan.templateLimit, icon: <FileText className="w-3 h-3" /> },
                  { label: "Conversations", val: plan.conversationLimit, icon: <MessageSquare className="w-3 h-3" /> },
                  { label: "Chatbots", val: plan.chatbotLimit, icon: <Bot className="w-3 h-3" /> },
                  { label: "Team Members", val: plan.teamUsersLimit, icon: <Users className="w-3 h-3" /> },
                ].map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2.5 text-xs text-muted-foreground group/feature">
                    <div className="w-4.5 h-4.5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="font-medium group-hover/feature:text-foreground transition-colors">
                      <b className="text-foreground">{fmtLimit(f.val)}</b> {f.label}
                    </span>
                  </div>
                ))}
                {isCustom && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <div className="w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="w-3 h-3 text-primary" />
                    </div>
                    <span className="font-medium">Priority Support</span>
                  </div>
                )}
              </div>

              {/* Call to Action Button */}
              <div className="p-5 pt-0 bg-card/30">
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 rounded-xl border border-border/50">
                    <Check className="w-3 h-3 inline mr-1 -mt-0.5 text-green-500" />
                    Active Plan
                  </div>
                ) : isFreeDisabled ? (
                  <div className="w-full text-center py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                    Not Available
                  </div>
                ) : isCustom ? (
                  <a
                    href={`https://wa.me/${waNumber}?text=Hi%2C%20I%27m%20interested%20in%20the%20Custom%20plan%20for%20GPSerp.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  >
                    Contact Sales
                    <ArrowRight className="w-3 h-3" />
                  </a>
                ) : (
                  <Button
                    size="sm"
                    className={cn(
                      "w-full gap-2 text-[10px] font-black uppercase tracking-widest py-3 h-auto rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95",
                      isBasic ? "bg-linear-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/20" : ""
                    )}
                    disabled={paying}
                    onClick={() => initiatePayment(plan, { name: user?.name, email: user?.email })}
                  >
                    {paying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        Get {plan.name}
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Minimal icons for features
function FileText(props: any) { return <Rocket {...props} /> } // reuse for simplicity
function MessageSquare(props: any) { return <Zap {...props} /> }
function Bot(props: any) { return <Star {...props} /> }
function Users(props: any) { return <Sparkles {...props} /> }
