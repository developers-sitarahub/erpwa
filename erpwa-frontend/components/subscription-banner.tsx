"use client";

import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function SubscriptionBanner({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const calculateTimeLeft = () => {
      if (!user?.vendor?.subscriptionEnd) {
        if (active) setTimeLeft(null);
        return;
      }

      const end = new Date(user.vendor.subscriptionEnd).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        if (active) setTimeLeft("Subscription Expired");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      const pad = (num: number) => num.toString().padStart(2, "0");
      if (active)
        setTimeLeft(`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m left`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // update every minute

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.vendor?.subscriptionEnd]);

  if (!timeLeft) return null;

  const isExpired = timeLeft === "Subscription Expired";

  return (
    <div
      className={`inline-flex py-2.5 px-6 rounded-full items-center justify-center text-base font-semibold shadow-sm ${isExpired ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"} ${className}`}
    >
      <Clock className="w-5 h-5 mr-2.5 shrink-0" />
      <span>
        {isExpired
          ? "Your subscription has expired. Please upgrade your plan."
          : `Trial expires in: ${timeLeft}`}
      </span>
    </div>
  );
}
