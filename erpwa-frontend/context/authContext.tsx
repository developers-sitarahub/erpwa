"use client"

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react"
import type { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import api, { setAccessToken } from "@/lib/api"
import { toast } from "react-toastify"

/* ================= TYPES ================= */

export type User = {
    id: string
    email?: string
    role: "vendor_owner" | "vendor_admin" | "sales"
}

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const router = useRouter()
    const mountedRef = useRef(false)

    /* ================= RESTORE SESSION ================= */
    useEffect(() => {
        mountedRef.current = true

        const restoreSession = async () => {
            try {
                // 1️⃣ Refresh access token
                const refreshRes = await api.post<{ accessToken: string }>(
                    "/auth/refresh"
                )

                setAccessToken(refreshRes.data.accessToken)

                // 2️⃣ Fetch user (NO CACHE)
                const meRes = await api.get<{ user: User }>("/auth/me")

                if (!meRes.data?.user) {
                    throw new Error("Invalid /auth/me response")
                }

                if (mountedRef.current) {
                    setUser(meRes.data.user)
                }
            } catch {
                setAccessToken(null)
                if (mountedRef.current) {
                    setUser(null)
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false)
                }
            }
        }

        restoreSession()

        return () => {
            mountedRef.current = false
        }
    }, [])


    /* ================= LOGIN ================= */
    async function login(email: string, password: string) {
        try {
            const res = await api.post<{
                accessToken: string
                user: User
            }>("/auth/login", { email, password })

            setAccessToken(res.data.accessToken)
            setUser(res.data.user)

            toast.success("Logged in successfully")

            // Role-based redirect
            if (
                res.data.user.role === "vendor_owner" ||
                res.data.user.role === "vendor_admin"
            ) {
                router.replace("/admin/dashboard")
            } else {
                router.replace("/dashboard")
            }
        } catch (err: unknown) {
            let message = "Invalid email or password"

            if (err && typeof err === "object") {
                const axiosError = err as AxiosError<{ message?: string }>
                message = axiosError.response?.data?.message ?? message
            }

            toast.error(message)
            throw err
        }

    }

    /* ================= LOGOUT ================= */
    async function logout() {
        try {
            await api.post("/auth/logout")
        } catch {
            // ignore backend errors
        } finally {
            setAccessToken(null)
            setUser(null)
            toast.success("Logged out")
            router.replace("/login")
        }
    }

    /* ================= CONTEXT VALUE ================= */
    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ================= HOOK ================= */

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return ctx
}
