"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Store,
  Loader2,
  Users,
  ShieldCheck,
  Building2,
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";

type Owner = {
  id: string;
  name: string;
  email: string;
  onboardingStatus: string;
};

type Vendor = {
  id: string;
  name: string;
  businessCategory: string | null;
  country: string | null;
  whatsappStatus: string;
  createdAt: string;
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  userCount: number;
  owner: Owner | null;
};

// Helper for days remaining
function getSubscriptionStatus(endDate?: string | null) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function ActivatedVendorsPage() {
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVendors = useCallback(() => {
    setLoading(true);
    api
      .get("/super-admin/vendors")
      .then((r) => setAllVendors(r.data))
      .catch(() => toast.error("Failed to load vendors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Activated = owner activated via admin OR WhatsApp is already connected (old flow)
  const vendors = allVendors.filter(
    (v) =>
      v.owner?.onboardingStatus === "activated" ||
      v.whatsappStatus === "connected",
  );

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.owner?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.owner?.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Activated Vendors
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All live &amp; active vendor accounts on the platform
            </p>
          </div>
        </div>
        <button
          onClick={fetchVendors}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm text-muted-foreground transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by vendor name, owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} of {vendors.length}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border gap-3">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No activated vendors yet
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Users
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subscription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Store className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {v.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {v.owner ? (
                      <>
                        <p className="font-medium text-foreground">
                          {v.owner.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.owner.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        No owner
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {v.businessCategory || v.country ? (
                      <div className="space-y-0.5">
                        {v.businessCategory && (
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {v.businessCategory}
                          </div>
                        )}
                        {v.country && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {v.country}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {v.userCount}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        v.whatsappStatus === "connected"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {v.whatsappStatus === "connected" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {v.whatsappStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {new Date(v.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const days = getSubscriptionStatus(v.subscriptionEnd);
                      if (days === null) {
                        return (
                          <span className="text-muted-foreground text-xs italic">
                            —
                          </span>
                        );
                      }
                      const isExpired = days < 0;
                      const isWarning = days >= 0 && days <= 3;
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isExpired
                                ? "text-destructive"
                                : isWarning
                                  ? "text-orange-500"
                                  : "text-primary"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isExpired
                              ? "Expired"
                              : days === 0
                                ? "Ends Today"
                                : `${days} Days Left`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            15-day Trial
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
