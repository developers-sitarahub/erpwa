"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api, { setAccessToken } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

/* ================= TYPES ================= */

export type User = {
  id: string;
  name: string;
  email: string;
  role: "vendor_owner" | "vendor_admin" | "sales";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
        // 1️⃣ Try to refresh the token first
        // We do this explicitly to ensure we have a valid access token
        // before making any other requests.
        const refreshRes = await api.post("/auth/refresh");
        const { accessToken } = refreshRes.data; // Backend refresh returns { accessToken } usually, let's check controller

        setAccessToken(accessToken);

        // 2️⃣ Fetch latest user details (optional if refresh returns user, but good for safety)
        // If refresh returns user, we can skpu this.
        // Controller says: res.json(data); Auth.refresh returns { accessToken }.
        // So we MUST call /auth/me or modify backend to return user.
        // Let's call /auth/me.

        const res = await api.get("/auth/me");

        if (!mountedRef.current) return;

        setUser(res.data.user);

        // 🔐 CONNECT SOCKET AFTER SESSION RESTORE
        connectSocket();
      } catch (err) {
        console.error("Session restore failed:", err);
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

      const publicPaths = ["/login", "/forgot-password", "/create-password"];
      if (!publicPaths.includes(pathname)) {
        router.replace("/login");
      }
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [router, pathname]);

  /* ================= LOGIN ================= */

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });

    const loggedInUser: User = res.data.user;

    setAccessToken(res.data.accessToken);
    setUser(loggedInUser);

    // 🔐 CONNECT SOCKET AFTER LOGIN
    connectSocket();

    // ✅ ROLE-BASED REDIRECT
    if (
      loggedInUser.role === "vendor_owner" ||
      loggedInUser.role === "vendor_admin"
    ) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }

  /* ================= LOGOUT ================= */

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      disconnectSocket(); // 🔥 IMPORTANT
      setAccessToken(null);
      setUser(null);
      router.replace("/login");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
