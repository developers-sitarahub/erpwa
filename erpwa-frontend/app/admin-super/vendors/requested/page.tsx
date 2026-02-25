"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Store,
  Loader2,
  Users,
  Building2,
  Globe,
  RefreshCw,
  Clock,
  Eye,
  X,
  Mail,
  Phone,
  User,
  Calendar,
  Tag,
  MapPin,
  CheckCircle2,
  Wifi,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";

type Owner = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  createdAt: string;
  onboardingStatus: string;
};

type Vendor = {
  id: string;
  name: string;
  businessCategory: string | null;
  country: string | null;
  whatsappStatus: string;
  createdAt: string;
  userCount: number;
  owner: Owner | null;
};

type RegistrationRecord = {
  ownerName: string | null;
  ownerEmail: string | null;
  ownerMobile: string | null;
  businessName: string | null;
  businessCategory: string | null;
  country: string | null;
  step1CompletedAt: string | null;
  step2CompletedAt: string | null;
  _fallback?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  identity_verified: "Identity Verified",
  business_info_completed: "Business Info Submitted",
  whatsapp_connected: "WhatsApp Connected",
  activated: "Activated",
};

function fmt(date: string | null | undefined, long = false) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: long ? "long" : "short",
    year: "numeric",
    ...(long ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default function RequestedVendorsPage() {
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer state
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regData, setRegData] = useState<RegistrationRecord | null>(null);
  const [regError, setRegError] = useState(false);

  const [activatingId, setActivatingId] = useState<string | null>(null);

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

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetch registration data when a vendor is selected
  useEffect(() => {
    if (!selectedVendor) return;
    setRegLoading(true);
    setRegData(null);
    setRegError(false);
    api
      .get(`/super-admin/vendors/${selectedVendor.id}/registration`)
      .then((r) => setRegData(r.data))
      .catch(() => setRegError(true))
      .finally(() => setRegLoading(false));
  }, [selectedVendor]);

  function closeDrawer() {
    setSelectedVendor(null);
    setRegData(null);
    setRegError(false);
  }

  // Requested = not yet activated AND WhatsApp not connected
  const vendors = allVendors.filter(
    (v) =>
      v.owner !== null &&
      v.owner?.onboardingStatus !== "activated" &&
      v.whatsappStatus !== "connected",
  );

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.owner?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.owner?.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleActivate(vendor: Vendor) {
    setActivatingId(vendor.id);
    try {
      await api.put(`/super-admin/vendors/${vendor.id}/activate`);
      toast.success(`${vendor.name} has been activated!`);
      closeDrawer();
      fetchVendors();
    } catch {
      toast.error("Failed to activate vendor");
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Requested Vendors
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              New registrations awaiting your review &amp; activation
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

      {/* Search */}
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
          <Clock className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No pending vendor requests
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                {[
                  "Vendor",
                  "Owner",
                  "Category",
                  "Users",
                  "Status",
                  "Joined",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Store className="h-4 w-4 text-amber-500" />
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
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500">
                      <Clock className="h-3 w-3" />
                      {STATUS_LABELS[v.owner?.onboardingStatus ?? "pending"] ??
                        "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {fmt(v.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedVendor(v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted text-foreground text-xs font-semibold transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== DETAILS DRAWER ===== */}
      {selectedVendor && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-screen w-full max-w-lg bg-card border-l border-border flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          selectedVendor ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedVendor && (
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <Store className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base">
                    {selectedVendor.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Registration Details
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {regLoading ? (
                <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading registration data…</span>
                </div>
              ) : regError ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm">Failed to load registration data</p>
                </div>
              ) : regData ? (
                <>
                  {regData._fallback && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-500">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      This vendor registered before the new system — showing
                      data from profile records.
                    </div>
                  )}

                  {/* Step 1 — Identity */}
                  <Section number="1" title="Identity Information">
                    <DetailRow
                      icon={<User className="h-4 w-4" />}
                      label="Full Name"
                      value={regData.ownerName}
                    />
                    <DetailRow
                      icon={<Mail className="h-4 w-4" />}
                      label="Email Address"
                      value={regData.ownerEmail}
                    />
                    <DetailRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Mobile Number"
                      value={regData.ownerMobile}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Step 1 Completed"
                      value={fmt(regData.step1CompletedAt, true)}
                    />
                  </Section>

                  {/* Step 2 — Business Info */}
                  <Section number="2" title="Business Information">
                    <DetailRow
                      icon={<Store className="h-4 w-4" />}
                      label="Business Name"
                      value={regData.businessName}
                    />
                    <DetailRow
                      icon={<Tag className="h-4 w-4" />}
                      label="Business Category"
                      value={regData.businessCategory}
                    />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Country / Region"
                      value={regData.country}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Step 2 Completed"
                      value={fmt(regData.step2CompletedAt, true)}
                    />
                  </Section>

                  {/* Onboarding Status */}
                  <Section number="✓" title="Onboarding Status">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        {STATUS_LABELS[
                          selectedVendor.owner?.onboardingStatus ?? "pending"
                        ] ?? selectedVendor.owner?.onboardingStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Awaiting admin activation
                      </span>
                    </div>
                  </Section>

                  {/* WhatsApp */}
                  <Section number="3" title="WhatsApp Integration">
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedVendor.whatsappStatus === "connected"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        {selectedVendor.whatsappStatus.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedVendor.whatsappStatus === "connected"
                          ? "WhatsApp is connected"
                          : "Not yet configured"}
                      </span>
                    </div>
                  </Section>
                </>
              ) : null}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10">
              <button
                onClick={() => handleActivate(selectedVendor)}
                disabled={activatingId === selectedVendor.id || regLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
              >
                {activatingId === selectedVendor.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {activatingId === selectedVendor.id
                  ? "Activating…"
                  : `Activate ${selectedVendor.name}`}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                This will grant the vendor full access to the platform.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
          {number}
        </div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm text-foreground break-all">{value ?? "—"}</p>
      </div>
    </div>
  );
}
