"use client";

import { Clock, AlertCircle } from "lucide-react";

export default function SessionBanner({
  isSessionActive,
  remainingTime,
}: {
  isSessionActive: boolean;
  remainingTime: string | null;
}) {
  return (
    <div className="flex-shrink-0 z-30">
      {isSessionActive && remainingTime ? (
        <div className="bg-orange-50 dark:bg-yellow-900/20 border-b border-orange-200 dark:border-yellow-800 px-4 py-2.5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600 dark:text-yellow-500 shrink-0" />
          <span className="text-xs text-orange-700 dark:text-yellow-400 font-medium">
            24-hour message window expires in {remainingTime}
          </span>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
          <span className="text-xs text-red-700 dark:text-red-400">
            24-hour window closed. Send a template message to restart the
            conversation.
          </span>
        </div>
      )}
    </div>
  );
}
