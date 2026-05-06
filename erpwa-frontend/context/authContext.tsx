"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api, { setAccessToken } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { toast } from "react-toastify";

/* ================= TYPES ================= */

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  conversationLimit: number;
  galleryLimit: number;
  chatbotLimit: number;
  templateLimit: number;
  formLimit: number;
  teamUsersLimit: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "vendor_owner" | "vendor_admin" | "sales" | "owner";
  vendorId: string | null;
  onboardingStatus?: string;
  vendor?: {
    id?: string;
    name?: string;
    subscriptionStart: string | null;
    subscriptionEnd: string | null;
    subscriptionPlanId?: string | null;
    whatsappStatus?: string;
    subscriptionPlan?: SubscriptionPlan | null;
  } | null;
};


type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const mountedRef = useRef(false);

  /* ================= RESTORE SESSION ================= */

  useEffect(() => {
    mountedRef.current = true;

    const restoreSession = async () => {
      try {
        const res = await api.get("/auth/me");

        if (!mountedRef.current) return;

        setUser(res.data.user);

        // 🔐 CONNECT SOCKET AFTER SESSION RESTORE
        connectSocket();
      } catch {
        setAccessToken(null);
        if (mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ================= GLOBAL LOGOUT LISTENER ================= */

  useEffect(() => {
    const handleLogout = () => {
      disconnectSocket(); // 🔥 IMPORTANT
      setAccessToken(null);
      setUser(null);

      const publicPaths = [
        "/login",
        "/admin-login",
        "/register",
        "/forgot-password",
        "/create-password",
        "/privacy-policy",
        "/terms-n-condition",
        "/",
      ];

      // ✅ Do not redirect super-admins to normal login
      if (pathname.startsWith("/admin-super")) {
        return;
      }

      if (!publicPaths.includes(pathname)) {
        router.replace("/login");
      }
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [router, pathname]);

  /* ================= REAL-TIME PLAN UPDATES ================= */
  useEffect(() => {
    if (!user || pathname.startsWith("/admin-super")) return;

    const socket = getSocket();
    const handlePlanUpdated = (data: any) => {
      const { plan, subscriptionEnd } = data;
      toast.info(`Your subscription has been updated to ${plan.name} by Super Admin!`);
      
      // Update local user's vendor data if needed
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vendor: {
            ...prev.vendor,
            subscriptionEnd,
            subscriptionStart: prev.vendor?.subscriptionStart || new Date().toISOString()
          }
        };
      });

      // Dispatch event to instruct pages to reload limits
      window.dispatchEvent(new Event("vendor:plan_updated"));
    };

    socket.on("vendor:plan_updated", handlePlanUpdated);
    return () => {
      socket.off("vendor:plan_updated", handlePlanUpdated);
    };
  }, [user, pathname]);

  /* ================= LOGIN ================= */

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });

    const loggedInUser: User = res.data.user;

    setAccessToken(res.data.accessToken);
    setUser(loggedInUser);

    // 🔐 CONNECT SOCKET AFTER LOGIN
    connectSocket();

    // ✅ REDIRECT LOGIC
    if (
      loggedInUser.onboardingStatus &&
      loggedInUser.onboardingStatus !== "activated" &&
      loggedInUser.role === "vendor_owner"
    ) {
      router.replace("/register");
      return;
    }

    if (
      loggedInUser.role === "vendor_owner" ||
      loggedInUser.role === "vendor_admin"
    ) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  /* ================= LOGOUT ================= */

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      disconnectSocket(); // 🔥 IMPORTANT
      setAccessToken(null);
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  /* ================= UPDATE USER ================= */
  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const value = { user, loading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
