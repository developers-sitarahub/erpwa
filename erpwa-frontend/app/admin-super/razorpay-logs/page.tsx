"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Activity,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Code,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

type Log = {
  id: string;
  event: string;
  status: string;
  type: string;
  createdAt: string;
  payload: any;
  vendor: {
    id: string;
    name: string;
  } | null;
};

export default function SuperAdminWebhookLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    api
      .get("/super-admin/razorpay-logs")
      .then((r) => setLogs(r.data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load webhook logs");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const searchLower = search.toLowerCase();
    return (
      (log.event ?? "").toLowerCase().includes(searchLower) ||
      (log.vendor?.name ?? "").toLowerCase().includes(searchLower)
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "captured":
        return "bg-green-500/10 text-green-500";
      case "error":
      case "failed":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Razorpay Webhook Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review raw events received from Razorpay (Payments, Subscriptions, Refunds)
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm text-muted-foreground transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by vendor or event name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Activity className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No logs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try adjusting your search filters" : "No webhook events received yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto text-foreground">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Event
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Vendor
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">
                    Payload
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(log.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold">{log.event || "Unknown"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                            getStatusStyle(log.status)
                          )}
                        >
                          {log.status === "success" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {log.vendor ? (
                          <span className="font-medium truncate max-w-[150px]">
                            {log.vendor.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unmatched</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Code className="h-3.5 w-3.5" />
                          {expandedLog === log.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={5} className="p-0">
                          <div className="p-4 bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                            <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
