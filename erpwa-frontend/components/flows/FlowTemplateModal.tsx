"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Trash2,
    Loader2,
    Image as ImageIcon,
    Video,
    FileText,
    Eye,
    Layers,
    Globe,
    Phone,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Template } from "@/lib/types";
import { processMedia } from "@/lib/mediaProcessor";

interface Flow {
    id: string;
    name: string;
    status: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    template?: Template | null;
    flows: Flow[];
}

const formatError = (error: {response?: {data?: {details?: {error_user_msg?: string; error_user_title?: string; message?: string}; message?: string}}}, defaultMsg: string) => {
    const errorData = error.response?.data;
    let msg = errorData?.details?.error_user_msg || errorData?.details?.message || errorData?.message || defaultMsg;
    const title = errorData?.details?.error_user_title;
    if (msg.includes("too many variables for its length")) {
        msg = "Too many variables for the text length.";
    } else if (msg.includes("more than two consecutive newline characters")) {
        msg = "Invalid body: Check newlines, parameters, or emojis.";
    }
    return title ? `${title}: ${msg}` : msg;
};

export default function FlowTemplateModal({ isOpen, onClose, onSave, template, flows }: Props) {
    const [formData, setFormData] = useState({
        displayName: "",
        category: "MARKETING",
        language: "en_US",
        headerType: "TEXT",
        body: "",
        footerText: "",
        headerText: "",
    });
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [buttons, setButtons] = useState<{
        type: string;
        text: string;
        value?: string;
        flowId?: string;
        flowAction?: string;
        navigateScreen?: string;
    }[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const publishedFlows = flows.filter((f) => f.status === "PUBLISHED");

    useEffect(() => {
        if (template) {
            const lang = template.languages?.[0];
            setFormData({
                displayName: template.displayName,
                category: template.category,
                language: lang?.language || "en_US",
                headerType: lang?.headerType || "TEXT",
                body: lang?.body || "",
                footerText: lang?.footerText || "",
                headerText: lang?.headerText || "",
            });
            if (template.buttons) {
                setButtons(
                    template.buttons.map((b: {type: string; text: string; value?: string; flowId?: string; flowAction?: string; navigateScreen?: string}) => {
                        let navigateScreen = b.navigateScreen || b.value || "";

                        // Auto-repair: If flowId exists but screen is missing, try to find default
                        if (b.type === "FLOW" && b.flowId && !navigateScreen) {
                            const flow = flows.find((f: Flow) => f.id === b.flowId) as Flow & {flowJson?: string | Record<string, unknown>} | undefined;
                            if (flow) {
                                try {
                                    const json = typeof flow.flowJson === 'string' ? JSON.parse(flow.flowJson) : flow.flowJson as Record<string, unknown> | undefined;
                                    if (json?.screens && Array.isArray(json.screens) && json.screens.length > 0) {
                                        navigateScreen = (json.screens[0] as Record<string, unknown>).id as string;
                                    }
                                } catch { }
                            }
                        }

                        return {
                            type: b.type,
                            text: b.text,
                            value: b.value || "",
                            flowId: b.flowId,
                            flowAction: b.flowAction,
                            navigateScreen: navigateScreen
                        };
                    })
                );
            } else {
                setButtons([]);
            }
            setHeaderFile(null);
            const media = template.media?.find((m) => m.language === lang?.language);
            setHeaderPreview(media?.s3Url || null);
        } else {
            // Reset for creation
            setFormData({
                displayName: "",
                category: "MARKETING",
                language: "en_US",
                headerType: "TEXT",
                body: "",
                footerText: "",
                headerText: "",
            });
            setButtons([]);
            setHeaderFile(null);
            setHeaderPreview(null);
        }
    }, [template, isOpen, flows]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeaderFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setHeaderPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const addButton = (type: "FLOW") => {
        if (buttons.length >= 3) {
            toast.error("Maximum 3 buttons allowed");
            return;
        }
        setButtons([...buttons, { type, text: "", value: "", flowId: "", flowAction: "navigate", navigateScreen: "" }]);
    };

    const removeButton = (index: number) => {
        const newButtons = [...buttons];
        newButtons.splice(index, 1);
        setButtons(newButtons);
    };

    const updateButton = (index: number, key: string, val: string) => {
        const newButtons = [...buttons];
        (newButtons[index] as Record<string, string | undefined>)[key] = val;

        // Auto-select first screen when Flow changes
        if (key === "flowId") {
            const flow = publishedFlows.find(f => f.id === val);
            if (flow) {
                try {
                    const json = typeof (flow as Flow & {flowJson?: string | Record<string, unknown>}).flowJson === 'string' 
                        ? JSON.parse((flow as Flow & {flowJson: string}).flowJson) 
                        : (flow as Flow & {flowJson?: Record<string, unknown>}).flowJson as Record<string, unknown> | undefined;
                    const screens = json.screens || [];
                    if (screens.length > 0) {
                        newButtons[index].navigateScreen = screens[0].id;
                    }
                } catch (e) {
                    console.error("Failed to parse flow JSON", e);
                }
            } else {
                newButtons[index].navigateScreen = "";
            }
        }

        setButtons(newButtons);
    };

    const addVariable = () => {
        const varNum = (formData.body.match(/\{\{\d+\}\}/g) || []).length + 1;
        setFormData({ ...formData, body: formData.body + `{{${varNum}}}` });
    };

    const handleSubmit = async () => {
        if (!formData.displayName || !formData.body) {
            return toast.error("Please fill required fields");
        }

        // Check if there's at least one Flow button
        const hasFlowButton = buttons.some((b) => b.type === "FLOW");
        if (!hasFlowButton) {
            return toast.error("Flow Template must have at least one Flow button");
        }

        // Validate Flow buttons
        for (const btn of buttons) {
            if (btn.type === "FLOW") {
                if (!btn.flowId) {
                    return toast.error("Please select a Flow for the Flow button");
                }
                if (!btn.text) {
                    return toast.error("Please enter text for the Flow button");
                }
                if (btn.flowAction === "navigate" && !btn.navigateScreen) {
                    return toast.error("Please select a destination screen for the Flow button");
                }
            }
        }

        if (formData.headerType !== "TEXT" && !headerFile && !template) {
            return toast.error("Please upload a header file");
        }

        setIsCreating(true);

        // Sanitize template name for Meta
        const metaTemplateName = formData.displayName
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .trim();

        try {
            const data = new FormData();
            if (!template) {
                data.append("metaTemplateName", metaTemplateName);
            }
            data.append("displayName", formData.displayName);
            data.append("category", formData.category);
            data.append("language", formData.language);
            data.append("body", formData.body);
            data.append("header.type", formData.headerType);

            if (formData.footerText) {
                data.append("footerText", formData.footerText);
            }

            if (formData.headerType === "TEXT" && formData.headerText) {
                data.append("header.text", formData.headerText);
            }

            if (formData.headerType !== "TEXT" && headerFile) {
                try {
                    const { file } = await processMedia(headerFile);
                    data.append("header.file", file);
                } catch (err) {
                    toast.error((err as {message?: string}).message || "Media validation failed");
                    setIsCreating(false);
                    return;
                }
            }

            // Send buttons as JSON string to ensure robust parsing
            data.append("buttons", JSON.stringify(buttons));

            if (template) {
                await api.put(`/vendor/templates/${template.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Flow Template updated successfully!");
            } else {
                await api.post("/vendor/templates", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Flow Template created successfully!");
            }

            // Important: Call onSave to refresh the list immediately!
            onSave();
            onClose();
        } catch (error) {
            console.error("Template Save Error:", error);
            toast.error(formatError(error as {response?: {data?: {details?: {error_user_msg?: string; error_user_title?: string; message?: string}; message?: string}}}, "Failed to save template"));
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-background w-full max-w-6xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-full sm:h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center shrink-0 bg-muted/10">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Layers className="w-5 h-5 text-primary" />
                                {template ? "Edit Flow Template" : "Create Flow Template"}
                            </h2>
                            <p className="text-xs text-muted-foreground/80">
                                Create a message template with Flow buttons to trigger WhatsApp Flows
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="lg:hidden h-8 text-xs gap-2"
                                onClick={() => setShowMobilePreview(!showMobilePreview)}
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-muted/5 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
                        {/* LEFT: FORM */}
                        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        1
                                    </div>
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">
                                            Template Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            placeholder="e.g. flow_survey_template"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">Category</label>
                                        <select
                                            className="w-full h-10 pl-3 pr-8 border rounded-md bg-background text-sm appearance-none focus:ring-2 focus:ring-primary/20 outline-none border-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="MARKETING">Marketing</option>
                                            <option value="UTILITY">Utility</option>
                                            <option value="AUTHENTICATION">Authentication</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-medium">Language</label>
                                        <div className="flex gap-2">
                                            {["en_US", "hi_IN"].map((lang) => (
                                                <div
                                                    key={lang}
                                                    onClick={() => setFormData({ ...formData, language: lang })}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-all",
                                                        formData.language === lang
                                                            ? "bg-primary/10 border-primary text-primary font-medium shadow-sm"
                                                            : "bg-background border-border hover:bg-muted"
                                                    )}
                                                >
                                                    {lang === "en_US" ? "English (US)" : "Hindi (India)"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border/40"></div>

                            {/* Message Content */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        2
                                    </div>
                                    Message Content
                                </h3>
                                <div className="pl-8 space-y-4">
                                    {/* Header Type */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Header Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["TEXT", "IMAGE", "VIDEO", "DOCUMENT"].map((type) => (
                                                <div
                                                    key={type}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-all flex items-center gap-2",
                                                        formData.headerType === type
                                                            ? "bg-primary/10 border-primary text-primary font-medium shadow-sm"
                                                            : "bg-background border-border hover:bg-muted"
                                                    )}
                                                    onClick={() => setFormData({ ...formData, headerType: type })}
                                                >
                                                    {type === "IMAGE" && <ImageIcon className="w-3 h-3" />}
                                                    {type === "VIDEO" && <Video className="w-3 h-3" />}
                                                    {type === "DOCUMENT" && <FileText className="w-3 h-3" />}
                                                    {type === "TEXT" && <span className="text-[10px] font-bold">T</span>}
                                                    {type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Header Text */}
                                    {formData.headerType === "TEXT" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">Header Text</label>
                                            <Input
                                                placeholder="Header text..."
                                                value={formData.headerText}
                                                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                                                className="bg-background"
                                            />
                                        </div>
                                    )}

                                    {/* Header File */}
                                    {formData.headerType !== "TEXT" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium">
                                                Header {formData.headerType} {!template && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept={
                                                    formData.headerType === "IMAGE" ? "image/*" :
                                                        formData.headerType === "VIDEO" ? "video/*" :
                                                            ".pdf,.doc,.docx"
                                                }
                                                className="hidden"
                                            />
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                            >
                                                {headerPreview ? (
                                                    formData.headerType === "IMAGE" ? (
                                                        <img src={headerPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                                                    ) : formData.headerType === "VIDEO" ? (
                                                        <video src={headerPreview} className="max-h-32 mx-auto rounded" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <FileText className="w-8 h-8 text-primary" />
                                                            <p className="text-sm text-foreground">{headerFile?.name || "Document selected"}</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                        {formData.headerType === "IMAGE" ? <ImageIcon className="w-6 h-6" /> :
                                                            formData.headerType === "VIDEO" ? <Video className="w-6 h-6" /> :
                                                                <FileText className="w-6 h-6" />}
                                                        <p className="text-sm">Click to upload {formData.headerType.toLowerCase()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-medium">
                                                Body <span className="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addVariable}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                + Add Variable
                                            </button>
                                        </div>
                                        <textarea
                                            placeholder="Enter your message body..."
                                            value={formData.body}
                                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                            rows={4}
                                            className="w-full border rounded-md bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none border-input resize-none"
                                        />
                                    </div>

                                    {/* Footer */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">Footer (optional)</label>
                                        <Input
                                            placeholder="Footer text..."
                                            value={formData.footerText}
                                            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border/40"></div>

                            {/* Buttons (Flow Required) */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        3
                                    </div>
                                    Buttons
                                    <span className="text-xs text-muted-foreground font-normal ml-2">(At least one Flow button required)</span>
                                </h3>
                                <div className="pl-8 space-y-4">
                                    {/* Button List */}
                                    {buttons.map((btn, index) => (
                                        <div key={index} className="p-4 border border-border rounded-lg bg-muted/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded",
                                                    btn.type === "FLOW" ? "bg-blue-100 text-blue-700" :
                                                        btn.type === "URL" ? "bg-green-100 text-green-700" :
                                                            btn.type === "PHONE_NUMBER" ? "bg-purple-100 text-purple-700" :
                                                                "bg-gray-100 text-gray-700"
                                                )}>
                                                    {btn.type === "FLOW" && <><Layers className="w-3 h-3 inline mr-1" />Flow</>}
                                                    {btn.type === "URL" && <><Globe className="w-3 h-3 inline mr-1" />URL</>}
                                                    {btn.type === "PHONE_NUMBER" && <><Phone className="w-3 h-3 inline mr-1" />Phone</>}
                                                    {btn.type === "QUICK_REPLY" && <>Quick Reply</>}
                                                </span>
                                                <button
                                                    onClick={() => removeButton(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <Input
                                                placeholder="Button text"
                                                value={btn.text}
                                                onChange={(e) => updateButton(index, "text", e.target.value)}
                                                className="bg-background"
                                            />

                                            {btn.type === "FLOW" && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium">Select Flow</label>
                                                    <select
                                                        className="w-full h-10 pl-3 pr-8 border rounded-md bg-background text-sm appearance-none focus:ring-2 focus:ring-primary/20 outline-none border-input"
                                                        value={btn.flowId || ""}
                                                        onChange={(e) => updateButton(index, "flowId", e.target.value)}
                                                    >
                                                        <option value="">Select a published flow...</option>
                                                        {publishedFlows.map((flow) => (
                                                            <option key={flow.id} value={flow.id}>
                                                                {flow.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Screen Selection */}
                                                    {btn.flowId && (() => {
                                                        const flow = publishedFlows.find(f => f.id === btn.flowId);
                                                        let screens: Array<Record<string, unknown>> = [];
                                                        try {
                                                            const json = flow && (typeof (flow as Flow & {flowJson?: string | Record<string, unknown>}).flowJson === 'string' 
                                                                ? JSON.parse((flow as Flow & {flowJson: string}).flowJson) 
                                                                : (flow as Flow & {flowJson?: Record<string, unknown>}).flowJson) as Record<string, unknown> | undefined;
                                                            screens = (Array.isArray(json?.screens) ? json.screens : []) as Array<Record<string, unknown>>;
                                                        } catch { }

                                                        if (screens.length > 0) {
                                                            return (
                                                                <div className="space-y-1 pt-2">
                                                                    <label className="text-xs font-medium">Initial Screen <span className="text-red-500">*</span></label>
                                                                    <select
                                                                        className="w-full h-9 px-3 border rounded-md bg-background text-xs outline-none focus:border-primary"
                                                                        value={btn.navigateScreen || ""}
                                                                        onChange={(e) => updateButton(index, "navigateScreen", e.target.value)}
                                                                    >
                                                                        <option value="">Select Screen</option>
                                                                        {screens.map((screen: Record<string, unknown>) => (
                                                                            <option key={String(screen.id)} value={String(screen.id)}>
                                                                                {String(screen.title || screen.id)} ({String(screen.id)})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {publishedFlows.length === 0 && (
                                                        <p className="text-xs text-amber-600">
                                                            No published flows available. Please publish a flow first.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {btn.type === "URL" && (
                                                <Input
                                                    placeholder="https://example.com"
                                                    value={btn.value || ""}
                                                    onChange={(e) => updateButton(index, "value", e.target.value)}
                                                    className="bg-background"
                                                />
                                            )}

                                            {btn.type === "PHONE_NUMBER" && (
                                                <Input
                                                    placeholder="+1234567890"
                                                    value={btn.value || ""}
                                                    onChange={(e) => updateButton(index, "value", e.target.value)}
                                                    className="bg-background"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Button Options */}
                                    <div className="flex flex-wrap gap-2">
                                        {!buttons.some((b) => b.type === "FLOW") && (
                                            <button
                                                onClick={() => addButton("FLOW")}
                                                disabled={buttons.length >= 3}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed border border-primary transition-all shadow-sm active:scale-95"
                                            >
                                                <Layers className="w-4 h-4" />
                                                + Add Flow Button
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: PHONE PREVIEW */}
                        <div
                            className={cn(
                                "bg-muted/50 p-8 flex-col items-center justify-center relative border-l border-border/50 overflow-hidden transition-all",
                                "lg:flex lg:col-span-5 xl:col-span-4 lg:static lg:z-auto lg:p-4 lg:pt-4", // Desktop defaults
                                showMobilePreview
                                    ? "flex fixed inset-0 z-50 pt-24 pb-8"
                                    : "hidden" // Mobile overlay
                            )}
                        >
                            {showMobilePreview && (
                                <Button
                                    className="absolute top-4 right-4 z-50 lg:hidden shadow-lg"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowMobilePreview(false)}
                                >
                                    Close Preview
                                </Button>
                            )}
                            <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none"></div>

                            {/* Mobile Frame Container */}
                            <div className="relative mx-auto w-full max-w-70 border-10 border-border rounded-[48px] shadow-2xl bg-card transition-all duration-500 overflow-hidden transform lg:scale-[1.02] 2xl:scale-105">
                                <div className="h-6 bg-card flex justify-between items-center px-6 pt-3 z-20 relative">
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                        9:41
                                    </span>
                                    <div className="flex gap-1.5 opacity-50 italic font-bold text-[10px] text-muted-foreground">
                                        WhatsApp
                                    </div>
                                </div>

                                <div className="relative bg-muted/30 p-3 pt-4 min-h-125 max-h-137.5 overflow-y-auto custom-scrollbar flex flex-col">
                                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]"></div>

                                    <div className="relative z-10 w-full flex flex-col gap-1 mt-1 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="bg-card rounded-2xl rounded-tl-none shadow-lg relative overflow-hidden group border border-border before:content-[''] before:absolute before:top-0 before:-left-1.5 before:w-3 before:h-3 before:bg-card before:[clip-path:polygon(100%_0,0_0,100%_100%)]">
                                            <div className="p-1">
                                                {/* Header Media */}
                                                {(formData.headerType === "IMAGE" ||
                                                    formData.headerType === "VIDEO") && (
                                                        <div className="rounded-xl overflow-hidden bg-muted min-h-35 relative group flex items-center justify-center">
                                                            {headerPreview ? (
                                                                formData.headerType === "VIDEO" ? (
                                                                    <video
                                                                        src={headerPreview}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={headerPreview}
                                                                        alt="Header"
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                )
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1 opacity-20 text-muted-foreground">
                                                                    {formData.headerType === "IMAGE" ? (
                                                                        <ImageIcon className="w-6 h-6" />
                                                                    ) : (
                                                                        <Video className="w-6 h-6" />
                                                                    )}
                                                                    <span className="text-[8px] font-bold uppercase">
                                                                        {formData.headerType}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                {/* Header Text */}
                                                {formData.headerType === "TEXT" &&
                                                    formData.headerText && (
                                                        <p className="font-bold text-[14px] pt-2 px-3 text-foreground leading-tight">
                                                            {formData.headerText}
                                                        </p>
                                                    )}
                                            </div>

                                            <div className="px-3 pt-1 pb-3 text-[13px] leading-snug text-foreground/80 whitespace-pre-wrap font-sans">
                                                {formData.body || "Your message body..."}

                                                {formData.footerText && (
                                                    <p className="mt-1.5 text-[11px] text-muted-foreground font-medium border-t border-border pt-1.5">
                                                        {formData.footerText}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Buttons */}
                                            {buttons.length > 0 && (
                                                <div className="border-t border-border flex flex-col divide-y divide-border bg-muted/30">
                                                    {buttons.map((btn, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-2.5 text-center text-[13px] font-medium text-primary flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                                                        >
                                                            {btn.type === "URL" ? (
                                                                <Globe className="w-3.5 h-3.5" />
                                                            ) : btn.type === "PHONE_NUMBER" ? (
                                                                <Phone className="w-3.5 h-3.5" />
                                                            ) : btn.type === "FLOW" ? (
                                                                <Layers className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                            )}
                                                            {btn.text || "Button Label"}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="self-end mr-1 mt-0.5 flex items-center gap-1 opacity-40">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                9:41 AM
                                            </span>
                                            <div className="flex -space-x-1">
                                                <CheckCircle className="w-2.5 h-2.5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 font-bold tracking-widest uppercase opacity-40">
                                Live Preview
                            </p>
                        </div>
                    </div>

                    {/* Footer - Sticky at bottom */}
                    <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3 shrink-0">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isCreating}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-37.5"
                        >
                            {isCreating ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            {template ? "Update Template" : "Create Template"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
