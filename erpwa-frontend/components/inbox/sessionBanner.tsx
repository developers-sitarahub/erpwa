"use client";

import { Clock, AlertCircle } from "lucide-react";

export default function SessionBanner({
    sessionStarted,
    isSessionActive,
    remainingTime,
}: {
    sessionStarted?: boolean;
    isSessionActive: boolean;
    remainingTime: string | null;
}) {
    if (!sessionStarted) return null;

    return (
        <div className="flex-shrink-0 z-30">
            {isSessionActive ? (
                <div className="bg-yellow-50 border-b px-4 py-2.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700">
                        24-hour message window expires in {remainingTime}
                    </span>
                </div>
            ) : (
                <div className="bg-red-50 border-b px-4 py-2.5 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-red-700">
                        24-hour window closed. Send a template message.
                    </span>
                </div>
            )}
        </div>
    );
}
