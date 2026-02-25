"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { toast } from "react-toastify";

type WhatsAppStatus = "not_configured" | "connected" | "error";
type SetupMethod = "embedded" | "manual";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function WhatsAppSetupPage() {
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<WhatsAppStatus>("not_configured");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>("embedded");
  const [setupStep, setSetupStep] = useState<string | null>(null);

  // We use a ref to track the session because the cleanup/finish event
  // might fire *after* the FB.login callback closes over the state,
  // so state updates wouldn't be visible inside the polling loop.
  const sessionRef = useRef<{
    whatsappBusinessId: string;
    whatsappPhoneNumberId: string;
  } | null>(null);

  const [config, setConfig] = useState<{
    whatsappBusinessId?: string;
    whatsappPhoneNumberId?: string;
    whatsappVerifiedAt?: string;
    whatsappVerificationStatus?: string;
    whatsappQualityRating?: string;
    whatsappMessagingTier?: string;
    whatsappVerifiedName?: string;
    whatsappDisplayPhoneNumber?: string;
  }>({});

  const [form, setForm] = useState({
    whatsappBusinessId: "",
    whatsappPhoneNumberId: "",
    whatsappAccessToken: "",
  });

  const [embeddedSession, setEmbeddedSession] = useState<{
    whatsappBusinessId: string;
    whatsappPhoneNumberId: string;
  } | null>(null);

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

  useEffect(() => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        xfbml: false,
        version: "v24.0",
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      const payload =
        typeof event.data === "string"
          ? (() => {
              try {
                return JSON.parse(event.data);
              } catch {
                return null;
              }
            })()
          : event.data;

      if (!payload) return;

      if (payload.type === "WA_EMBEDDED_SIGNUP") {
        console.log("📩 WA_EMBEDDED_SIGNUP:", payload);

        if (payload.event === "FINISH") {
          setSetupStep("WhatsApp account received from Meta...");
          const newSession = {
            whatsappBusinessId: payload.data.waba_id,
            whatsappPhoneNumberId: payload.data.phone_number_id,
          };
          setEmbeddedSession(newSession);
          sessionRef.current = newSession; // Update Ref for synchronous access
        }

        if (payload.event === "ERROR") {
          console.error("❌ Embedded signup error:", payload.data);
        }

        if (payload.event === "CANCEL") {
          console.warn("⚠️ Embedded signup cancelled:", payload.data);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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
    setSetupStep("Validating WhatsApp credentials...");

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
      setSetupStep(null);
    }
  }

  /* ================= REFRESH ================= */

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshStatus() {
    setRefreshing(true);
    try {
      const res = await api.post("/vendor/whatsapp/refresh-status");
      setConfig(res.data);
      toast.success("WhatsApp health status synced with Meta");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to refresh status");
    } finally {
      setRefreshing(false);
    }
  }

  /* ================= EMBEDDED SIGNUP ================= */

  function handleEmbeddedSignup() {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded");
      return;
    }

    setSaving(true);
    setError(null);
    setSetupStep("Opening Meta signup...");
    setEmbeddedSession(null);
    sessionRef.current = null; // Clear ref before starting

    window.FB.login(
      (response: any) => {
        if (!response.authResponse) {
          setSaving(false);
          setSetupStep(null);
          setError(null);
          toast.error("Signup cancelled");
          return;
        }

        const code = response.authResponse.code;

        setSetupStep("Receiving WhatsApp account details...");

        // ⏳ wait for WA_EMBEDDED_SIGNUP
        const waitForSession = async () => {
          for (let i = 0; i < 20; i++) {
            // Check ref instead of state to avoid closure staleness
            if (sessionRef.current) return sessionRef.current;
            await new Promise((r) => setTimeout(r, 500));
          }
          return null;
        };

        (async () => {
          const session = await waitForSession();

          if (!session) {
            setSaving(false);
            setError("Failed to receive WhatsApp account details from Meta");
            return;
          }

          try {
            setSetupStep("Activating phone number...");
            await api.post("/vendor/whatsapp/embedded-setup", {
              code,
              whatsappBusinessId: session.whatsappBusinessId,
              whatsappPhoneNumberId: session.whatsappPhoneNumberId,
            });

            const res = await api.get("/vendor/whatsapp");
            setSetupStep("Finalizing connection...");
            setConfig(res.data);
            setStatus("connected");
            toast.success("WhatsApp connected successfully");
          } catch (err: any) {
            setStatus("error");

            const metaMessage =
              err.response?.data?.metaError?.error?.message ||
              err.response?.data?.message;

            if (metaMessage?.includes("register")) {
              setError("Phone number activation failed. Please retry.");
            } else if (metaMessage?.includes("permission")) {
              setError("Required WhatsApp permissions are missing.");
            } else if (metaMessage?.includes("token")) {
              setError("Authentication failed. Please reconnect.");
            } else {
              setError(metaMessage || "Embedded signup failed");
            }
          } finally {
            setSaving(false);
            setSetupStep(null);
          }
        })();
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
        response_type: "code",
        override_default_response_type: true,
        extras: { version: "v3" },
      },
    );
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
        <div className="space-y-6">
          {/* Main Alerts */}
          {(() => {
            if (
              config.whatsappVerificationStatus &&
              config.whatsappVerificationStatus !== "VERIFIED"
            ) {
              return (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 text-sm space-y-1">
                  <p className="font-semibold">
                    ⚠️ Phone verification incomplete
                  </p>
                  <p>
                    Your number is connected but verification is not complete.
                    Messaging may be blocked.
                  </p>
                </div>
              );
            }
            if (config.whatsappQualityRating === "RED") {
              return (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 text-sm space-y-1">
                  <p className="font-semibold">
                    ⚠️ Number connected but currently restricted by WhatsApp
                    quality system
                  </p>
                  <p>
                    Quality rating is RED. Your messaging capabilities might be
                    limited or disabled until the rating improves.
                  </p>
                </div>
              );
            }
            if (config.whatsappQualityRating === "YELLOW") {
              return (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md p-4 text-sm space-y-1">
                  <p className="font-semibold">
                    ⚠️ WhatsApp active with reduced quality
                  </p>
                  <p>
                    Quality rating is YELLOW. Please be cautious with messaging
                    behavior.
                  </p>
                </div>
              );
            }
            return (
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-md p-4 text-sm space-y-1">
                <p className="font-semibold">✅ WhatsApp active & healthy</p>
                <p>Your number is verified and has a good quality rating.</p>
              </div>
            );
          })()}

          {/* Health & Status Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">WhatsApp Health Status</h3>
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="text-sm border border-border bg-background hover:bg-muted px-3 py-1 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {refreshing ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <span className="text-xs">🔄</span>
                )}
                {refreshing ? "Syncing..." : "Sync Health"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Verification Status */}
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  Verification
                </span>
                <span className="flex items-center gap-2 font-medium">
                  {config.whatsappVerificationStatus === "VERIFIED" ? (
                    <>
                      <span className="text-green-500">●</span> Verified
                    </>
                  ) : (
                    <>
                      <span className="text-destructive">●</span>{" "}
                      {config.whatsappVerificationStatus || "Unknown"}
                    </>
                  )}
                </span>
              </div>

              {/* Quality Rating */}
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  Quality Rating
                </span>
                <span className="flex items-center gap-2 font-medium">
                  {config.whatsappQualityRating === "GREEN" ? (
                    <>
                      <span className="text-green-500">●</span> High (Green)
                    </>
                  ) : config.whatsappQualityRating === "YELLOW" ? (
                    <>
                      <span className="text-amber-500">●</span> Medium (Yellow)
                    </>
                  ) : config.whatsappQualityRating === "RED" ? (
                    <>
                      <span className="text-destructive">●</span> Low (Red)
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">●</span> Unknown
                    </>
                  )}
                </span>
              </div>

              {/* Messaging Tier */}
              <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  Messaging Tier
                </span>
                <span className="font-medium">
                  {config.whatsappMessagingTier
                    ? config.whatsappMessagingTier.replace(/_/g, " ")
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="font-medium text-primary">Connection Details</h3>

            <div className="text-sm space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">
                    Business Name
                  </span>
                  <span className="font-medium text-lg">
                    {config.whatsappVerifiedName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">
                    Phone Number
                  </span>
                  <span className="font-medium text-lg">
                    {config.whatsappDisplayPhoneNumber || "—"}
                  </span>
                </div>
              </div>

              {config.whatsappVerifiedAt && (
                <div className="pt-2 border-t border-border mt-2">
                  <span className="text-muted-foreground text-xs mb-1 flex justify-between">
                    <span>Integration Date</span>
                    <span className="font-mono text-[10px] text-muted-foreground opacity-50 text-right">
                      PID: {config.whatsappPhoneNumberId}
                    </span>
                  </span>
                  <span>
                    {new Date(config.whatsappVerifiedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border mt-4">
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
                Reconfigure Connection
              </button>
            </div>
          </div>
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

              {embeddedSession && (
                <div className="bg-muted/30 border border-border rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium">✅ Meta Provided:</p>
                  <p>Business ID: {embeddedSession.whatsappBusinessId}</p>
                  <p>
                    Phone Number ID: {embeddedSession.whatsappPhoneNumberId}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    ❌ Setup Error
                  </p>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              )}

              {saving && setupStep && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">⚙️ Setup Progress</p>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {setupStep}
                  </p>
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

              {saving && setupStep && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">⚙️ Setup Progress</p>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {setupStep}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    ❌ Setup Error
                  </p>
                  <p className="text-sm text-destructive/90">{error}</p>
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
