import { Search, MoreVertical, MessageCircle, Loader2, UserPlus, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getConversationTick } from "@/utils/getConversationTicks";
import { useState, useEffect } from "react";
import { Conversation, Lead } from "@/lib/types";
import {
  checkWhatsAppNumber,
  createWhatsAppConversation,
} from "@/lib/whatsappApi";
import { toast } from "react-toastify";

export default function ConversationList({
  conversations,
  assignedLeads = [],
  selected,
  onSelect,
  onReload,
}: {
  conversations: Conversation[];
  assignedLeads?: Lead[];
  selected: string;
  onSelect: (id: string) => void;
  onReload?: () => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLeadId, setCreatingLeadId] = useState<number | null>(null);
  const [isLeadsOpen, setIsLeadsOpen] = useState(false); // ✅ State for bottom drawer
  const [whatsappCheckResult, setWhatsappCheckResult] = useState<{
    isOnWhatsApp: boolean;
    phoneNumber: string;
    conversationExists: boolean;
    conversationId?: string;
    lead?: {
      id: number;
      phoneNumber: string;
      companyName: string;
    };
  } | null>(null);

  const [leadsSearchQuery, setLeadsSearchQuery] = useState(""); // ✅ Local search for leads

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return (
      conv.companyName?.toLowerCase().includes(query) ||
      conv.phone?.toLowerCase().includes(query)
    );
  });

  // Filter assigned leads based on LOCAL search query
  const displayedLeads = assignedLeads.filter((lead) => {
    // Check if lead already has a conversation
    const hasConversation = conversations.some(
      (c) =>
        c.phone?.replace(/\D/g, "") === lead.mobile_number?.replace(/\D/g, "") ||
        c.phone?.replace(/\D/g, "") === (lead as any).phoneNumber?.replace(/\D/g, "")
    );
    if (hasConversation) return false;

    // Local Search filter
    if (leadsSearchQuery) {
      const query = leadsSearchQuery.toLowerCase();
      const name = lead.company_name || (lead as any).companyName || "";
      const phone = lead.mobile_number || (lead as any).phoneNumber || "";
      return (
        name.toLowerCase().includes(query) || phone.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Check if search query looks like a phone number
  const isPhoneNumber = (query: string) => {
    const digitsOnly = query.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  };

  // Debounce WhatsApp number check
  useEffect(() => {
    if (!searchQuery || !isPhoneNumber(searchQuery)) {
      setWhatsappCheckResult(null);
      return;
    }

    // Don't check if we already have a conversation with this number
    const existingConv = conversations.find(
      (conv) =>
        conv.phone?.replace(/\D/g, "") === searchQuery.replace(/\D/g, ""),
    );
    if (existingConv) {
      setWhatsappCheckResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await checkWhatsAppNumber(searchQuery);
        setWhatsappCheckResult(result);
      } catch (error) {
        console.error("Error checking WhatsApp number:", error);
        setWhatsappCheckResult(null);
      } finally {
        setIsChecking(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery, conversations]);

  // Handle creating a new conversation
  const handleStartChat = async () => {
    if (!whatsappCheckResult || isCreating) return;

    setIsCreating(true);
    try {
      if (whatsappCheckResult.conversationExists) {
        // Open existing conversation
        onSelect(whatsappCheckResult.conversationId!);
        setSearchQuery("");
        setWhatsappCheckResult(null);
      } else {
        // Create new conversation
        const result = await createWhatsAppConversation(
          whatsappCheckResult.phoneNumber,
          whatsappCheckResult.lead?.companyName ||
          whatsappCheckResult.phoneNumber,
        );

        // Reload conversations list to include the new one
        if (onReload) {
          await onReload();
        }

        // Open the new conversation
        onSelect(result.conversationId);
        setSearchQuery("");
        setWhatsappCheckResult(null);

        toast.success("Conversation created successfully!");
      }
    } catch (error: any) {
      console.error("Error starting chat:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to start conversation. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLeadClick = async (lead: Lead) => {
    if (isCreating || creatingLeadId) return;

    // Check types mapping (mobile_number vs phoneNumber)
    const phoneNumber = lead.mobile_number || (lead as any).phoneNumber;
    const companyName = lead.company_name || (lead as any).companyName;

    if (!phoneNumber) {
      toast.error("Lead has no phone number");
      return;
    }

    setCreatingLeadId(lead.id);
    try {
      const result = await createWhatsAppConversation(
        phoneNumber,
        companyName || phoneNumber
      );

      if (onReload) {
        await onReload();
      }
      onSelect(result.conversationId);
      setLeadsSearchQuery(""); // Clear search after selection
      setIsLeadsOpen(false); // Close drawer

    } catch (error) {
      console.error("Failed to start chat with lead", error);
      toast.error("Failed to start chat");
    } finally {
      setCreatingLeadId(null);
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 xl:w-[420px] bg-card border-r border-border flex flex-col h-full">
      <div className="bg-card p-3 flex items-center justify-between border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Chats</h2>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>



      {/* RELATIVE CONTAINER FOR SEARCH + LIST + DRAWER */}
      <div className="flex-1 relative flex flex-col overflow-hidden bg-background">

        {/* Main Search Bar (Included in relative container so drawer covers it) */}
        <div className="flex-none px-3 py-2 bg-card border-b border-border">
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
            />
            {isChecking && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* MAIN CONVERSATION LIST (Scrollable) */}
        <div className={`flex-1 overflow-y-auto pb-[64px] ${isLeadsOpen ? 'invisible' : 'visible'}`}>
          {/* WhatsApp Number Check Result */}
          {whatsappCheckResult &&
            whatsappCheckResult.isOnWhatsApp &&
            filteredConversations.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 border-b border-border/50 bg-muted/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {whatsappCheckResult.lead?.companyName ||
                        whatsappCheckResult.phoneNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {whatsappCheckResult.phoneNumber}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: isCreating ? 1 : 1.05 }}
                    whileTap={{ scale: isCreating ? 1 : 0.95 }}
                    onClick={handleStartChat}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

          {/* List Items */}
          {filteredConversations.map((conv, i) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(conv.id)}
              className={`w-full px-4 py-3 border-b border-border/50 text-left transition-colors hover:bg-muted/50 ${selected === conv.id ? "bg-muted" : ""
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-lg">
                    {conv.companyName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {conv.companyName}
                    </p>

                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {conv.lastActivity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      {getConversationTick(
                        conv.lastMessageDirection,
                        conv.lastMessageStatus,
                      )}

                      <p
                        className={`text-sm truncate ${conv.hasUnread
                          ? "text-foreground"
                          : "text-muted-foreground"
                          }`}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.lastMessageDirection === "inbound" &&
                      conv.unreadCount! > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 px-2 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}

          {/* No results message */}
          {searchQuery &&
            filteredConversations.length === 0 &&
            !whatsappCheckResult &&
            !isChecking && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No conversations found
                </p>
              </div>
            )}
        </div>

        {/* COLLAPSED FOOTER (Visible when drawer closed) */}
        {!isLeadsOpen && assignedLeads.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[64px] border-t border-border bg-card z-10">
            <button
              onClick={() => setIsLeadsOpen(true)}
              className="w-full h-full flex items-center justify-between px-4 hover:bg-muted/50 transition-colors cursor-pointer outline-none"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Assigned to you
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                  {assignedLeads.filter(l => !conversations.some(c => c.phone?.replace(/\D/g, "") === l.mobile_number?.replace(/\D/g, "") || c.phone?.replace(/\D/g, "") === (l as any).phoneNumber?.replace(/\D/g, ""))).length}
                </span>
              </div>
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* EXPANDED DRAWER (Slide Up) */}
        <AnimatePresence>
          {isLeadsOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,     // Increased damping for less "pop" / bounce
                stiffness: 300,  // Keep stiffness
                mass: 0.8        // Slightly lighter feel
              }}
              className="absolute inset-0 bg-background z-20 flex flex-col shadow-[-5px_0_15px_rgba(0,0,0,0.1)]" // Added shadow
            >
              {/* Drawer Header - Clickable to Close */}
              <div
                onClick={() => setIsLeadsOpen(false)}
                className="flex-none h-[64px] border-b border-border flex items-center justify-between px-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Assigned to you
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    {displayedLeads.length}
                  </span>
                </div>
                {/* Button visual only since parent handles click */}
                <div className="p-2 rounded-full">
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Drawer Search */}
              <div className="flex-none px-3 py-2 border-b border-border bg-card">
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search assigned leads..."
                    value={leadsSearchQuery}
                    onChange={(e) => setLeadsSearchQuery(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              </div>

              {/* Leads List */}
              <div className="flex-1 overflow-y-auto">
                {displayedLeads.map((lead) => {
                  const phone = lead.mobile_number || (lead as any).phoneNumber;
                  const name = lead.company_name || (lead as any).companyName;

                  return (
                    <motion.button
                      key={lead.id}
                      layout
                      onClick={() => handleLeadClick(lead)}
                      disabled={creatingLeadId === lead.id}
                      className="w-full px-4 py-3 border-b border-border/50 text-left transition-colors hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {creatingLeadId === lead.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {name || phone}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Start conversation
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                {displayedLeads.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No assigned leads found.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
