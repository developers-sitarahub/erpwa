"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Loader2, RefreshCw, Zap, CheckCircle, Edit, X } from "lucide-react";
import { toast } from "react-toastify";

type SubscriptionPlan = {
    id: string;
    name: string;
    price: number;
    currency: string;
    conversationLimit: number;
    galleryLimit: number;
    chatbotLimit: number;
    templateLimit: number;
    formLimit: number;
    teamUsersLimit: number;
    updatedAt: string;
};

export default function SubscriptionPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPlans = useCallback(() => {
        setLoading(true);
        api
            .get("/super-admin/subscription-plans")
            .then((r) => {
                const allPlans = r.data as SubscriptionPlan[];
                const order = ["Free", "Basic", "Custom", "Unlimited"];
                const sorted = [...allPlans].sort((a, b) => {
                    const idxA = order.indexOf(a.name);
                    const idxB = order.indexOf(b.name);
                    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                });
                setPlans(sorted);
            })
            .catch(() => toast.error("Failed to load subscription plans"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        setSaving(true);
        try {
            await api.put(`/super-admin/subscription-plans/${editingPlan.id}`, {
                price: Number(editingPlan.price),
                conversationLimit: Number(editingPlan.conversationLimit),
                galleryLimit: Number(editingPlan.galleryLimit),
                chatbotLimit: Number(editingPlan.chatbotLimit),
                templateLimit: Number(editingPlan.templateLimit),
                formLimit: Number(editingPlan.formLimit),
                teamUsersLimit: Number(editingPlan.teamUsersLimit),
            });
            toast.success(`${editingPlan.name} plan updated successfully`);
            setEditingPlan(null);
            fetchPlans();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update plan");
        } finally {
            setSaving(false);
        }
    };

    const handlePlanChange = (field: keyof SubscriptionPlan, value: string | number) => {
        if (editingPlan) {
            setEditingPlan({ ...editingPlan, [field]: value });
        }
    };

    const renderLimit = (val: number, label: string) => {
        return val === -1 ? (
            <span className="font-semibold text-primary">Unlimited</span>
        ) : (
            <span className="font-semibold text-foreground">{val} {label}</span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Subscription Plans
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage the usage limits and pricing for all vendor tiers
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchPlans}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm text-muted-foreground transition"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : plans.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border gap-3">
                    <p className="text-sm text-muted-foreground">
                        No subscription plans found. Please initialize the plans via the database.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-blue-500/50">
                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">{plan.name}</h3>
                                        <div className="mt-2 flex items-baseline text-3xl font-bold text-foreground">
                                            {plan.name === "Unlimited" || plan.name === "Custom" 
                                                ? "Custom" 
                                                : `${plan.currency === 'INR' ? '₹' : '$'}${plan.price}`}
                                            {!(plan.name === "Unlimited" || plan.name === "Custom") && (
                                                <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Conversations: {renderLimit(plan.conversationLimit, "")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Media Storage: {renderLimit(plan.galleryLimit, "Items")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Chatbots: {renderLimit(plan.chatbotLimit, "")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Message Templates: {renderLimit(plan.templateLimit, "")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Data Forms: {renderLimit(plan.formLimit, "")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-muted-foreground flex-1">Team Users: {renderLimit(plan.teamUsersLimit, "")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-muted/50 border-t border-border">
                                <button
                                    onClick={() => setEditingPlan({ ...plan })}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Plan Limits
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingPlan && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h2 className="text-lg font-semibold text-foreground">Edit {editingPlan.name} Plan</h2>
                            <button
                                onClick={() => setEditingPlan(null)}
                                className="text-muted-foreground hover:text-foreground transition rounded-full p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm px-4 py-3 rounded-lg flex items-start gap-2 mb-4">
                                <Zap className="h-5 w-5 shrink-0" />
                                <p>Note: Set any resource limit to <strong>-1</strong> to allow <strong>unlimited</strong> usage for this tier.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Price (₹/mo)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editingPlan.price}
                                        onChange={(e) => handlePlanChange("price", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Conversations Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.conversationLimit}
                                        onChange={(e) => handlePlanChange("conversationLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Media Storage (MB)</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.galleryLimit}
                                        onChange={(e) => handlePlanChange("galleryLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Chatbot Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.chatbotLimit}
                                        onChange={(e) => handlePlanChange("chatbotLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Template Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.templateLimit}
                                        onChange={(e) => handlePlanChange("templateLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Forms Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.formLimit}
                                        onChange={(e) => handlePlanChange("formLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-medium text-foreground">Team Users Limit</label>
                                    <input
                                        type="number"
                                        required
                                        min="-1"
                                        value={editingPlan.teamUsersLimit}
                                        onChange={(e) => handlePlanChange("teamUsersLimit", e.target.value)}
                                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[50%]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingPlan(null)}
                                    className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted font-medium transition"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
