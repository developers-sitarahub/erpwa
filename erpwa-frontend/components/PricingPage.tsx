"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Check, Zap, Rocket, Infinity as InfinityIcon, AlertCircle, Loader2,
  MessageSquare, Image as ImageIcon, Bot, FileText, Users, BarChart3, Star
} from "lucide-react";
import { Button } from "@/components/button";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { useAuth } from "@/context/authContext";
import { useRazorpay } from "@/hooks/useRazorpay";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  conversationLimit: number;
  galleryLimit: number;
  chatbotLimit: number;
  templateLimit: number;
  formLimit: number;
  teamUsersLimit: number;
};

const PLAN_META: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  border: string;
  badge?: string;
  popular?: boolean;
  description: string;
}> = {
  Free: {
    icon: <Star className="w-5 h-5" />,
    gradient: "from-slate-900 to-slate-800",
    border: "border-slate-700/50",
    description: "Perfect for getting started and exploring the platform.",
  },
  Basic: {
    icon: <Rocket className="w-5 h-5" />,
    gradient: "from-blue-900 to-blue-800",
    border: "border-blue-500/40",
    badge: "Most Popular",
    popular: true,
    description: "Great for small businesses scaling their outreach.",
  },
  Custom: {
    icon: <InfinityIcon className="w-5 h-5" />,
    gradient: "from-amber-900 to-orange-900",
    border: "border-amber-500/40",
    badge: "Best Value",
    description: "No limits. Everything included. Built for enterprises.",
  },
};

function fmtLimit(val: number, unit = "") {
  if (val === -1) return "Unlimited";
  return `${val.toLocaleString()}${unit ? " " + unit : ""}`;
}

function PlanCard({
  plan,
  currentPlanId,
  onBuy,
  paying,
}: {
  plan: Plan;
  currentPlanId?: string | null;
  onBuy: (plan: Plan) => void;
  paying: boolean;
}) {
  const displayPlanName = plan.name === "Unlimited" ? "Custom" : plan.name;
  const meta = PLAN_META[displayPlanName] || {
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-gray-900 to-gray-800",
    border: "border-gray-700/50",
    description: "Custom subscription plan.",
  };

  const isCurrent = plan.id === currentPlanId;

  const features = [
    { icon: <MessageSquare className="w-3.5 h-3.5" />, label: fmtLimit(plan.conversationLimit) + " Conversations" },
    { icon: <FileText className="w-3.5 h-3.5" />, label: fmtLimit(plan.templateLimit) + " Templates" },
    { icon: <Bot className="w-3.5 h-3.5" />, label: fmtLimit(plan.chatbotLimit) + " Chatbots" },
    { icon: <Users className="w-3.5 h-3.5" />, label: fmtLimit(plan.teamUsersLimit) + " Team Members" },
    { icon: <ImageIcon className="w-3.5 h-3.5" />, label: fmtLimit(plan.galleryLimit) + " Gallery Items" },
    { icon: <BarChart3 className="w-3.5 h-3.5" />, label: fmtLimit(plan.formLimit) + " Forms" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border ${meta.border} overflow-hidden flex flex-col ${meta.popular ? "ring-2 ring-blue-500/60 shadow-xl shadow-blue-500/10 scale-105 z-10" : ""}`}
    >
      {/* Popular badge */}
      {meta.badge && (
        <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.popular ? "bg-blue-600 text-white" : "bg-amber-500 text-black shadow-lg"}`}>
          {meta.badge}
        </div>
      )}

      {/* Header */}
      <div className={`bg-linear-to-br ${meta.gradient} p-6 text-white`}>
        <div className="flex items-center gap-2.5 mb-3 opacity-80">
          {meta.icon}
          <span className="text-sm font-semibold uppercase tracking-wider">{displayPlanName}</span>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black">
            {plan.price === 0 ? "Free" : (plan.name === "Unlimited" || plan.name === "Custom" ? "Custom" : `${plan.currency === 'INR' ? '₹' : '$'}${plan.price}`)}
          </span>
          {plan.price > 0 && !(plan.name === "Unlimited" || plan.name === "Custom") && <span className="text-white/50 text-sm mb-1">/{plan.durationDays === 365 ? 'year' : 'month'}</span>}
        </div>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">{meta.description}</p>
      </div>

      {/* Features */}
      <div className="p-6 flex-1 space-y-3 bg-card">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white ${meta.popular ? "bg-blue-500/20 text-blue-400" : "bg-primary/10 text-primary"}`}>
              <Check className="w-3 h-3" />
            </span>
            <span className="text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-6 pt-0 bg-card">
        {isCurrent ? (
          <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-muted text-muted-foreground">
            ✓ Current Plan
          </div>
        ) : plan.price === 0 ? (
          <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-muted text-muted-foreground">
            Default Plan
          </div>
        ) : plan.name === "Unlimited" || displayPlanName === "Custom" ? (
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919999999999"}?text=Hi%2C%20I%27m%20interested%20in%20the%20Custom%20plan%20for%20GPSerp.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-amber-500 text-amber-600 dark:text-amber-400 text-sm font-semibold hover:bg-amber-500/10 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact Sales
          </a>
        ) : (
          <Button
            onClick={() => onBuy(plan)}
            disabled={paying}
            className={`w-full h-11 font-semibold ${meta.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25" : ""}`}
            variant={meta.popular ? "primary" : "outline"}
          >
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade Now"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function PricingPage() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        api.get("/subscription/plans"),
        api.get("/subscription/status"),
      ]);
      setPlans(plansRes.data);
      setCurrentPlanId(statusRes.data.plan?.id || null);

      // 🔥 Refresh global user too
      const meRes = await api.get("/auth/me");
      updateUser(meRes.data.user);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const { initiatePayment, loading: paying } = useRazorpay(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
          <Zap className="w-4 h-4" />
          Subscription Plans
        </div>
        <h1 className="text-4xl font-black text-foreground">
          Choose the right plan for your business
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Scale your WhatsApp marketing with the right set of tools. Upgrade or downgrade anytime.
        </p>
      </motion.div>

      {/* Current Plan Alert */}
      {currentPlanId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 max-w-2xl mx-auto"
        >
          <AlertCircle className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            You&apos;re currently on the{" "}
            <strong>{plans.find(p => p.id === currentPlanId)?.name}</strong> plan.
            To change your plan, contact our sales team.
          </p>
        </motion.div>
      )}

      {/* Plan Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <PlanCard
                plan={plan}
                currentPlanId={currentPlanId}
                onBuy={(p) => initiatePayment(p, { name: user?.name, email: user?.email })}
                paying={paying}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* FAQ / Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-muted-foreground space-y-2 pb-4"
      >
        <p>All plans include WhatsApp Business API access, real-time inbox, and campaign analytics.</p>
        <p>
          Need a custom plan?{" "}
          <a href="mailto:sales@gpserp.com" className="text-primary font-medium hover:underline">
            Contact our team
          </a>
        </p>
      </motion.div>
    </div>
  );
}
