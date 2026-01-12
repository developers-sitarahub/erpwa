"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { CheckCircle, Lock, Mail } from "lucide-react"
import api from "@/lib/api"
import { toast } from "react-toastify"


export default function ForgotPasswordPage() {
  const router = useRouter()
  // 🔍 Check for Token in URL
  const searchParams = useSearchParams()
  const [resetToken, setResetToken] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      setResetToken(token)
      setStep(3) // Jump to password set step
    }
  }, [searchParams])

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  // const [otp, setOtp] = useState("") // Removed OTP
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      await api.post("/auth/forgot-password", { email })
      setStep(2) // Success screen
    } catch {
      toast.error("Failed to send reset link")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (newPassword.length < 8) {
      setErrors({ newPassword: "Password must be at least 8 characters" })
      return
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      return
    }

    setLoading(true)

    try {
      await api.post(
        "/auth/reset-forgot-password",
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${resetToken}`,
          },
        }
      )
      toast.success("Password reset successful")
      setStep(4)
    } catch {
      toast.error("Password reset failed")
    } finally {
      setLoading(false)
    }
  }

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
              <h2 className="text-2xl font-bold text-foreground mb-2">Password Changed</h2>
              <p className="text-muted-foreground mb-8">Your password has been successfully updated</p>
              <Button onClick={() => router.push("/login")} size="lg" className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
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
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  initial={false}
                  animate={{ flex: s <= step ? 1 : 0.5 }}
                  className={`h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {step === 1 && "Verify your identity"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Set your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </motion.form>
            )}

            {step === 2 && (
              <div className="text-center space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">Check your inbox</h3>
                <p className="text-muted-foreground">
                  We have sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to reset your password.
                </p>

                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="mt-4"
                >
                  Back to Email
                </Button>
              </div>
            )}

            {step === 3 && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
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
                    />
                  </div>
                  {errors.newPassword && <p className="text-destructive text-sm">{errors.newPassword}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full">
                  Submit Password
                </Button>
              </motion.form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
