"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/card";
import { Button } from "@/components/button";
import { useTheme } from "@/context/theme-provider";
import {
  Moon, Sun, Lock, Zap, CheckCircle, AlertTriangle,
  Clock, Users, MessageSquare, Image, Bot, FileText, BarChart3,
  Crown, ArrowRight, X, Loader2, Rocket, Infinity as InfinityIcon,
  CreditCard, Receipt, Star, Shield, Sparkles, Download, Printer, DownloadCloud
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import api from "@/lib/api";
import { useRazorpay } from "@/hooks/useRazorpay";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

// ─── Types ────────────────────────────────────────────────
type Plan = {
  id: string; name: string; price: number; currency: string;
  durationDays: number; conversationLimit: number; galleryLimit: number;
  chatbotLimit: number; templateLimit: number; formLimit: number; teamUsersLimit: number;
};

type SubscriptionStatus = {
  plan: Plan | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  isExpired: boolean;
  daysRemaining: number;
  usage: {
    templates: number; conversations: number; chatbots: number;
    teamUsers: number; gallery: number;
  } | null;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  billingName: string;
  billingEmail: string | null;
  planName: string;
  planDuration: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  gateway: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; accent: string; glow: string; badge?: string }> = {
  Free:    { icon: <Zap className="w-5 h-5" />,          gradient: "from-slate-600 via-slate-700 to-slate-900", accent: "text-slate-300", glow: "shadow-slate-500/10" },
  Basic:   { icon: <Rocket className="w-5 h-5" />,       gradient: "from-blue-600 via-blue-700 to-blue-900",     accent: "text-blue-400", glow: "shadow-blue-500/20", badge: "Most Popular" },
  Custom:  { icon: <InfinityIcon className="w-5 h-5" />, gradient: "from-amber-500 via-orange-600 to-red-700",  accent: "text-amber-400", glow: "shadow-amber-500/20", badge: "Enterprise" },
};

function fmtPrice(price: number, currency: string) {
  if (price === 0) return "Free";
  if (currency === "INR") return `₹${price.toLocaleString("en-IN")}`;
  return `$${price}`;
}

function fmtLimit(val: number) {
  return val === -1 ? "∞" : val.toLocaleString();
}

// ─── UsageBar ─────────────────────────────────────────────
function UsageBar({ current, limit, label, icon }: {
  current: number; limit: number; label: string; icon: React.ReactNode;
}) {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isFull    = limit !== -1 && current >= limit;
  const isWarning = limit !== -1 && pct >= 80 && !isFull;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
        <span className={`font-semibold tabular-nums ${isFull ? "text-destructive" : isWarning ? "text-amber-500" : "text-foreground"}`}>
          {current.toLocaleString()} / {fmtLimit(limit)}
        </span>
      </div>
      {limit !== -1 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isFull ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"}`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Invoice Detail Modal ─────────────────────────────────
function InvoiceModal({ invoice, onClose }: { invoice: InvoiceDetail; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <motion.div
        key="invoice-modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 no-print sm:p-6"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative z-10 w-full max-w-2xl bg-white border border-border shadow-2xl overflow-hidden text-slate-900 rounded-none sm:rounded-lg"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Controls (UI Only) */}
          <div className="absolute right-4 top-4 flex items-center gap-2 no-print z-20">
            <Button variant="outline" size="sm" className="h-8 gap-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold" onClick={handlePrint}>
              <DownloadCloud className="w-4 h-4" />
              Download
            </Button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 md:p-12 space-y-12 overflow-y-auto max-h-[90vh]">
            {/* Logo & Title */}
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mt-2">Receipt</h1>
              <div className="w-24 h-12">
                <Logo className="w-full h-full force-light" />
              </div>
            </div>

            {/* Quick Details Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-500">Invoice number</span>
                  <span className="text-slate-900 font-mono font-medium">{invoice.invoiceNumber}</span>
                  <span className="text-slate-500">Receipt number</span>
                  <span className="text-slate-900 font-mono font-medium">{invoice.razorpayPaymentId?.slice(-8).toUpperCase() || "2873-9320"}</span>
                  <span className="text-slate-500">Date paid</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Bill To */}
                <div className="text-sm">
                  <p className="text-slate-500 font-medium mb-1">Bill to</p>
                  <p className="text-slate-900 font-bold">{invoice.billingName}</p>
                  {invoice.billingEmail && (
                    <p className="text-slate-500 text-xs mt-0.5">{invoice.billingEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Our Info Wrapper (Small) */}
            <div className="text-[11px] text-slate-400 leading-relaxed uppercase tracking-widest max-w-[240px]">
              <p className="font-bold text-slate-500 mb-1">SitaraHub Corporation</p>
              <p>GPSERP.com Business Suite</p>
              <p>support@sitarahub.com</p>
            </div>

            {/* Large Amount Paid */}
            <div className="pt-4 pb-2 border-b-2 border-slate-100">
              <p className="text-3xl font-bold text-slate-900">
                {fmtPrice(invoice.totalAmount, invoice.currency)} paid on {new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="pt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100">
                    <th className="text-left py-4 font-semibold">Description</th>
                    <th className="text-center py-4 font-semibold w-24">Qty</th>
                    <th className="text-right py-4 font-semibold w-32">Unit price</th>
                    <th className="text-right py-4 font-semibold w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="align-top">
                    <td className="py-6 pr-4">
                      <p className="font-bold text-slate-900 leading-tight">
                        {invoice.planName === "Unlimited" ? "Custom" : invoice.planName} Subscription Plan
                      </p>
                      <p className="text-xs text-slate-400 mt-1 capitalize">
                        {invoice.planDuration} Days access to GPSERP modules
                      </p>
                    </td>
                    <td className="py-6 text-center text-slate-900 font-medium">1</td>
                    <td className="py-6 text-right text-slate-900 font-medium tabular-nums">
                      {fmtPrice(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="py-6 text-right text-slate-900 font-bold tabular-nums">
                      {fmtPrice(invoice.totalAmount, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.taxAmount > 0 && (
                    <tr className="text-slate-500">
                      <td className="py-4 font-medium italic">Adjustments / GST</td>
                      <td className="py-4 text-center">1</td>
                      <td className="py-4 text-right tabular-nums">-{fmtPrice(invoice.taxAmount, invoice.currency)}</td>
                      <td className="py-4 text-right tabular-nums">-{fmtPrice(invoice.taxAmount, invoice.currency)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <div className="w-full max-w-[280px] space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium tabular-nums">{fmtPrice(invoice.totalAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Amount paid</span>
                  <span className="tabular-nums">{fmtPrice(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Payment History Section */}
            <div className="pt-12">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Payment history</h3>
              <table className="w-full text-xs border-t border-slate-900 pt-2">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-3 font-medium">Payment method</th>
                    <th className="text-left py-3 font-medium">Date</th>
                    <th className="text-center py-3 font-medium">Amount paid</th>
                    <th className="text-right py-3 font-medium">Transaction number</th>
                  </tr>
                </thead>
                <tbody className="border-t border-slate-100 divide-y divide-slate-50">
                  <tr className="text-slate-900">
                    <td className="py-4 font-medium capitalize">{invoice.gateway || "Online Payment"} — {invoice.razorpayOrderId?.slice(-4) || "****"}</td>
                    <td className="py-4 whitespace-nowrap">{new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
                    <td className="py-4 text-center tabular-nums font-bold">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
                    <td className="py-4 text-right font-mono text-slate-500">{invoice.razorpayPaymentId || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Page Indicator Style */}
            <div className="pt-20 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              <span>GPSERP SitaraHub</span>
              <span className="no-print">Page 1 of 1</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 🧾 Professional Printable Invoice (Hidden from UI, visible only on Print) - Mirroring the Modal */}
      <div id="printable-invoice" className="hidden print:block p-16 bg-white text-slate-900 font-sans leading-relaxed min-h-screen">
          <div className="flex justify-between items-start mb-16">
            <h1 className="text-5xl font-bold tracking-tighter mt-4">Receipt</h1>
            <div className="w-32 h-16">
               <Logo className="w-full h-full force-light" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-20 mb-16">
            <div className="space-y-1 text-sm">
              <div className="flex gap-4">
                <span className="w-32 text-slate-400">Invoice number</span>
                <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex gap-4">
                <span className="w-32 text-slate-400">Payment ID</span>
                <span className="font-mono font-bold text-xs break-all">{invoice.razorpayPaymentId || "—"}</span>
              </div>
              <div className="flex gap-4">
                <span className="w-32 text-slate-400">Date paid</span>
                <span>{new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-slate-400 mb-1 uppercase tracking-widest text-[10px] font-black">Bill to</p>
              <p className="font-black text-lg">{invoice.billingName}</p>
              <p className="text-slate-500">{invoice.billingEmail}</p>
            </div>
          </div>

          <p className="text-3xl font-bold border-b-2 border-slate-100 pb-4 mb-2">
            {fmtPrice(invoice.totalAmount, invoice.currency)} paid on {new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <table className="w-full mb-12">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black border-b border-slate-100">
                <th className="text-left py-6">Description</th>
                <th className="text-center py-6">Qty</th>
                <th className="text-right py-6">Unit price</th>
                <th className="text-right py-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 border-b border-slate-100">
              <tr>
                <td className="py-10">
                  <p className="text-xl font-black mb-1">{invoice.planName === "Unlimited" ? "Custom" : invoice.planName} Plan</p>
                  <p className="text-slate-400 text-sm">Full access to GPSERP automated tools for {invoice.planDuration} days.</p>
                </td>
                <td className="text-center font-bold">1</td>
                <td className="text-right font-bold tabular-nums">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
                <td className="text-right font-black text-lg tabular-nums">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right py-8 text-slate-400">Subtotal</td>
                <td className="text-right py-8 font-bold tabular-nums">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right py-4 text-xl font-black">Total Amount Paid</td>
                <td className="text-right py-4 text-2xl font-black tabular-nums border-t-4 border-slate-900">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
              </tr>
            </tfoot>
          </table>

          <div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6">Payment history</h3>
             <table className="w-full text-sm border-t-2 border-slate-900 pt-4">
                <tbody>
                  <tr className="text-slate-900 border-b border-slate-50">
                    <td className="py-6 font-bold uppercase tracking-tighter">{invoice.gateway || "Online"} Transaction</td>
                    <td className="py-6 italic text-slate-400">{new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' })}</td>
                    <td className="py-6 text-center text-xl font-black">{fmtPrice(invoice.totalAmount, invoice.currency)}</td>
                    <td className="py-6 text-right font-mono text-slate-500">{invoice.razorpayPaymentId || "—"}</td>
                  </tr>
                </tbody>
             </table>
          </div>

          <div className="mt-20 flex justify-between text-[10px] text-slate-300 font-bold uppercase tracking-[0.5em] border-t border-slate-100 pt-8">
              <span>SitaraHub SitaraHub Corporation</span>
              <span>GPSERP Receipt // Professional Record</span>
          </div>
      </div>
    </>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────
function UpgradeModal({ onClose, currentPlanId, user, isOnPaidPlan }: {
  onClose: () => void;
  currentPlanId?: string | null;
  user: { name?: string; email?: string } | null;
  isOnPaidPlan?: boolean;
}) {
  const [plans, setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(() => {
    api.get("/subscription/plans")
      .then(r => {
        const allPlans = r.data as Plan[];
        const order = ["Free", "Basic", "Custom", "Unlimited"];
        const sorted = [...allPlans].sort((a, b) => {
          const idxA = order.indexOf(a.name);
          const idxB = order.indexOf(b.name);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
        setPlans(sorted);
      })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false));
  }, []);

  const { initiatePayment, loading: paying } = useRazorpay(() => { fetchPlans(); onClose(); });

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const waNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "919999999999";

  return (
    <motion.div
      key="upgrade-modal-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="relative z-10 w-full max-w-5xl bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="relative px-8 py-7 border-b border-border/50 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-violet-500/5 to-amber-500/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Scale your business with the right plan</p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-all p-2.5 rounded-xl hover:bg-muted/80 hover:scale-110 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary/50" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading plans...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {plans.map((plan, index) => {
                  const meta       = PLAN_META[plan.name] || (plan.name === "Unlimited" ? PLAN_META.Custom : (plan.name === "Free" ? PLAN_META.Free : PLAN_META.Basic));
                  const isCurrent  = plan.id === currentPlanId;
                  const isCustom   = plan.name === "Unlimited" || plan.name === "Custom";
                  const isBasic    = plan.name === "Basic";
                  const isFree     = plan.name === "Free";

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="relative group"
                    >
                      {/* Popular Badge */}
                      {meta.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                          <div className={cn(
                            "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg",
                            isBasic ? "bg-linear-to-r from-blue-600 to-blue-700 shadow-blue-500/30" : "bg-linear-to-r from-amber-500 to-orange-600 shadow-amber-500/30"
                          )}>
                            {isBasic ? <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" /> : <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {meta.badge}
                          </div>
                        </div>
                      )}

                      <div className={cn(
                        "rounded-2xl border overflow-hidden flex flex-col transition-all duration-300",
                        isBasic ? "ring-2 ring-blue-500/40 border-blue-500/30 shadow-xl shadow-blue-500/10 scale-[1.02]" : "border-border/60",
                        isCurrent && "ring-2 ring-primary/60 border-primary/40",
                        "hover:shadow-xl",
                        meta.glow && `hover:${meta.glow}`,
                      )}>
                        {/* Plan Header */}
                        <div className={`bg-linear-to-br ${meta.gradient} p-7 relative overflow-hidden`}>
                          {/* Decorative circles */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                          <div className="relative">
                            <div className={`flex items-center gap-2 ${meta.accent} text-xs font-bold uppercase tracking-widest mb-4`}>
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                {meta.icon}
                              </div>
                              {plan.name === "Unlimited" ? "Custom" : plan.name}
                            </div>
                            <div className="text-4xl font-black text-white tracking-tight">
                              {isCustom ? "Custom" : fmtPrice(plan.price, plan.currency)}
                            </div>
                            <p className="text-sm text-white/50 mt-1 font-medium">
                              {isCustom ? "Enterprise Tier" : `per ${plan.durationDays} days`}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="p-6 flex-1 space-y-3 bg-card">
                          {[
                            { val: plan.templateLimit, label: "Message Templates", icon: <FileText className="w-3.5 h-3.5" /> },
                            { val: plan.conversationLimit, label: "Conversations", icon: <MessageSquare className="w-3.5 h-3.5" /> },
                            { val: plan.chatbotLimit, label: "Chatbot Workflows", icon: <Bot className="w-3.5 h-3.5" /> },
                            { val: plan.teamUsersLimit, label: "Team Members", icon: <Users className="w-3.5 h-3.5" /> },
                            { val: plan.galleryLimit, label: "Gallery Items", icon: <Image className="w-3.5 h-3.5" /> },
                          ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <div className="w-5 h-5 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              </div>
                              <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">{fmtLimit(f.val)}</span> {f.label}
                              </span>
                            </div>
                          ))}
                            {isCustom && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Shield className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">Priority</span> Support
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6 pt-2 bg-card">
                          {isCurrent ? (
                            <div className="text-center text-xs font-semibold text-muted-foreground bg-muted py-3 rounded-xl border border-border/50">
                              <CheckCircle className="w-4 h-4 inline mr-1.5 -mt-0.5 text-green-500" />
                              Current Plan
                            </div>
                          ) : (plan.name === "Free" && isOnPaidPlan) ? (
                            <div className="text-center text-xs font-semibold text-muted-foreground bg-muted/30 py-3 rounded-xl border border-dashed border-border/50">
                              Not Available
                            </div>
                          ) : isCustom ? (
                            <a
                              href={`https://wa.me/${waNumber}?text=Hi%2C%20I%27m%20interested%20in%20the%20Custom%20plan%20for%20GPSerp.`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              Contact Sales
                            </a>
                          ) : (
                            <Button
                              size="sm"
                              className={cn(
                                "w-full gap-2.5 text-sm font-bold py-3 h-auto rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                                isBasic
                                  ? "bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/25"
                                  : "shadow-lg shadow-primary/20"
                              )}
                              disabled={paying}
                              onClick={() => initiatePayment(plan, { name: user?.name, email: user?.email })}
                            >
                              {paying
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <>
                                    <Zap className="w-4 h-4" />
                                    Upgrade Now
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                              }
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-8 flex items-center justify-center gap-8 text-xs text-muted-foreground/60">
              <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Payment</div>
              <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant Activation</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Cancel Anytime</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [sub, setSub]               = useState<SubscriptionStatus | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payments, setPayments]     = useState<any[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);

  // 💎 DEBUG LOG: Check if plan is actually in the user object
  useEffect(() => {
    if (user) {
      console.log("💎 [AdminSettings] Current User Object:", JSON.stringify(user, null, 2));
      console.log("💎 [AdminSettings] Plan Name:", user?.vendor?.subscriptionPlan?.name || "MISSING");
    }
  }, [user]);

  const fetchPayments = useCallback(() => {
    setLoadingPayments(true);
    api.get("/subscription/payments")
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, []);

  const fetchSub = useCallback(() => {
    setLoadingSub(true);
    api.get("/subscription/status")
      .then(r  => setSub(r.data))
      .catch(() => setSub(null))
      .finally(() => setLoadingSub(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingSub(true);
    api.get("/subscription/status")
      .then(r  => { if (!cancelled) setSub(r.data); })
      .catch(() => { if (!cancelled) setSub(null); })
      .finally(() => { if (!cancelled) setLoadingSub(false); });

    fetchPayments();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openInvoice = async (paymentId: string) => {
    setLoadingInvoice(paymentId);
    try {
      const res = await api.get(`/subscription/invoice/${paymentId}`);
      setInvoiceDetail(res.data);
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoadingInvoice(null);
    }
  };

  const plan           = sub?.plan;
  const expiryDate     = sub?.subscriptionEnd ? new Date(sub.subscriptionEnd) : null;
  const isExpiringSoon = sub && !sub.isExpired && sub.daysRemaining <= 7;

  const planColorMap: Record<string, string> = {
    Free:      "from-slate-500 to-slate-700",
    Basic:     "from-blue-500 to-blue-700",
    Unlimited: "from-amber-500 to-orange-600",
    Custom:    "from-amber-500 to-orange-600",
  };
  const planColor = plan
    ? (planColorMap[plan.name] || "from-primary to-primary/70")
    : "from-slate-500 to-slate-700";

  return (
    <>
      <AnimatePresence mode="wait">
        {showUpgrade && (
          <UpgradeModal
            key="upgrade-modal"
            onClose={() => { setShowUpgrade(false); fetchSub(); fetchPayments(); }}
            currentPlanId={plan?.id}
            isOnPaidPlan={plan && plan.price > 0}
            user={user}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {invoiceDetail && (
          <InvoiceModal 
            key="invoice-modal"
            invoice={invoiceDetail} 
            onClose={() => setInvoiceDetail(null)} 
          />
        )}
      </AnimatePresence>

      <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and subscription</p>
        </motion.div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Appearance + Account ── */}
          <div className="space-y-6">

            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
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

            {/* Account */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
                <div className="space-y-4">
                  {[
                    { label: "Name",     value: user?.name },
                    { label: "Email",    value: user?.email },
                    { label: "Role",     value: user?.role?.replace("_", " ") },
                    { label: "Business", value: (user as { vendor?: { name?: string } } | null)?.vendor?.name || "—" },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? "pb-4 border-b border-border" : ""}`}>
                      <div>
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground capitalize">{value}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/change-password">
                    <Button variant="outline" className="w-full gap-2 mt-4 bg-transparent">
                      <Lock className="w-4 h-4" />Change Password
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

          </div>{/* end LEFT */}

          {/* ── RIGHT: Current Plan ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            {loadingSub ? (
              <div className="h-72 rounded-xl bg-muted animate-pulse" />
            ) : (
              <Card className="overflow-hidden border-0 shadow-lg">
                {/* Hero Banner */}
                <div className={`bg-linear-to-br ${planColor} p-6 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-80 uppercase tracking-wide">Current Plan</span>
                      </div>
                      <h2 className="text-3xl font-bold">{plan?.name ?? "No Plan"}</h2>
                      {plan && plan.price > 0 && (
                        <p className="text-sm opacity-70 mt-1">{fmtPrice(plan.price, plan.currency)} / month</p>
                      )}
                      {plan && plan.price === 0 && (
                        <p className="text-sm opacity-70 mt-1">Free tier</p>
                      )}
                    </div>

                    {/* Expiry Chip */}
                    <div className="text-right">
                      {sub?.isExpired ? (
                        <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />Expired
                        </span>
                      ) : expiryDate ? (
                        <div>
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

                {/* Usage Bars */}
                {sub?.usage && plan && (
                  <div className="p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Usage This Period</h3>
                    <div className="grid gap-3">
                      <UsageBar current={sub.usage.templates}     limit={plan.templateLimit}     label="Message Templates" icon={<FileText     className="w-3.5 h-3.5" />} />
                      <UsageBar current={sub.usage.conversations} limit={plan.conversationLimit} label="Conversations"      icon={<MessageSquare className="w-3.5 h-3.5" />} />
                      <UsageBar current={sub.usage.chatbots}      limit={plan.chatbotLimit}      label="Chatbot Workflows"  icon={<Bot           className="w-3.5 h-3.5" />} />
                      <UsageBar current={sub.usage.teamUsers}     limit={plan.teamUsersLimit}    label="Team Members"       icon={<Users         className="w-3.5 h-3.5" />} />
                      <UsageBar current={sub.usage.gallery}       limit={plan.galleryLimit}      label="Gallery Items"      icon={<Image         className="w-3.5 h-3.5" />} />
                    </div>
                  </div>
                )}

                {/* Upgrade / Change Plan CTA — always visible */}
                <div className="px-6 pb-6">
                  <div className={`rounded-xl p-4 flex items-center justify-between ${
                    !plan || plan.price === 0 || sub?.isExpired
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-muted/50 border border-border"
                  }`}>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {!plan || plan.price === 0 || sub?.isExpired ? "Unlock more features" : "Manage your plan"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {!plan || plan.price === 0 || sub?.isExpired
                          ? "Upgrade your plan to increase limits"
                          : "Change or upgrade your current plan"}
                      </p>
                    </div>
                    <Button size="sm" className="gap-2 shrink-0" onClick={() => setShowUpgrade(true)}>
                      <Zap className="w-3.5 h-3.5" />
                      {!plan || plan.price === 0 || sub?.isExpired ? "Upgrade" : "Change Plan"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Feature Highlights */}
                {plan && (
                  <div className="px-6 pb-6 grid grid-cols-2 gap-2">
                    {[
                      { label: `${fmtLimit(plan.templateLimit)} Templates`,        icon: <FileText     className="w-3 h-3" /> },
                      { label: `${fmtLimit(plan.conversationLimit)} Conversations`, icon: <MessageSquare className="w-3 h-3" /> },
                      { label: `${fmtLimit(plan.chatbotLimit)} Chatbots`,          icon: <Bot           className="w-3 h-3" /> },
                      { label: `${fmtLimit(plan.teamUsersLimit)} Team Members`,    icon: <Users         className="w-3 h-3" /> },
                      { label: `${fmtLimit(plan.galleryLimit)} Gallery Items`,     icon: <Image         className="w-3 h-3" /> },
                      { label: `${fmtLimit(plan.formLimit)} Forms`,                icon: <BarChart3     className="w-3 h-3" /> },
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
          </motion.div>{/* end RIGHT */}

        </div>{/* end grid */}

        {/* ── Billing History & Invoices ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Billing & Invoices</h3>
                  <p className="text-sm text-muted-foreground">View your payment history and download invoices</p>
                </div>
              </div>
            </div>

            {loadingPayments ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading billing history...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
                <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No payment history yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your invoices will appear here after your first purchase</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="pb-3 pr-4">Invoice</th>
                      <th className="pb-3 px-4">Plan</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {payments.map((p, index) => (
                      <tr key={p.id || index} className="text-sm hover:bg-muted/30 transition-colors group">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                              <Receipt className="w-4 h-4 text-primary/60" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-xs">
                                {p.invoiceNumber || `TXN-${(p.id || '').slice(0, 8)?.toUpperCase() || index}`}
                              </div>
                              <div className="text-[10px] text-muted-foreground tabular-nums opacity-60 font-mono">
                                {p.razorpayOrderId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-foreground">
                            {p.planName || p.subscription?.plan?.name || (p.status === "captured" ? "Custom" : (p.status === "pending" ? "Basic" : "Plan"))}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold tabular-nums text-foreground">
                          {fmtPrice(p.amount, p.currency)}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            p.status === "captured"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : p.status === "failed"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>
                            {p.status === "captured" ? "Paid" : p.status}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          {p.status === "captured" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 gap-1.5 text-primary hover:text-primary/80"
                              onClick={() => openInvoice(p.id)}
                              disabled={loadingInvoice === p.id}
                            >
                              {loadingInvoice === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              Invoice
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

      </div>
    </>
  );
}
