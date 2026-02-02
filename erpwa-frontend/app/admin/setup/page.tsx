"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { toast } from "react-toastify";

type WhatsAppStatus = "not_configured" | "connected" | "error";
type SetupMethod = "embedded" | "manual";

/* ================= CONFIRM TOAST ================= */

export default function WhatsAppSetupPage() {
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<WhatsAppStatus>("not_configured");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>("embedded");
  const [authCode, setAuthCode] = useState<string | null>(null);

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

  /* ================= CONFIRM TOAST ================= */

  function showConfirmToast(options: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }) {
    toast(
      ({ closeToast }) => (
        <div className="space-y-2">
          <p className="font-medium">{options.title}</p>
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
              className="border border-border px-3 py-1.5 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false },
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

  /* ================= PREFILL FORM ON EDIT ================= */
  useEffect(() => {
    if (!config.whatsappBusinessId || !config.whatsappPhoneNumberId) return;

    setForm((prev) => ({
      ...prev,
      whatsappBusinessId: config.whatsappBusinessId!,
      whatsappPhoneNumberId: config.whatsappPhoneNumberId!,
      whatsappAccessToken: "", // never prefill token
    }));
  }, [config.whatsappBusinessId, config.whatsappPhoneNumberId]);

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setStatus("error");
      setError(error.response?.data?.message || "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  /* ================= EMBEDDED SIGNUP ================= */

  /* ================= EMBEDDED SIGNUP (FB SDK) ================= */

  useEffect(() => {
    // Load Facebook SDK
    // Load Facebook SDK
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: "1336009088545442",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v24.0",
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Listener for Session Info (WABA & Phone ID)
  // We store these temporarily to send with the code
  const [sessionData, setSessionData] = useState<{
    wabaId?: string;
    phoneNumberId?: string;
  }>({});

  /* ================= EMBEDDED SIGNUP (FB SDK) ================= */

  // Listener for Session Info (WABA & Phone ID)
  // We store these temporarily to send with the code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: facebook events come from facebook.com
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            const { phone_number_id, waba_id } = data.data;
            console.log("📦 Session received", { waba_id, phone_number_id });
            setSessionData({
              wabaId: waba_id,
              phoneNumberId: phone_number_id,
            });
          } else if (data.event === "CANCEL") {
            // Handle cancellation if needed
          } else if (data.event === "ERROR") {
            // Handle error if needed
            const { error_message } = data.data;
            toast.error("Error from Meta: " + error_message);
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
        console.debug("Non-JSON message received", event.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!authCode || !sessionData.wabaId || !sessionData.phoneNumberId) return;

    const sendToBackend = async () => {
      setSaving(true);
      setError(null);

      try {
        console.log("🚀 Sending to backend", {
          code: authCode,
          wabaId: sessionData.wabaId,
          phoneNumberId: sessionData.phoneNumberId,
        });

        await api.post("/vendor/whatsapp/embedded-setup", {
          code: authCode,
          wabaId: sessionData.wabaId,
          phoneNumberId: sessionData.phoneNumberId,
        });

        const res = await api.get("/vendor/whatsapp");
        setConfig(res.data);
        setStatus("connected");
        toast.success("WhatsApp connected successfully 🎉");
      } catch (err: any) {
        setStatus("error");
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Embedded setup failed");
      } finally {
        setSaving(false);
        setAuthCode(null);
        setSessionData({});
      }
    };

    sendToBackend();
  }, [authCode, sessionData]);

  const handleEmbeddedSignup = async () => {
    try {
      setSaving(true);
      // Get the embedded signup URL from backend
      const res = await api.get("/vendor/whatsapp/embedded-signup-url");
      const { signupUrl } = res.data;

      // Open Meta's embedded signup in a popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        signupUrl,
        "MetaEmbeddedSignup",
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      // We don't await the result here; the "message" listener handles the rest.
    } catch (err: any) {
      toast.error(
        "Failed to start setup: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setSaving(false);
    }
  };

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp Business</h1>
        <p className="text-sm text-muted-foreground">
          Manage your WhatsApp Business integration.
        </p>
      </div>

      {/* Status */}
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
                  "Reconfiguring will replace the existing connection and may interrupt message delivery.",
                confirmLabel: "Yes, edit",
                onConfirm: () => setIsEditing(true),
              })
            }
            className="border border-border rounded-md px-4 py-2 text-sm hover:bg-muted"
          >
            Reconfigure
          </button>
        </div>
      )}

      {/* ================= SETUP METHOD SELECTION ================= */}
      {(status !== "connected" || isEditing) && (
        <div className="space-y-4">
          {/* Setup Method Tabs */}
          <div className="bg-card border border-border rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setSetupMethod("embedded")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                setupMethod === "embedded"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Embedded Signup</span>
                <span className="text-xs opacity-75">(Recommended)</span>
              </div>
            </button>
            <button
              onClick={() => setSetupMethod("manual")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                setupMethod === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>⚙️</span>
                <span>Manual Setup</span>
              </div>
            </button>
          </div>

          {/* ================= EMBEDDED SIGNUP ================= */}
          {setupMethod === "embedded" && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Quick Setup with Meta</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your WhatsApp Business account in just a few clicks
                  using Meta&apos;s secure OAuth flow.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">✨ Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• No need to manually copy credentials</li>
                  <li>• Secure OAuth authentication</li>
                  <li>• Automatic token management</li>
                  <li>• Faster setup process</li>
                </ul>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleEmbeddedSignup}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground rounded-md py-3 font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    <span>Connect with Meta</span>
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                You&apos;ll be redirected to Meta to authorize the connection
              </p>
            </div>
          )}

          {/* ================= MANUAL SETUP FORM ================= */}
          {setupMethod === "manual" && (
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-lg p-6 space-y-4"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Manual Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your WhatsApp Business credentials manually from Meta
                  Business Manager.
                </p>
              </div>

              {isEditing && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Existing values are pre-filled. Access token must be
                    re-entered for security.
                  </p>
                </div>
              )}

              {/* Business ID */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  WhatsApp Business Account ID
                </label>
                <p className="text-xs text-muted-foreground">
                  Found in Meta Business Manager → WhatsApp Accounts
                </p>
                <input
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.whatsappBusinessId}
                  onChange={(e) =>
                    setForm({ ...form, whatsappBusinessId: e.target.value })
                  }
                  placeholder="123456789012345"
                  required
                />
              </div>

              {/* Phone Number ID */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone Number ID</label>
                <p className="text-xs text-muted-foreground">
                  Your WhatsApp phone number identifier from Meta
                </p>
                <input
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.whatsappPhoneNumberId}
                  onChange={(e) =>
                    setForm({ ...form, whatsappPhoneNumberId: e.target.value })
                  }
                  placeholder="987654321098765"
                  required
                />
              </div>

              {/* Access Token */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Access Token</label>
                <p className="text-xs text-muted-foreground">
                  Permanent token with WhatsApp permissions (stored securely
                  encrypted)
                </p>
                <textarea
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  value={form.whatsappAccessToken}
                  onChange={(e) =>
                    setForm({ ...form, whatsappAccessToken: e.target.value })
                  }
                  rows={4}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxx..."
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
                  {error}
                </div>
              )}

              <button
                disabled={saving}
                className="w-full bg-primary text-primary-foreground rounded-md py-3 font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {saving ? "Verifying…" : "Verify & Save"}
              </button>

              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Need help?</strong> Follow our{" "}
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    setup guide
                  </a>{" "}
                  to get your credentials from Meta Business Manager.
                </p>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
