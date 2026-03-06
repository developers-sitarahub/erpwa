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
import { Lock, Mail, ArrowLeft, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { useAuth } from "@/context/authContext";
import Link from "next/link";

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP, 3: Set Password, 4: Success

    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Countdown timer in seconds
    const [timeLeft, setTimeLeft] = useState<number>(300);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (step === 3 && timeLeft > 0) {
            timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (step === 3 && timeLeft === 0) {
            // Timeout occurred
            toast.error("Time expired. Please request a new code.");
            setStep(1); // Go back to start
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setResetToken(null);
        }
        return () => clearInterval(timerId);
    }, [step, timeLeft]);

    // Format timeLeft into mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleRequestOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setErrors({});

        if (!user?.email) {
            toast.error("User email not found");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/change-password/request-otp", {
                email: user.email,
            });

            setStep(2);
            toast.success("Verification code sent to your email!");
        } catch (error: any) {
            const msg =
                error.response?.data?.message || "Failed to send verification code";
            toast.error(msg);
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!otp || otp.length !== 6) {
            setErrors({ otp: "Please enter a valid 6-digit code" });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/change-password/verify-otp", {
                email: user?.email,
                otp: otp,
            });

            setResetToken(response.data.resetToken);
            setTimeLeft(response.data.expires_in || 300); // Usually 300 seconds
            setStep(3);
            toast.success("Code verified! Now set your new password");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Invalid or expired code";
            toast.error(msg);
            setErrors({ otp: msg });
        } finally {
            setLoading(false);
        }
    };

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
                "/auth/change-password/reset",
                { newPassword: newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${resetToken}`,
                    },
                }
            );

            // Logout user - clear all tokens and cache
            try {
                await api.post("/auth/logout");
            } catch (logoutErr) {
                console.error("Logout error:", logoutErr);
            }

            // Clear access token from memory
            const { setAccessToken } = await import("@/lib/api");
            setAccessToken(null);

            setStep(4);
            toast.success("Password changed successfully! Please login again.");
        } catch (error: any) {
            const msg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to change password";
            toast.error(msg);
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

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
                                onClick={() => router.push("/login")}
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
                                <Link href="/settings">
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
                                            value={user?.email || ""}
                                            className="pl-10"
                                            disabled
                                            readOnly
                                        />
                                    </div>
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
                                Enter the 6-digit code sent to {user?.email}
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
                        <div className="flex items-center justify-between">
                            <CardTitle>Set New Password</CardTitle>
                            <div className="flex items-center text-sm font-medium text-destructive gap-1 bg-destructive/10 px-2 py-1 rounded">
                                <Clock className="w-4 h-4" />
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                        <CardDescription>
                            Create a secure password for your account. You have 5 minutes to complete this.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
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
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
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
