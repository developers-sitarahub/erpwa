"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { toast } from "react-toastify";

type WhatsAppStatus = "not_configured" | "connected" | "error";

export default function WhatsAppSetupPage() {
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<WhatsAppStatus>("not_configured");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<{
    whatsappBusinessId?: string;
    whatsappPhoneNumberId?: string;
    whatsappVerifiedAt?: string;
  }>({});

  const [form, setForm] = useState({
    whatsappBusinessId: "",
    whatsappPhoneNumberId: "",
    whatsappAccessToken: "",
  });

  /* ================= CONFIRM TOAST (v11 SAFE) ================= */

  function showConfirmToast(options: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }) {
    toast(
      ({ closeToast }) => (
        <div className="space-y-2">
          <p className="font-medium text-foreground">{options.title}</p>

          <p className="text-sm text-muted-foreground">{options.message}</p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                options.onConfirm();
                closeToast();
              }}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm"
            >
              {options.confirmLabel}
            </button>

            <button
              onClick={closeToast}
              className="border border-border text-foreground px-3 py-1.5 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
      }
    );
  }

  /* ================= LOAD STATUS ================= */

  useEffect(() => {
    if (!user) return;

    async function loadStatus() {
      try {
        const res = await api.get("/vendor/whatsapp");
        setStatus(res.data.whatsappStatus);
        setError(res.data.whatsappLastError);
        setConfig(res.data);
      } catch {
        setStatus("not_configured");
      } finally {
        setPageLoading(false);
      }
    }

    loadStatus();
  }, [user]);

  /* ================= SUBMIT ================= */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.post("/vendor/whatsapp/setup", form);
      const res = await api.get("/vendor/whatsapp");

      setConfig(res.data);
      setStatus("connected");
      setIsEditing(false);

      setForm({
        whatsappBusinessId: "",
        whatsappPhoneNumberId: "",
        whatsappAccessToken: "",
      });

      toast.success("WhatsApp configuration updated successfully");
    } catch (err: any) {
      setStatus("error");
      setError(err.response?.data?.message || "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  /* ================= GUARDS ================= */

  if (authLoading || pageLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!user || user.role !== "vendor_owner") {
    return (
      <div className="p-6 text-destructive">
        You do not have permission to access this page.
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp Business</h1>
        <p className="text-sm text-muted-foreground">
          Manage your WhatsApp Business integration.
        </p>
      </div>

      {/* Status Badge */}
      <div>
        {status === "connected" && (
          <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
            ✅ Connected
          </span>
        )}
        {status === "error" && (
          <span className="rounded-full bg-destructive/10 text-destructive px-3 py-1 text-sm">
            ❌ Error
          </span>
        )}
        {status === "not_configured" && (
          <span className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-sm">
            Not configured
          </span>
        )}
      </div>

      {/* ================= CONNECTED VIEW ================= */}
      {status === "connected" && !isEditing && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <p className="font-medium text-primary">
            WhatsApp is currently connected
          </p>

          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Business ID:</span>{" "}
              {config.whatsappBusinessId}
            </div>
            <div>
              <span className="text-muted-foreground">Phone Number ID:</span>{" "}
              {config.whatsappPhoneNumberId}
            </div>
            {config.whatsappVerifiedAt && (
              <div>
                <span className="text-muted-foreground">Connected on:</span>{" "}
                {new Date(config.whatsappVerifiedAt).toLocaleString()}
              </div>
            )}
          </div>

          <button
            onClick={() =>
              showConfirmToast({
                title: "Edit WhatsApp configuration?",
                message:
                  "Reconfiguring will replace the existing connection and may interrupt message delivery until setup is completed again.",
                confirmLabel: "Yes, edit",
                onConfirm: () => setIsEditing(true),
              })
            }
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition"
          >
            Reconfigure
          </button>
        </div>
      )}

      {/* ================= EDIT / SETUP FORM ================= */}
      {(status !== "connected" || isEditing) && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-5 space-y-4"
        >
          {/* Back button */}
          {isEditing && (
            <button
              type="button"
              onClick={() =>
                showConfirmToast({
                  title: "Discard changes?",
                  message:
                    "Any unsaved changes will be lost. Your existing WhatsApp connection will remain active.",
                  confirmLabel: "Discard & go back",
                  onConfirm: () => {
                    setIsEditing(false);
                    setError(null);
                  },
                })
              }
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          )}

          <input
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring"
            placeholder="WhatsApp Business Account ID"
            value={form.whatsappBusinessId}
            onChange={(e) =>
              setForm({ ...form, whatsappBusinessId: e.target.value })
            }
            required
          />

          <input
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring"
            placeholder="Phone Number ID"
            value={form.whatsappPhoneNumberId}
            onChange={(e) =>
              setForm({ ...form, whatsappPhoneNumberId: e.target.value })
            }
            required
          />

          <textarea
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring"
            placeholder="WhatsApp Access Token (stored securely)"
            value={form.whatsappAccessToken}
            onChange={(e) =>
              setForm({ ...form, whatsappAccessToken: e.target.value })
            }
            required
            rows={4}
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
              {error}
            </div>
          )}

          <button
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Verifying…" : "Verify & Save"}
          </button>
        </form>
      )}
    </div>
  );
}
