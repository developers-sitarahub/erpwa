"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  User,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/button";
import { X, DownloadCloud } from "lucide-react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  planName: string | null;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
  };
  subscription?: {
    plan: {
      name: string;
    };
  };
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
function fmtLimit(val: number) {
  return val === -1 ? "∞" : val.toLocaleString();
}

const fmtInvoicePrice = (price: number, currency: string) => {
  if (price === 0) return "Free";
  if (currency === "INR") return `₹${price.toLocaleString("en-IN")}`;
  return `$${price}`;
};

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
                {fmtInvoicePrice(invoice.totalAmount, invoice.currency)} paid on {new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
                      {fmtInvoicePrice(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="py-6 text-right text-slate-900 font-bold tabular-nums">
                      {fmtInvoicePrice(invoice.totalAmount, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.taxAmount > 0 && (
                    <tr className="text-slate-500">
                      <td className="py-4 font-medium italic">Adjustments / GST</td>
                      <td className="py-4 text-center">1</td>
                      <td className="py-4 text-right tabular-nums">-{fmtInvoicePrice(invoice.taxAmount, invoice.currency)}</td>
                      <td className="py-4 text-right tabular-nums">-{fmtInvoicePrice(invoice.taxAmount, invoice.currency)}</td>
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
                  <span className="font-medium tabular-nums">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Amount paid</span>
                  <span className="tabular-nums">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</span>
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
                    <td className="py-4 text-center tabular-nums font-bold">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
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
            {fmtInvoicePrice(invoice.totalAmount, invoice.currency)} paid on {new Date(invoice.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
                <td className="text-right font-bold tabular-nums">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
                <td className="text-right font-black text-lg tabular-nums">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right py-8 text-slate-400">Subtotal</td>
                <td className="text-right py-8 font-bold tabular-nums">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right py-4 text-xl font-black">Total Amount Paid</td>
                <td className="text-right py-4 text-2xl font-black tabular-nums border-t-4 border-slate-900">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
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
                    <td className="py-6 text-center text-xl font-black">{fmtInvoicePrice(invoice.totalAmount, invoice.currency)}</td>
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

export default function SuperAdminTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    api
      .get("/super-admin/payments")
      .then((r) => setPayments(r.data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load transactions");
      })
      .finally(() => setLoading(false));
  }, []);

  const openInvoice = async (paymentId: string) => {
    setLoadingInvoice(paymentId);
    try {
      const res = await api.get(`/super-admin/invoice/${paymentId}`);
      setInvoiceDetail(res.data);
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoadingInvoice(null);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = payments.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.vendor.name.toLowerCase().includes(searchLower) ||
      (p.razorpayPaymentId ?? "").toLowerCase().includes(searchLower) ||
      (p.invoiceNumber ?? "").toLowerCase().includes(searchLower) ||
      (p.planName ?? "").toLowerCase().includes(searchLower)
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "captured":
        return "bg-green-500/10 text-green-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      case "pending":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const fmtPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(amount);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {invoiceDetail && (
          <InvoiceModal 
            key="invoice-modal"
            invoice={invoiceDetail} 
            onClose={() => setInvoiceDetail(null)} 
          />
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Transactions & Invoices
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review all payments, platform revenue, and vendor invoices
            </p>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm text-muted-foreground transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Total Revenue (Captured)</p>
                <p className="text-2xl font-black mt-1 text-foreground">
                    {fmtPrice(
                        payments
                            .filter(p => p.status === "captured")
                            .reduce((sum, p) => sum + p.amount, 0),
                        "INR"
                    )}
                </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Successful Payments</p>
                <p className="text-2xl font-black mt-1 text-foreground">
                    {payments.filter(p => p.status === "captured").length}
                </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Pending/Failed</p>
                <p className="text-2xl font-black mt-1 text-foreground">
                    {payments.filter(p => p.status !== "captured").length}
                </p>
            </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by vendor, plan, or transaction ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try adjusting your search filters" : "No payment history available yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto text-foreground">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Vendor
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Transaction ID
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(p.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold truncate max-w-[150px]">
                          {p.vendor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/5 text-blue-600 font-bold text-[10px] uppercase">
                        {p.planName || p.subscription?.plan?.name || "Trial"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black whitespace-nowrap">
                      {fmtPrice(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                          getStatusStyle(p.status)
                        )}
                      >
                        {p.status === "captured" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : p.status === "pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                        {p.razorpayPaymentId || "—"}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {p.invoiceNumber ? (
                        <button 
                            onClick={() => openInvoice(p.id)}
                            disabled={loadingInvoice === p.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                        >
                            {loadingInvoice === p.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <FileText className="h-3.5 w-3.5" />
                            )}
                            {p.invoiceNumber}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
