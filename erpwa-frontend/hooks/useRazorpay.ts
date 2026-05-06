"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "react-toastify";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
};

type UseRazorpayReturn = {
  initiatePayment: (plan: Plan, userData?: { name?: string; email?: string }) => Promise<void>;
  loading: boolean;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay(onSuccess?: () => void): UseRazorpayReturn {
  const [loading, setLoading] = useState(false);

  const initiatePayment = useCallback(
    async (plan: Plan, userData?: { name?: string; email?: string }) => {
      setLoading(true);
      try {
        // 1. Load Razorpay script
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway. Please check your internet connection.");
          return;
        }

        // 2. Create order on backend
        const { data } = await api.post("/subscription/create-order", { planId: plan.id });

        // 3. Open Razorpay modal
        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          name: "GPSerp",
          description: `${plan.name} Plan — ${plan.durationDays} days`,
          handler: async (response) => {
            try {
              // 4. Verify payment on backend
              await api.post("/subscription/verify-payment", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId: plan.id,
              });
              toast.success(`🎉 ${plan.name} plan activated! Welcome to GPSerp.`, { autoClose: 5000 });
              onSuccess?.();
            } catch {
              toast.error("Payment verified but activation failed. Please contact support.");
            }
          },
          prefill: {
            name: userData?.name || "",
            email: userData?.email || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => toast.info("Payment cancelled."),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Payment initiation failed";
        console.error("Razorpay error:", err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  return { initiatePayment, loading };
}
