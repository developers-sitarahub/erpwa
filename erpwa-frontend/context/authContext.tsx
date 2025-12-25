"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { setAccessToken } from "@/lib/api";

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
  const mountedRef = useRef(false);

  /* ===== Restore session on load ===== */

  useEffect(() => {
    mountedRef.current = true;

    const restoreSession = async () => {
      try {
        const res = await api.get("/auth/me");
        if (mountedRef.current) {
          setUser(res.data.user);
        }
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

  /* ===== GLOBAL LOGOUT LISTENER (OPTION 1) ===== */

  useEffect(() => {
    const handleLogout = () => {
      setAccessToken(null);
      setUser(null);
      router.replace("/login");
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [router]);

  /* ================= LOGIN ================= */

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });

    const loggedInUser: User = res.data.user;

    setAccessToken(res.data.accessToken);
    setUser(loggedInUser);

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
