"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { toast } from "react-toastify";

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/super-admin/login", { email, password });
      toast.success("Welcome back, Super Admin!");
      router.push("/admin-super/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl bg-card text-foreground shadow-xl p-8 border border-border">
        {/* Icon + heading */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Super Admin Access</h1>
          <p className="text-sm text-muted-foreground">
            Secure login for platform administrators
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="super@admin.com"
                required
                disabled={loading}
                className="w-full rounded-md border border-border bg-input px-10 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="sa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full rounded-md border border-border bg-input px-10 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="sa-login-btn"
            className="w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 font-medium transition disabled:opacity-60"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
