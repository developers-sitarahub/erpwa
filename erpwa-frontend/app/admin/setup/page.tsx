"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Smartphone, RefreshCcw, AlertCircle } from "lucide-react";

type WhatsAppStatus = "not_configured" | "connected" | "error";
type SetupMethod = "embedded" | "manual";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function WhatsAppSetupPage() {
  const { user, loading: authLoading, updateUser } = useAuth();

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

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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
        // 🛡️ Always try to sync with Meta on page load for the most accurate status
        const res = await api.post("/vendor/whatsapp/refresh-status");
        setStatus(res.data.whatsappStatus);
        setError(res.data.whatsappLastError);
        setConfig(res.data);

        if (user?.vendor && user.vendor.whatsappStatus !== res.data.whatsappStatus) {
          updateUser({
            vendor: { ...user.vendor, whatsappStatus: res.data.whatsappStatus },
          });
        }
      } catch (err: any) {
        // Fallback to GET if POST fails (e.g. not configured yet)
        try {
          const res = await api.get("/vendor/whatsapp");
          setStatus(res.data.whatsappStatus);
          setError(res.data.whatsappLastError);
          setConfig(res.data);
        } catch {
          setStatus("not_configured");
        }
      } finally {
        setPageLoading(false);
      }
    }

    loadStatus();
  }, [user, updateUser]);

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
      if (user?.vendor) {
        updateUser({ vendor: { ...user.vendor, whatsappStatus: "connected" } });
      }

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

  const [reverifying, setReverifying] = useState(false);

  async function handleReverify() {
    setReverifying(true);
    try {
      // 1. Try a quick reverify (retries registration without code)
      const res = await api.post("/vendor/whatsapp/reverify");
      setConfig(res.data);

      if (res.data.whatsappVerificationStatus === "VERIFIED") {
        toast.success("WhatsApp connection verified successfully!");
        setShowCodeInput(false);
        setStatus("connected");
      } else {
        // 2. If still not verified, request a code
        await api.post("/vendor/whatsapp/register");
        setShowCodeInput(true);
        toast.info("A verification code has been sent to your WhatsApp number.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Verification failed";
      toast.error(msg);
    } finally {
      setReverifying(false);
    }
  }

  const [verifying, setVerifying] = useState(false);

  async function handleVerifyCode() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post("/vendor/whatsapp/verify", { code: verificationCode });
      setConfig(res.data);
      setShowCodeInput(false);
      setVerificationCode("");
      toast.success("Phone number verified and registered successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Verification failed. Please check the code.");
    } finally {
      setVerifying(false);
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
            if (user?.vendor) {
              updateUser({
                vendor: { ...user.vendor, whatsappStatus: "connected" },
              });
            }
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

      {/* ================= CONNECTED/ERROR VIEW ================= */}
      {((status === "connected" || status === "error") &&
        !isEditing &&
        config.whatsappPhoneNumberId) && (
          <div className="space-y-6">
            {/* Main Alerts */}
            {(() => {
              if (status === "error") {
                return (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <AlertCircle className="w-16 h-16" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1">
                        <p className="font-bold text-lg">Connection Issue Detected</p>
                        <p className="text-sm opacity-90">
                          Meta reported an issue with your connection: <span className="font-mono bg-destructive/10 px-1 rounded">{error || "Unknown error"}</span>
                        </p>
                      </div>
                      <button
                        onClick={handleReverify}
                        disabled={reverifying}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {reverifying ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>🔄</span>
                        )}
                        {reverifying ? "Retrying..." : "Retry Registration"}
                      </button>
                    </div>
                  </div>
                );
              }

              if (
                config.whatsappVerificationStatus &&
                config.whatsappVerificationStatus !== "VERIFIED"
              ) {
                return (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Smartphone className="w-16 h-16" />
                    </div>
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-bold text-lg">
                            Verification Incomplete
                          </p>
                          <p className="text-sm opacity-90">
                            Your number is connected but not yet verified with Meta. You must verify it to start messaging.
                          </p>
                        </div>
                        {!showCodeInput && (
                          <button
                            onClick={handleReverify}
                            disabled={reverifying}
                            className="bg-amber-600 text-white hover:bg-amber-700 px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                          >
                            {reverifying ? (
                              <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>🔑</span>
                            )}
                            {reverifying ? "Sending Code..." : "Send Verification Code"}
                          </button>
                        )}
                      </div>

                      {showCodeInput && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-background/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-60">
                              Enter 6-Digit SMS/Voice Code
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) =>
                                  setVerificationCode(
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                                placeholder="123 456"
                                className="flex-1 bg-background border-2 border-border rounded-xl px-4 py-3 text-lg font-mono tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
                              />
                              <button
                                onClick={handleVerifyCode}
                                disabled={verifying}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                              >
                                {verifying ? (
                                  <RefreshCcw className="w-4 h-4 animate-spin" />
                                ) : null}
                                {verifying ? "Verifying..." : "Confirm Code"}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-medium opacity-60">
                            <p>
                              Didn't receive the code? Wait 2 minutes before retrying.
                            </p>
                            <button
                              onClick={() => setShowCodeInput(false)}
                              className="underline hover:text-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
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
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Choose Setup Method</h2>
            <p className="text-sm text-muted-foreground">Select how you want to connect your WhatsApp Business account</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Embedded Card */}
            <motion.button
              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSetupMethod("embedded")}
              className={`relative overflow-hidden flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${setupMethod === "embedded"
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                  : "border-border bg-card hover:border-primary/50"
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${setupMethod === "embedded" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                {setupMethod === "embedded" && (
                  <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">Selected</div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">Embedded Signup</h3>
              <p className="text-sm text-muted-foreground mb-4">The easiest and fastest way. Connect directly through Meta's secure popup.</p>
              <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-primary">
                <span>Recommended</span>
                <span className="w-1 h-1 rounded-full bg-primary/30"></span>
                <span>Fastest Setup</span>
              </div>
            </motion.button>

            {/* Manual Card */}
            <motion.button
              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSetupMethod("manual")}
              className={`relative overflow-hidden flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${setupMethod === "manual"
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                  : "border-border bg-card hover:border-primary/50"
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${setupMethod === "manual" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  <RefreshCcw className="w-6 h-6" />
                </div>
                {setupMethod === "manual" && (
                  <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">Selected</div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">Manual Setup</h3>
              <p className="text-sm text-muted-foreground mb-4">For advanced users. Manually enter Business IDs and Access Tokens.</p>
              <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Advanced</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span>Granular Control</span>
              </div>
            </motion.button>
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
