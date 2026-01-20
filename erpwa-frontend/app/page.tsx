"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Prevent double redirects in React strict mode
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (loading || redirectedRef.current) return;

    redirectedRef.current = true;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "vendor_owner" || user.role === "vendor_admin") {
      router.replace("/admin/dashboard");
      return;
    }

    router.replace("/dashboard");
  }, [user, loading, router]);

  return null;
}
