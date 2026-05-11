"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, RefreshCcw, Smartphone, MessageSquare } from "lucide-react";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";

export function WhatsAppAlert() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/vendor/whatsapp");
      setConfig(res.data);
      if (user?.vendor && user.vendor.whatsappStatus !== res.data.whatsappStatus) {
        updateUser({
          vendor: { ...user.vendor, whatsappStatus: res.data.whatsappStatus },
        });
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "vendor_owner" || user?.role === "vendor_admin") {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleVerifyAction = async () => {
    setReverifying(true);
    try {
      // 1. Try a quick reverify (retries registration without code)
      const res = await api.post("/vendor/whatsapp/reverify");
      setConfig(res.data);
      
      if (res.data.whatsappVerificationStatus === "VERIFIED") {
        toast.success("WhatsApp connection verified successfully!");
        setShowCodeInput(false);
      } else {
        // 2. If still not verified, request a code
        await api.post("/vendor/whatsapp/register");
        setShowCodeInput(true);
        toast.info("A verification code has been sent to your WhatsApp number.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Verification failed";
      toast.error(msg);
      // If it failed but we need to setup from scratch
      if (msg.toLowerCase().includes("not configured") || msg.toLowerCase().includes("credentials")) {
         router.push("/admin/setup");
      }
    } finally {
      setReverifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post("/vendor/whatsapp/verify", { code: verificationCode });
      setConfig(res.data);
      setShowCodeInput(false);
      setVerificationCode("");
      toast.success("WhatsApp verified and registered successfully!");
      
      if (user?.vendor) {
        updateUser({ vendor: { ...user.vendor, whatsappStatus: "connected" } });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !config) return null;

  const isConnected = config.whatsappStatus === "connected";
  const isVerified = config.whatsappVerificationStatus === "VERIFIED";
  const hasError = config.whatsappStatus === "error";

  if (isConnected && isVerified) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <div className={`relative overflow-hidden rounded-2xl border p-4 md:p-6 transition-all shadow-lg ${
          hasError 
            ? "bg-linear-to-r from-red-500/10 to-orange-500/10 border-red-500/20" 
            : "bg-linear-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20"
        }`}>
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <MessageSquare className="w-32 h-32" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${hasError ? "bg-red-500/20 text-red-600" : "bg-amber-500/20 text-amber-600"}`}>
                {hasError ? <AlertCircle className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">
                  {hasError ? "WhatsApp Connection Error" : "WhatsApp Verification Required"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  {hasError 
                    ? "Your WhatsApp connection has encountered an issue. Please retry registration to restore service."
                    : "Your WhatsApp number is connected but not yet verified. You must verify it to start sending messages."}
                </p>
              </div>
            </div>

            {!showCodeInput ? (
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleVerifyAction} 
                  disabled={reverifying}
                  className={`${hasError ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"} text-white font-bold px-6 shadow-md transition-all active:scale-95`}
                >
                  {reverifying ? (
                    <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {reverifying ? "Processing..." : "Verify Connection"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/admin/setup")}
                  className="font-semibold"
                >
                  Setup Page
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-center font-mono tracking-widest focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={verifying}
                  className="bg-primary text-primary-foreground font-bold px-8 w-full sm:w-auto shadow-md"
                >
                  {verifying ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Code
                </Button>
                <button 
                  onClick={() => setShowCodeInput(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
