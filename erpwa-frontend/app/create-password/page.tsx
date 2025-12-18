"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { CheckCircle, Lock, Mail } from "lucide-react"

export default function CreatePasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(mockOtp)
    setStep(2)
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!otp) {
      setErrors({ otp: "OTP is required" })
      return
    }

    if (otp !== generatedOtp) {
      setErrors({ otp: "Invalid OTP" })
      return
    }

    setStep(3)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!password || password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" })
      return
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      return
    }

    setStep(4)
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Password Created</h2>
              <p className="text-muted-foreground mb-8">Your password has been successfully created</p>
              <Button onClick={() => router.push("/")} size="lg" className="w-full">
                Back to Login
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
            <CardTitle>Create Password</CardTitle>
            <CardDescription>
              {step === 1 && "Enter your email address"}
              {step === 2 && "Verify with OTP"}
              {step === 3 && "Create your password"}
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
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleOtpSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <p className="text-xs text-muted-foreground">6-digit code sent to {email}</p>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                  {errors.otp && <p className="text-destructive text-sm">{errors.otp}</p>}
                </div>
                <Button type="submit" className="w-full">
                  Verify OTP
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Use Different Email
                </button>
              </motion.form>
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
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
                  Create Password
                </Button>
              </motion.form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
