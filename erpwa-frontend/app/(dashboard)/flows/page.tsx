"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit,
    Trash2,
    Send,
    Archive,
    BarChart3,
    Search,
    Filter,
    Layers,
    CheckCircle2,
    TrendingUp,
    FileText,
    Eye,
    LayoutGrid,
    BookTemplate,
    RefreshCw,
    Upload,
    Paperclip,
    Image as ImageIcon,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import FlowEditorModal from "@/components/flows/FlowEditorModal";
import FlowTemplateModal from "@/components/flows/FlowTemplateModal";
import TemplateSendModal from "@/components/flows/TemplateSendModal";
import { toast } from "react-toastify";
import { Template } from "@/lib/types";
import { Card, CardContent } from "@/components/card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";

interface ConfirmationToastProps {
    closeToast?: () => void;
    message: string;
    description: string;
    onConfirm: () => void;
    confirmLabel?: string;
}

const ConfirmationToast = ({
    closeToast,
    message,
    description,
    onConfirm,
    confirmLabel = "Confirm",
}: ConfirmationToastProps) => (
    <div className="flex flex-col gap-2">
        <p className="font-semibold text-sm text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="flex gap-2 mt-2 justify-end">
            <button
                onClick={closeToast}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={() => {
                    onConfirm();
                    if (closeToast) closeToast();
                }}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                {confirmLabel}
            </button>
        </div>
    </div>
);

interface DeleteFlowConfirmationProps {
    closeToast?: () => void;
    onConfirm: (deleteResponses: boolean) => void;
    flowName: string;
}

const DeleteFlowConfirmation = ({ closeToast, onConfirm, flowName }: DeleteFlowConfirmationProps) => {
    const [deleteResponses, setDeleteResponses] = useState(false);

    return (
        <div className="flex flex-col gap-4 p-1">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-base text-foreground">Delete Flow?</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Are you sure you want to delete <span className="font-bold text-foreground underline decoration-red-500/30">&quot;{flowName}&quot;</span>? This action cannot be undone.
                    </p>
                </div>
            </div>

            <div className={cn(
                "border rounded-xl p-3 transition-all duration-200",
                deleteResponses 
                    ? "bg-red-500/10 border-red-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "bg-muted/30 border-border/50"
            )}>
                <div 
                    className="flex items-center gap-3 cursor-pointer select-none group" 
                    onClick={() => setDeleteResponses(!deleteResponses)}
                >
                    <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                        deleteResponses 
                            ? "bg-red-600 border-red-600 shadow-lg shadow-red-900/20" 
                            : "bg-background border-input group-hover:border-red-500/50"
                    )}>
                        {deleteResponses && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={cn(
                        "text-xs font-bold transition-colors",
                        deleteResponses ? "text-red-500" : "text-foreground/80"
                    )}>
                        Delete all collected responses
                    </span>
                </div>
                
                <p className="pl-8 mt-1.5 text-[10px] leading-relaxed text-muted-foreground/70 font-medium">
                    {deleteResponses 
                        ? "⚠️ Warning: All user data collected from this flow will be permanently erased." 
                        : "Only the flow structure will be deleted. Responses will still be accessible in the global logs."}
                </p>
            </div>

            <div className="flex gap-2 justify-end mt-1">
                <button
                    onClick={closeToast}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onConfirm(deleteResponses);
                        if (closeToast) closeToast();
                    }}
                    className="px-5 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-900/40"
                >
                    Delete Flow
                </button>
            </div>
        </div>
    );
};

interface Flow {
    id: string;
    name: string;
    category: string;
    status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
    _count?: {
        responses: number;
        templates: number;
    };
    flowJson: Record<string, unknown>;
    validationErrors?: unknown[];
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
            validationErrors?: Array<{ error: string }>;
        };
    };
}

export default function FlowsPage() {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [templateLoading, setTemplateLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null); // For individual card sync
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [templateSearchTerm, setTemplateSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [templateStatusFilter, setTemplateStatusFilter] = useState("all");
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<"flows" | "templates">("flows");

    const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showSendModal, setShowSendModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchFlows();
        fetchTemplates();
    }, []);

    const fetchFlows = async () => {
        try {
            setLoading(true);
            const response = await api.get("/whatsapp/flows");
            setFlows(response.data.flows || []);
        } catch (error) {
            console.error("Error fetching flows:", error);
            toast.error("Failed to load Flows");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            setTemplateLoading(true);
            const response = await api.get("/vendor/templates");
            // Filter templates that have Flow buttons
            const flowTemplates = (response.data || []).filter((t: Template) =>
                t.buttons?.some((b: { type: string }) => b.type === "FLOW")
            );
            setTemplates(flowTemplates);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleCreateFlow = () => {
        setSelectedFlow(null);
        setShowEditorModal(true);
    };

    const handleEditFlow = (flow: Flow) => {
        setSelectedFlow(flow);
        setShowEditorModal(true);
    };

    const handleCreateFlowTemplate = () => {
        setSelectedTemplate(null);
        setShowTemplateModal(true);
    };

    const handleEditFlowTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setShowTemplateModal(true);
    };

    const handleSubmitToMeta = async (
        template: Template,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        if (submitting) return;

        setSubmitting(template.id);
        try {
            await api.post(`/vendor/templates/${template.id}/submit`);
            toast.success("Template submitted to Meta successfully!");
            setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, status: 'pending' } : t));
            fetchTemplates();
        } catch (error: unknown) {
            const message = (error as ApiError).response?.data?.message || "Failed to submit template";
            toast.error(message);
        } finally {
            setSubmitting(null);
        }
    };

    const handleSyncStatus = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSyncingId(id);
        try {
            const res = await api.post(`/vendor/templates/${id}/sync-status`);
            toast.success(res.data.message || "Status synced successfully");
            if (res.data.status) {
                setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: res.data.status } : t));
            }
            fetchTemplates();
        } catch (error: unknown) {
            const message = (error as ApiError).response?.data?.message || "Failed to sync status";
            toast.error(message);
        } finally {
            setSyncingId(null);
        }
    };

    const handleSendTemplate = (template: Template) => {
        if (template.status !== "approved") {
            return toast.error("Only approved templates can be sent");
        }
        setSelectedTemplate(template);
        setShowSendModal(true);
    };


    // Removal of unused handleSyncWithMeta function

    const handleDeleteTemplate = async (template: Template, e: React.MouseEvent) => {
        e.stopPropagation();
        toast(
            <ConfirmationToast
                message="Delete this template?"
                description="This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={async () => {
                    setDeleting(template.id);
                    try {
                        await api.delete(`/vendor/templates/${template.id}`);
                        toast.success("Template deleted successfully!");
                        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
                    } catch {
                        toast.error("Failed to delete template");
                    } finally {
                        setDeleting(null);
                    }
                }}
            />,
            { autoClose: false, closeOnClick: false }
        );
    };

    const handleCardClick = (template: Template) => {
        if (template.status === "approved") {
            handleSendTemplate(template);
        } else if (template.status === "draft" || template.status === "rejected") {
            handleEditFlowTemplate(template);
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "12:00";
        }
    };

    const handlePublishFlow = (flowId: string) => {
        toast(
            <ConfirmationToast
                message="Publish this Flow?"
                description="It will be available for use in templates. You can still edit it later (it will return to Draft)."
                confirmLabel="Publish"
                onConfirm={async () => {
                    let loadingToast;
                    try {
                        loadingToast = toast.loading("Publishing Flow...");
                        await api.post(`/whatsapp/flows/${flowId}/publish`);
                        toast.dismiss(loadingToast);
                        toast.success(
                            <div>
                                <p className="font-semibold">Flow published successfully!</p>
                                <p className="text-sm mt-1 text-gray-600">
                                    To send this Flow, go to the &quot;Flow Template&quot; tab, create a new Flow Template with this Flow, and send it to customers.
                                </p>
                            </div>,
                            { autoClose: 8000 }
                        );
                        fetchFlows();
                    } catch (error: unknown) {
                        const err = error as ApiError;
                        if (loadingToast) toast.dismiss(loadingToast);
                        const message =
                            err.response?.data?.message || "Failed to publish Flow";
                        const validationErrors = err.response?.data?.validationErrors;

                        if (validationErrors && validationErrors.length > 0) {
                            const errorDetails = validationErrors
                                .map((e: { error: string }) => e.error)
                                .join("\n");
                            toast.error(`Validation Failed:\n${errorDetails}`);
                        } else {
                            toast.error(message);
                        }
                    }
                }}
            />,
            { autoClose: false, closeOnClick: false },
        );
    };

    const handleDeprecateFlow = (flowId: string) => {
        toast(
            <ConfirmationToast
                message="Deprecate this Flow?"
                description="This will also DELETE any Flow Templates associated with this flow as they will no longer be usable."
                confirmLabel="Deprecate"
                onConfirm={async () => {
                    try {
                        await api.post(`/whatsapp/flows/${flowId}/deprecate`);
                        toast.success("Flow deprecated and associated templates removed");
                        fetchFlows();
                        fetchTemplates();
                    } catch (error: unknown) {
                        const err = error as ApiError;
                        toast.error(
                            err.response?.data?.message || "Failed to deprecate Flow",
                        );
                    }
                }}
            />,
            { autoClose: false, closeOnClick: false },
        );
    };

    const handleDeleteFlow = (flow: Flow) => {
        toast(
            <DeleteFlowConfirmation
                flowName={flow.name}
                onConfirm={async (deleteResponses: boolean) => {
                    try {
                        await api.delete(`/whatsapp/flows/${flow.id}${deleteResponses ? '?deleteResponses=true' : ''}`);
                        toast.success(`Flow ${deleteResponses ? 'and responses ' : ''}deleted successfully`);
                        fetchFlows();
                        fetchTemplates();
                    } catch (error: unknown) {
                        const err = error as ApiError;
                        toast.error(
                            err.response?.data?.message || "Failed to delete Flow",
                        );
                    }
                }}
            />,
            { autoClose: false, closeOnClick: false, className: 'min-w-[320px]' },
        );
    };



    const filteredFlows = flows.filter((flow) => {
        const matchesSearch = flow.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            flow.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const filteredTemplates = templates.filter((template) => {
        const matchesSearch = template.displayName
            .toLowerCase()
            .includes(templateSearchTerm.toLowerCase());
        const matchesStatus =
            templateStatusFilter === "all" ||
            template.status.toLowerCase() === templateStatusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm">
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200/50 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm">
                        Rejected
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200/50 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm">
                        Pending
                    </Badge>
                );
            default:
                return (
                    <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                        Draft
                    </Badge>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Layers className="w-8 h-8 text-primary" />
                            WhatsApp Forms
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Create interactive forms and structured experiences
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push("/flows/responses")}
                            className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors"
                            title="View All Flow Responses"
                        >
                            <FileText className="w-5 h-5" />
                            Responses
                        </button>
                        <button
                            onClick={() => router.push("/flows/metrics")}
                            className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors"
                            title="View Flow Metrics"
                        >
                            <BarChart3 className="w-5 h-5" />
                            Metrics
                        </button>
                        {activeTab === "flows" ? (
                            <button
                                onClick={handleCreateFlow}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Form
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateFlowTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Form Template
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/40 space-x-8 mb-6">
                    <button
                        onClick={() => setActiveTab("flows")}
                        className={cn(
                            "pb-4 text-sm font-medium transition-all relative flex items-center gap-2",
                            activeTab === "flows"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Form Creation
                        {activeTab === "flows" && (
                            <motion.div
                                layoutId="activeFlowTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("templates")}
                        className={cn(
                            "pb-4 text-sm font-medium transition-all relative flex items-center gap-2",
                            activeTab === "templates"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BookTemplate className="w-4 h-4" />
                        Form Template
                        {activeTab === "templates" && (
                            <motion.div
                                layoutId="activeFlowTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                </div>

                {/* Flow Creation Tab Content */}
                {activeTab === "flows" && (
                    <>
                        {/* Filters */}
                        <div className="bg-card border border-border rounded-lg p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search forms..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-muted-foreground" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="deprecated">Deprecated</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted-foreground mt-2">Loading forms...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && filteredFlows.length === 0 && (
                            <div className="text-center py-12 bg-card border border-border rounded-lg">
                                <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {searchTerm || statusFilter !== "all"
                                        ? "No forms found"
                                        : "No forms yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || statusFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "Create your first form to get started"}
                                </p>
                                {!searchTerm && statusFilter === "all" && (
                                    <button
                                        onClick={handleCreateFlow}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create First Form
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Flows Grid */}
                        {!loading && filteredFlows.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {filteredFlows.map((flow) => (
                                        <motion.div
                                            key={flow.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                                        >
                                            {/* Flow Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                                        {flow.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {flow.category}
                                                    </p>
                                                </div>
                                                {getStatusBadge(flow.status)}
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-border">
                                                <div
                                                    className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                                    onClick={() => router.push(`/flows/responses?flowId=${flow.id}`)}
                                                    title="View Responses"
                                                >
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        Responses <TrendingUp className="w-3 h-3" />
                                                    </p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {flow._count?.responses || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Templates</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {flow._count?.templates || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                                                {/* Primary Actions */}
                                                {flow.status === "DRAFT" ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <button
                                                            onClick={() => handleEditFlow(flow)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handlePublishFlow(flow.id)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                            Publish
                                                        </button>
                                                    </div>
                                                ) : flow.status === "PUBLISHED" ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <button
                                                            onClick={() => handleEditFlow(flow)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                            title="View form structure"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* DEPRECATED status */
                                                    <button
                                                        onClick={() => handleEditFlow(flow)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Flow
                                                    </button>
                                                )}

                                                {/* Secondary Actions */}
                                                <div className="flex items-center gap-1 border-l border-border pl-3">
                                                    {/* Delete - Enabled for all statuses */}
                                                    <button
                                                        onClick={() => handleDeleteFlow(flow)}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                                                        title="Delete Form"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* Flow Template Tab Content */}
                {activeTab === "templates" && (
                    <>
                        {/* Filters for Templates */}
                        <div className="bg-card border border-border rounded-lg p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search templates..."
                                        value={templateSearchTerm}
                                        onChange={(e) => setTemplateSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-muted-foreground" />
                                    <select
                                        value={templateStatusFilter}
                                        onChange={(e) => setTemplateStatusFilter(e.target.value)}
                                        className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {templateLoading && (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted-foreground mt-2">Loading templates...</p>
                            </div>
                        )}

                        {/* Empty State - Flow Templates */}
                        {!templateLoading && filteredTemplates.length === 0 && (
                            <div className="text-center py-12 bg-card border border-border rounded-lg">
                                <BookTemplate className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {templateSearchTerm || templateStatusFilter !== "all"
                                        ? "No templates found"
                                        : "No templates yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {templateSearchTerm || templateStatusFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "Create your first message template"}
                                </p>
                                {!templateSearchTerm && templateStatusFilter === "all" && (
                                    <button
                                        onClick={handleCreateFlowTemplate}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Template
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Flow Templates Grid */}
                        {!templateLoading && filteredTemplates.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {filteredTemplates.map((t) => (
                                        <motion.div
                                            key={t.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            className="group h-full"
                                        >
                                            <Card
                                                onClick={() => handleCardClick(t)}
                                                className={cn(
                                                    "h-full flex flex-col cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden group-hover:border-primary/20",
                                                    t.status === "approved" && "hover:border-green-500/30"
                                                )}
                                            >
                                                {/* Card Header area */}
                                                <div className="p-5 flex flex-col gap-3 border-b border-border/40 bg-linear-to-b from-muted/30 to-transparent">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <h3
                                                                className="font-semibold text-base text-foreground truncate"
                                                                title={t.displayName}
                                                            >
                                                                {t.displayName}
                                                            </h3>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {getStatusBadge(t.status)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] font-normal px-1.5 py-0 h-5 border-border/50 text-muted-foreground shrink-0 uppercase"
                                                        >
                                                            {t.templateType || 'STANDARD'}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] font-normal px-1.5 py-0 h-5 border-border/50 text-muted-foreground shrink-0"
                                                        >
                                                            {t.category}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground/60">
                                                            •
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/60">
                                                            {t.languages?.[0]?.language}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Body - Message Preview style */}
                                                <CardContent className="p-0 flex-1 flex flex-col relative bg-muted/5">
                                                    <div className="p-5 flex-1 relative overflow-hidden">
                                                        {/* Subtle background pattern for whatsapp feel */}
                                                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]"></div>

                                                        <div className="bg-white dark:bg-muted rounded-tr-xl rounded-bl-xl rounded-br-xl rounded-tl-none p-3 shadow-sm border border-border/20 text-xs text-foreground/80 leading-relaxed font-sans relative z-10 max-w-[90%] before:content-[''] before:absolute before:top-0 before:-left-1.5 before:w-3 before:h-3 before:bg-white dark:before:bg-muted before:[clip-path:polygon(100%_0,0_0,100%_100%)]">
                                                            {t.languages?.[0]?.headerType !== "TEXT" && (
                                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-border/40 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                    {t.languages?.[0]?.headerType === "IMAGE" ? (
                                                                        <ImageIcon className="w-3 h-3" />
                                                                    ) : (
                                                                        <Paperclip className="w-3 h-3" />
                                                                    )}
                                                                    {t.languages?.[0]?.headerType}
                                                                </div>
                                                            )}
                                                            <p className="line-clamp-4 whitespace-pre-wrap">
                                                                {t.languages?.[0]?.body || "No content"}
                                                            </p>

                                                            {/* Show button types (Quick Reply / URL / Phone) inline below the body */}
                                                            {t.buttons && t.buttons.length > 0 && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    {t.buttons.map((b, i) => (
                                                                        <Badge
                                                                            key={i}
                                                                            variant="outline"
                                                                            className="text-[10px] px-2 py-0.5 h-6"
                                                                        >
                                                                            {b.type === "QUICK_REPLY"
                                                                                ? "Quick Reply"
                                                                                : b.type === "URL"
                                                                                    ? "URL"
                                                                                    : b.type === "PHONE_NUMBER"
                                                                                        ? "Phone"
                                                                                        : b.type === "FLOW"
                                                                                            ? "Flow"
                                                                                            : b.type}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-dashed border-border/40">
                                                                {t.createdByName && (
                                                                    <span className="text-[9px] text-muted-foreground font-medium">
                                                                        By {t.createdByName}
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] text-muted-foreground font-medium">
                                                                    {t.createdAt ? formatTime(t.createdAt) : ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions Footer */}
                                                    <div className="p-3 bg-card border-t border-border/40 flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "flex-1 h-8 text-xs font-bold transition-all",
                                                                t.status === "draft"
                                                                    ? "text-blue-600 bg-blue-500/5 hover:bg-blue-500/10"
                                                                    : t.status === "approved"
                                                                        ? "text-green-600 bg-green-500/5 hover:bg-green-500/10"
                                                                        : "text-muted-foreground bg-muted/30 hover:bg-muted/50"
                                                            )}
                                                            onClick={(e) => {
                                                                if (t.status === "approved") {
                                                                    e.stopPropagation();
                                                                    handleSendTemplate(t);
                                                                } else if (t.status === "draft") {
                                                                    handleSubmitToMeta(t, e);
                                                                } else {
                                                                    handleSyncStatus(t.id, e);
                                                                }
                                                            }}
                                                            disabled={!!syncingId || !!submitting}
                                                        >
                                                            {syncingId === t.id || submitting === t.id ? (
                                                                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                                                            ) : t.status === "draft" ? (
                                                                <Upload className="w-3 h-3 mr-1.5" />
                                                            ) : t.status === "approved" ? (
                                                                <Send className="w-3 h-3 mr-1.5" />
                                                            ) : (
                                                                <RefreshCw className="w-3 h-3 mr-1.5" />
                                                            )}
                                                            {t.status === "draft"
                                                                ? "Submit"
                                                                : t.status === "approved"
                                                                    ? "Send"
                                                                    : "Sync"}
                                                        </Button>
                                                        <div className="w-px h-4 bg-border/60"></div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-1 h-8 text-xs font-bold text-red-500/80 bg-red-500/5 hover:text-red-600 hover:bg-red-500/10 transition-all"
                                                            onClick={(e) => handleDeleteTemplate(t, e)}
                                                            disabled={!!deleting}
                                                        >
                                                            {deleting === t.id ? (
                                                                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                                                            ) : (
                                                                <Trash2 className="w-3 h-3 mr-1.5" />
                                                            )}
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showEditorModal && (
                <FlowEditorModal
                    isOpen={showEditorModal}
                    onClose={() => {
                        setShowEditorModal(false);
                        setSelectedFlow(null);
                    }}
                    flow={selectedFlow}
                    onSave={() => {
                        fetchFlows();
                        setShowEditorModal(false);
                        setSelectedFlow(null);
                    }}
                />
            )}

            {showTemplateModal && (
                <FlowTemplateModal
                    isOpen={showTemplateModal}
                    onClose={() => {
                        setShowTemplateModal(false);
                        setSelectedTemplate(null);
                    }}
                    onSave={() => {
                        fetchTemplates();
                    }}
                    template={selectedTemplate}
                    flows={flows}
                />
            )}

            {showSendModal && (
                <TemplateSendModal
                    isOpen={showSendModal}
                    onClose={() => {
                        setShowSendModal(false);
                        setSelectedTemplate(null);
                    }}
                    template={selectedTemplate}
                />
            )}
        </div>
    );
}
