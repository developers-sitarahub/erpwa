"use client";


import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Send,
    Loader2,
    Search,
    Users,
    FileText,
    Eye,
    Globe,
    Phone,
    Layers,
    Video,
} from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Checkbox } from "@/components/checkbox";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Template, Lead } from "@/lib/types";
import { leadsAPI } from "@/lib/leadsApi";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    template: Template | null;
}

interface ErrorResponse {
    message?: string;
    details?: {
        error_user_msg?: string;
        message?: string;
    };
}

const formatError = (error: unknown, defaultMsg: string) => {
    const errorData = (error as { response?: { data?: ErrorResponse } })?.response?.data;
    return errorData?.details?.error_user_msg || errorData?.details?.message || errorData?.message || defaultMsg;
};

export default function TemplateSendModal({ isOpen, onClose, template }: Props) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [recipientList, setRecipientList] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState("");
    const [variables, setVariables] = useState<string[]>([]);
    const [variableSources, setVariableSources] = useState<Record<number, "custom" | "company_name">>({});
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
        }
    }, [isOpen]);

    useEffect(() => {
        if (template) {
            setRecipientList([]);
            setRecipientInput("");
            const body = template.languages?.[0]?.body || "";
            const match = body.match(/{{\d+}}/g);
            const count = match ? new Set(match).size : 0;
            setVariables(new Array(count).fill(""));
            setVariableSources({});
        }
    }, [template]);

    const fetchLeads = async () => {
        try {
            setLoadingLeads(true);
            const response = await leadsAPI.list();
            setLeads(response.data.leads || []);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoadingLeads(false);
        }
    };

    const addRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && recipientInput.trim()) {
            e.preventDefault();
            const val = recipientInput.trim();
            if (!recipientList.includes(val)) {
                setRecipientList([...recipientList, val]);
            }
            setRecipientInput("");
            setSearchTerm("");
        }
    };

    const toggleLead = (mobile: string) => {
        if (recipientList.includes(mobile)) {
            setRecipientList(recipientList.filter(m => m !== mobile));
        } else {
            setRecipientList([...recipientList, mobile]);
        }
    };

    const handleSend = async () => {
        if (!template) return;
        if (recipientList.length === 0) return toast.error("Please add at least one recipient");

        setSending(true);
        try {
            const hasDynamicVariables = Object.values(variableSources).some(v => v === "company_name");
            
            interface SendTemplatePayload {
                templateId: string;
                recipients?: string[];
                bodyVariables?: string[];
                customMessages?: Array<{
                    to: string;
                    bodyVariables: string[];
                }>;
            }

            const payload: SendTemplatePayload = {
                templateId: template.id,
            };

            if (hasDynamicVariables) {
                const customMessages = recipientList.map(mobile => {
                    const lead = leads.find(l => l.mobile_number === mobile);
                    const companyName = lead?.company_name || "Valued Customer";

                    const bodyVariables = variables.map((val, idx) => {
                        return variableSources[idx] === "company_name" ? companyName : val;
                    });

                    return { to: mobile, bodyVariables };
                });
                payload.customMessages = customMessages;
            } else {
                payload.recipients = recipientList;
                payload.bodyVariables = variables;
            }

            // Standard bulk send endpoint
            const res = await api.post("/vendor/whatsapp/template/send-template", payload);

            const results = res.data.results || [];
            const failed = results.filter((r: { success: boolean, error?: { error_user_msg?: string; error_user_title?: string; message?: string } | string }) => !r.success);

            if (failed.length > 0) {
                const errObj = failed[0].error;
                let firstError = "Unknown error";
                
                if (typeof errObj === "string") {
                    firstError = errObj;
                } else if (errObj) {
                    const details = errObj.error_data?.details ? ` - ${errObj.error_data.details}` : "";
                    firstError = errObj.error_user_msg || errObj.message || "Unknown error";
                    if (errObj.error_user_title) {
                        firstError = `${errObj.error_user_title}: ${firstError}`;
                    }
                    firstError += details;
                }

                if (failed.length === results.length) {
                    toast.error(`Failed to send: ${firstError}`);
                } else {
                    toast.warning(`${results.length - failed.length} sent, ${failed.length} failed. (${firstError})`);
                }
            } else {
                toast.success("Messages sent successfully!");
                onClose();
            }
        } catch (error) {
            toast.error(formatError(error, "Failed to send"));
        } finally {
            setSending(false);
        }
    };

    const filteredLeads = leads.filter(l =>
        !searchTerm ||
        l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.mobile_number?.includes(searchTerm)
    );

    if (!isOpen || !template) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background w-full max-w-2xl sm:rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" /> Send {template.displayName}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                        {/* Preview Section - WhatsApp Style */}
                        <div className="bg-muted/10 rounded-xl p-4 border border-border/50 space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                            </label>

                            <div className="bg-white dark:bg-card p-4 rounded-xl rounded-tl-none shadow-sm border border-border/20 text-sm whitespace-pre-wrap leading-relaxed relative before:content-[''] before:absolute before:top-0 before:-left-1.5 before:w-3 before:h-3 before:bg-white dark:before:bg-card before:[clip-path:polygon(100%_0,0_0,100%_100%)]">
                                {/* Header Media Preview */}
                                {template.languages?.[0]?.headerType !== "TEXT" && (() => {
                                    const mediaItem = template.media?.find(m => m.language === template.languages?.[0]?.language);
                                    if (mediaItem?.s3Url) {
                                        if (template.languages?.[0].headerType === "IMAGE") {
                                            return (
                                                <div className="rounded-lg overflow-hidden bg-black/40 border border-border/10 mb-3 shadow-md flex items-center justify-center min-h-[140px] relative w-full h-40">
                                                    <Image 
                                                        src={mediaItem.s3Url} 
                                                        alt="Header" 
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                </div>
                                            );
                                        } else if (template.languages?.[0].headerType === "VIDEO") {
                                            return (
                                                <div className="rounded-lg overflow-hidden bg-black/40 border border-border/10 mb-3 relative shadow-md flex items-center justify-center min-h-35">
                                                    <video src={mediaItem.s3Url} className="w-full h-full object-contain" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white">
                                                            <Video className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }
                                    return null;
                                })()}

                                {/* Header Text Preview */}
                                {template.languages?.[0]?.headerType === "TEXT" && template.languages?.[0]?.headerText && (
                                    <p className="font-bold text-sm mb-2 text-foreground">
                                        {template.languages[0].headerText}
                                    </p>
                                )}

                                {/* Body Text with Variables Replacements */}
                                <div className="text-foreground/90 font-sans leading-relaxed">
                                    {(() => {
                                        let bodyText = template.languages?.[0]?.body || "";
                                        variables.forEach((val, idx) => {
                                            const placeholder = `{{${idx + 1}}}`;
                                            bodyText = bodyText.replace(placeholder, val || placeholder);
                                        });
                                        return bodyText;
                                    })()}
                                </div>

                                {/* Footer text */}
                                {template.languages?.[0]?.footerText && (
                                    <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/40 pt-2 italic">
                                        {template.languages[0].footerText}
                                    </p>
                                )}

                                {/* Buttons Preview */}
                                {template.buttons && template.buttons.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                                        {template.buttons.map((btn, idx) => (
                                            <div key={idx} className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-primary font-medium text-sm">
                                                {btn.type === "URL" ? <Globe className="w-4 h-4" />
                                                    : btn.type === "PHONE_NUMBER" ? <Phone className="w-4 h-4" />
                                                        : btn.type === "FLOW" ? <Layers className="w-4 h-4" />
                                                            : <Send className="w-4 h-4" />}
                                                {btn.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full h-px bg-border/40 my-2"></div>

                        {/* Variables Section */}
                        {variables.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Variables</h3>
                                <div className="space-y-2 bg-muted/10 p-3 rounded-lg border border-border">
                                    {variables.map((val, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <span className="text-xs font-mono bg-muted px-1 rounded">{`{{${idx + 1}}}`}</span>
                                            {variableSources[idx] === "company_name" ? (
                                                <div className="flex-1 text-sm text-muted-foreground p-2 bg-muted border rounded">Mapped to Company Name</div>
                                            ) : (
                                                <Input
                                                    placeholder="Variable value"
                                                    value={val}
                                                    onChange={e => {
                                                        const newVars = [...variables];
                                                        newVars[idx] = e.target.value;
                                                        setVariables(newVars);
                                                    }}
                                                    className="flex-1 h-9"
                                                />
                                            )}
                                            <div className="flex bg-muted rounded p-0.5">
                                                <button
                                                    onClick={() => setVariableSources({ ...variableSources, [idx]: "custom" })}
                                                    className={cn("px-2 py-1 text-xs rounded", (!variableSources[idx] || variableSources[idx] === "custom") ? "bg-background shadow font-medium" : "text-muted-foreground")}
                                                >Custom</button>
                                                <button
                                                    onClick={() => setVariableSources({ ...variableSources, [idx]: "company_name" })}
                                                    className={cn("px-2 py-1 text-xs rounded", variableSources[idx] === "company_name" ? "bg-background shadow font-medium" : "text-muted-foreground")}
                                                >Company</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recipients Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Recipients</h3>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search leads or enter number..."
                                        value={recipientInput}
                                        onChange={e => {
                                            setRecipientInput(e.target.value);
                                            setSearchTerm(e.target.value);
                                        }}
                                        onKeyDown={addRecipient}
                                        className="pl-9"
                                    />
                                </div>
                                <Button variant="secondary" onClick={() => { setRecipientInput(""); setSearchTerm(""); }}>Clear</Button>
                            </div>

                            {/* Added List */}
                            {recipientList.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-muted/10 rounded-lg max-h-32 overflow-y-auto">
                                    {recipientList.map(mobile => (
                                        <div key={mobile} className="flex items-center gap-1 bg-background border px-2 py-1 rounded-full text-xs">
                                            {mobile}
                                            <button onClick={() => toggleLead(mobile)} className="text-red-500 hover:text-red-700 ml-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setRecipientList([])} className="text-xs text-muted-foreground hover:text-red-500 underline ml-2">Clear all</button>
                                </div>
                            )}

                            {/* Leads List */}
                            <div className="border rounded-lg h-60 overflow-y-auto divide-y bg-background">
                                {loadingLeads ? (
                                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                                ) : filteredLeads.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">No leads found</div>
                                ) : (
                                    filteredLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                                            onClick={() => toggleLead(lead.mobile_number)}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{lead.company_name}</p>
                                                <p className="text-xs text-muted-foreground">{lead.mobile_number}</p>
                                            </div>
                                            <Checkbox checked={recipientList.includes(lead.mobile_number)} onChange={() => { }} className="pointer-events-none" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSend} disabled={sending} className="bg-green-600 hover:bg-green-700 text-white min-w-37.5">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Message
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
