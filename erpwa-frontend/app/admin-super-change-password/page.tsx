"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/card";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Lock, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function SuperAdminChangePassword() {
  const router = useRouter();

  // step: 1 = request otp, 2 = enter otp, 3 = set password, 4 = success
  const [step, setStep] = useState(1);

  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("");

  /* Fetch the logged-in super admin's email on mount */
  useEffect(() => {
    api
      .get<{ admin: { email: string } }>("/super-admin/me")
      .then((res) => setAdminEmail(res.data.admin.email))
      .catch(() => setAdminEmail(""));
  }, []);

  /* ================================================================
   * Step 1 — Send OTP to super admin's registered email
   * ================================================================ */
  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post("/super-admin/change-password/request-otp");
      setOtpToken(res.data.otpToken);
      setStep(2);
      toast.success("Verification code sent to your email!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to send verification code";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
   * Step 2 — Verify OTP
   * ================================================================ */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit code" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/super-admin/change-password/verify-otp", {
        otpToken,
        otp,
      });
      setResetToken(res.data.resetToken);
      setStep(3);
      toast.success("Code verified! Now set your new password.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Invalid or expired code";
      toast.error(msg);
      setErrors({ otp: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
   * Step 3 — Set new password
   * ================================================================ */
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!newPassword || newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/super-admin/change-password/reset",
        { newPassword },
        { headers: { Authorization: `Bearer ${resetToken}` } },
      );
      setStep(4);
      toast.success("Password changed successfully! Please login again.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to change password";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
   * Step 4 — Success screen
   * ================================================================ */
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <div className="bg-green-500/20 p-4 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Password Changed!
              </h2>
              <p className="text-muted-foreground mb-8">
                Your password has been updated successfully. Please login again
                with your new password.
              </p>
              <Button
                onClick={() => router.push("/admin-login")}
                size="lg"
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ================================================================
   * Step 1 — Request OTP screen
   * ================================================================ */
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/admin-super/settings">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </Link>
              </div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Request a verification code to change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Loading email..."
                      className="pl-10"
                      disabled
                      readOnly
                      value={adminEmail}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A 6-digit code will be sent to your registered Super Admin
                    email.
                  </p>
                </div>

                {errors.form && (
                  <p className="text-destructive text-sm">{errors.form}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ================================================================
   * Step 2 — Enter OTP screen
   * ================================================================ */
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to your registered email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="pl-10 text-center text-lg tracking-widest"
                      disabled={loading}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-destructive text-sm">{errors.otp}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleRequestOtp}
                  disabled={loading}
                >
                  Resend Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ================================================================
   * Step 3 — Set new password screen
   * ================================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Create a secure password for your Super Admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-destructive text-sm">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.form && (
                <p className="text-destructive text-sm text-center">
                  {errors.form}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
