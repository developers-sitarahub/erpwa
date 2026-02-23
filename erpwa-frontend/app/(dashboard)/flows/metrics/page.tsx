"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    BarChart3,
    TrendingUp,
    Users,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    ChevronDown,
    Layers,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";

interface Flow {
    id: string;
    name: string;
    status: string;
}

interface Metrics {
    totalResponses: number;
    completedResponses: number;
    abandonedResponses: number;
    completionRate: number;
}

function MetricsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const flowIdParam = searchParams.get("flowId");

    const [flows, setFlows] = useState<Flow[]>([]);
    const [selectedFlowId, setSelectedFlowId] = useState<string>(flowIdParam || "all");
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingFlows, setLoadingFlows] = useState(true);

    const fetchFlows = useCallback(async () => {
        try {
            setLoadingFlows(true);
            const response = await api.get("/whatsapp/flows");
            const flowsData = response.data.flows || [];
            setFlows(flowsData);

            if (flowIdParam && flowsData.find((f: Flow) => f.id === flowIdParam)) {
                setSelectedFlowId(flowIdParam);
            }
        } catch (error) {
            console.error("Error fetching flows:", error);
            toast.error("Failed to load flows list");
        } finally {
            setLoadingFlows(false);
        }
    }, [flowIdParam]);

    const fetchMetrics = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/whatsapp/flows/${id}/metrics`);
            setMetrics(response.data.metrics);
        } catch (error) {
            console.error("Error fetching metrics:", error);
            toast.error("Failed to load metrics");
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlows();
    }, [fetchFlows]);

    useEffect(() => {
        if (selectedFlowId) {
            fetchMetrics(selectedFlowId);
            // Update URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.set("flowId", selectedFlowId);
            window.history.pushState({}, "", url.toString());
        }
    }, [selectedFlowId, fetchMetrics]);

    const selectedFlow = flows.find(f => f.id === selectedFlowId);

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/flows")}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                Flow Metrics
                            </h1>
                            <p className="text-muted-foreground">
                                Analytics and performance overview
                            </p>
                        </div>
                    </div>

                    {/* Flow Selector */}
                    <div className="w-full md:w-72">
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedFlowId}
                                onChange={(e) => setSelectedFlowId(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-card border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={loadingFlows}
                            >
                                <option value="all">All Flows</option>
                                {flows.map((flow) => (
                                    <option key={flow.id} value={flow.id}>
                                        {flow.name} ({flow.status})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-card border border-border rounded-xl shadow-sm min-h-100 p-6">
                    {!selectedFlowId ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No Flow Selected</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Please select a flow from the dropdown above to view its performance metrics.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-muted-foreground mt-4">Loading metrics...</p>
                        </div>
                    ) : metrics ? (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">{selectedFlowId === 'all' ? 'All Flows' : selectedFlow?.name}</h2>
                                <p className="text-sm text-muted-foreground">Performance Overview</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Responses */}
                                <div className="bg-background border border-border p-5 rounded-xl shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Total Responses</span>
                                        <Users className="w-5 h-5 text-blue-500/80" />
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {metrics.totalResponses}
                                    </div>
                                </div>

                                {/* Completed */}
                                <div className="bg-background border border-border p-5 rounded-xl shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Completed</span>
                                        <CheckCircle2 className="w-5 h-5 text-green-500/80" />
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {metrics.completedResponses}
                                    </div>
                                </div>

                                {/* Abandoned */}
                                <div className="bg-background border border-border p-5 rounded-xl shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Abandoned</span>
                                        <XCircle className="w-5 h-5 text-red-500/80" />
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {metrics.abandonedResponses}
                                    </div>
                                </div>

                                {/* Completion Rate */}
                                <div className="bg-background border border-border p-5 rounded-xl shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                                        <TrendingUp className="w-5 h-5 text-purple-500/80" />
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {metrics.completionRate?.toFixed(1) || 0}%
                                    </div>
                                </div>
                            </div>

                            {/* Additional visualizations or breakdowns could go here */}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No metrics data available for this flow.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FlowMetricsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <MetricsContent />
        </Suspense>
    );
}
