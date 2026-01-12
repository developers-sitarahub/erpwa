"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { CheckCircle, Lock, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { toast } from "react-toastify"

export default function CreatePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)

  const [step, setStep] = useState(1) // 1: Set Password, 2: Success
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    const t = searchParams.get("token")
    if (t) {
      setToken(t)
    } else {
      setTokenError(true)
    }
  }, [searchParams])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setLoading(true)

    try {
      await api.post(
        "/auth/reset-forgot-password",
        { newPassword: password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setStep(2)
      toast.success("Password set successfully!")
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to set password"
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">This invite link is invalid or missing.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 2) {
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Password Set!</h2>
              <p className="text-muted-foreground mb-8">Your account is ready. You can now login.</p>
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
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              Create a secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
              </div>

              {errors.form && <p className="text-destructive text-sm text-center">{errors.form}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting Password..." : "Set Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
