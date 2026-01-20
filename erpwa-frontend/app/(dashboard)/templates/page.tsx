"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { RefreshCw, Send, CheckCircle, XCircle, Clock, X, Phone } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";

// Types
type Template = {
  id: string;
  metaTemplateName: string;
  displayName: string;
  category: string;
  status: string;
  languages: {
    language: string;
    body: string;
    headerType: string;
  }[];
  buttons: {
    type: string;
    text: string;
  }[];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/vendor/templates");
      // Filter only approved/pending for Sales view, or show all
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openSendModal = (template: Template) => {
    setSelectedTemplate(template);

    // Extract variables count
    const body = template.languages[0]?.body || "";
    const match = body.match(/{{\d+}}/g);
    const count = match ? new Set(match).size : 0;

    setVariables(new Array(count).fill(""));
    setRecipients("");
    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!selectedTemplate || !recipients) return toast.error("Please enter recipients");

    setSending(true);
    try {
      // Split recipients by comma or newline
      const toList = recipients.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);

      await api.post("/vendor/whatsapp/template/send-template", {
        recipients: toList,
        templateId: selectedTemplate.id,
        bodyVariables: variables,
      });

      toast.success("Messages sent successfully!");
      setShowSendModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.results?.[0]?.error || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 relative">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Message Templates</h1>
          <p className="text-sm text-muted-foreground">Select a template to send to your customers.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No templates found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{template.displayName}</CardTitle>
                    <Badge variant={template.status === "approved" ? "secondary" : "outline"} className={template.status === "approved" ? "bg-green-100 text-green-800 border-green-200" : ""}>
                      {template.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 flex flex-col">
                  <div className="bg-muted/50 p-3 rounded text-sm text-foreground/80 line-clamp-4 flex-1">
                    {template.languages[0]?.body}
                  </div>

                  {template.status === "approved" ? (
                    <Button className="w-full mt-auto" onClick={() => openSendModal(template)}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full mt-auto opacity-50 cursor-not-allowed">
                      {template.status === "draft" ? "Draft" : "Pending Approval"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SEND MODAL */}
      <AnimatePresence>
        {showSendModal && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-border"
            >
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="font-bold text-lg">Send "{selectedTemplate.displayName}"</h2>
                <button onClick={() => setShowSendModal(false)} className="p-1 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

                {/* Preview */}
                <div className="bg-muted/30 p-3 rounded-lg text-sm border border-dashed border-border">
                  <p className="font-semibold text-xs text-muted-foreground mb-1">TEMPLATE PREVIEW</p>
                  <p>{selectedTemplate.languages[0]?.body}</p>
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipients (Phone Numbers)</label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border bg-background"
                    placeholder="919876543210, 911234567890 (comma separated)"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter numbers with country code, without '+'</p>
                </div>

                {/* Variables */}
                {variables.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium">Dynamic Variables</label>
                    {variables.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">{`{{${idx + 1}}}`}</span>
                        <Input
                          placeholder={`Value for {{${idx + 1}}}`}
                          value={val}
                          onChange={(e) => {
                            const newVars = [...variables];
                            newVars[idx] = e.target.value;
                            setVariables(newVars);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancel</Button>
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Now
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
