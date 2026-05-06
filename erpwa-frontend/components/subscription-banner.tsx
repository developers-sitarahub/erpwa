"use client";

import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { Clock, AlertTriangle, Crown, Zap } from "lucide-react";
import Link from "next/link";

export function SubscriptionBanner({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [display, setDisplay] = useState<{
    text: string;
    isExpired: boolean;
    planName: string | null;
    daysLeft: number;
  } | null>(null);

  useEffect(() => {
    let active = true;

    const calculate = () => {
      const rawPlanName = user?.vendor?.subscriptionPlan?.name || null;
      const planName = rawPlanName === "Unlimited" ? "Custom" : rawPlanName;
      const endStr = user?.vendor?.subscriptionEnd;

      if (!endStr) {
        if (active) {
          if (planName) {
             setDisplay({ text: "No expiry", isExpired: false, planName, daysLeft: 9999 });
          } else {
             setDisplay(null);
          }
        }
        return;
      }

      const end = new Date(endStr).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        if (active)
          setDisplay({ text: "Subscription Expired", isExpired: true, planName, daysLeft: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const text = days > 3650 ? "Lifetime" : `${pad(days)}d ${pad(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))}h left`;

      function pad(n: number) { return n.toString().padStart(2, "0"); }

      if (active)
        setDisplay({
          text,
          isExpired: false,
          planName,
          daysLeft: days,
        });
    };

    calculate();
    const timer = setInterval(calculate, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.vendor?.subscriptionEnd, user?.vendor?.subscriptionPlan?.name]);

  if (!display) return null;

  const { isExpired, planName, daysLeft, text } = display;
  const isWarn = !isExpired && daysLeft <= 5;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition ${
        isExpired
          ? "bg-destructive text-destructive-foreground"
          : isWarn
          ? "bg-amber-500 text-white"
          : "bg-muted text-muted-foreground border border-border"
      } ${className}`}
    >
      {isExpired ? (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      ) : (
        <Clock className="w-4 h-4 shrink-0" />
      )}

      {planName && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
          <Crown className="w-3 h-3" />
          {planName}
        </div>
      )}

      {planName && <div className="w-px h-3 bg-border" />}

      <span>
        {isExpired ? "Expired — " : isWarn ? `⚠️ Expires in ${text}` : text}
      </span>

      {(isExpired || isWarn) && (
        <Link
          href="/admin/pricing"
          className="ml-1 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 transition px-2 py-0.5 rounded-full text-xs font-bold"
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </Link>
      )}
    </div>
  );
}
