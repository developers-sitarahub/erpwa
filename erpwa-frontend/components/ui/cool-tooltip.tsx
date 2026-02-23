import React from "react";

interface CoolTooltipProps {
    content: string | null | undefined;
    children: React.ReactNode;
    className?: string;
}

export function CoolTooltip({ content, children, className }: CoolTooltipProps) {
    if (!content) return <>{children}</>;

    return (
        <div className={`relative group ${className || ""}`}>
            {children}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-max max-w-50 px-3 py-2 text-xs font-medium text-white bg-black/90 rounded-md shadow-xl backdrop-blur-sm dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700 pointer-events-none whitespace-normal wrap-break-word transition-opacity duration-200">
                {content}
                {/* Arrow */}
                <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90 dark:border-t-slate-800"></div>
            </div>
        </div>
    );
}
