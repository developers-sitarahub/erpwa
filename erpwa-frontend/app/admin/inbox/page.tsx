"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { getSocket, connectSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MessageSquareIcon,
} from "lucide-react";
import Image from "next/image";

/* =======================
   UI MODELS (UNCHANGED)
======================= */

interface Message {
  id: string;
  whatsappMessageId?: string;
  replyToMessageId?: string;

  // 👇 ADD THIS (frontend only)
  replyTo?: {
    sender: "customer" | "executive";
    text?: string;
    mediaUrl?: string;
    mimeType?: string;
    caption?: string;
  };

  text?: string;
  mediaUrl?: string; // image / video
  mimeType?: string; // image/jpeg, video/mp4
  caption?: string;
  sender: "customer" | "executive";
  timestamp: string;
  status?: "sent" | "delivered" | "read" | "failed";
}

interface Conversation {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  lastActivity: string;

  // ✅ NEW (required)
  lastMessageDirection?: "inbound" | "outbound";
  lastMessageStatus?: "sent" | "delivered" | "read" | "failed";
  unreadCount?: number;

  hasUnread?: boolean;
  isPinned?: boolean;
  businessHoursRemaining?: string;
}

/* =======================
   BACKEND MODELS
======================= */

interface ApiConversation {
  id: string;
  lead: {
    name: string | null;
    phoneNumber: string;
  };
  messages: {
    content: string;
    direction: "inbound" | "outbound";
    status?: "sent" | "delivered" | "read" | "failed" | "received";
    createdAt: string;
  }[];
  lastMessageAt: string;
}

interface ApiMessage {
  id: string;
  whatsappMessageId?: string;
  replyToMessageId?: string;
  content: string;
  direction: "inbound" | "outbound";
  status?: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

/* =======================
   CONVERSATION LIST (UI UNCHANGED)
======================= */

const getConversationTick = (
  direction?: "inbound" | "outbound",
  status?: "sent" | "delivered" | "read" | "failed"
) => {
  // 🔒 HARD RULE: ticks ONLY for outbound
  if (direction !== "outbound") return null;

  switch (status) {
    case "sent":
      return <Check className="w-4 h-4 text-muted-foreground" />;
    case "delivered":
      return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
    case "read":
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    case "failed":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return null;
  }
};

function ConversationList({
  conversations,
  selected,
  onSelect,
}: {
  conversations: Conversation[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full md:w-96 bg-card border-r border-border flex flex-col h-full">
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

      <div className="px-3 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        {conversations.map((conv, i) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(conv.id)}
            className={`w-full px-4 py-3 border-b border-border/50 text-left transition-colors hover:bg-muted/50 ${
              selected === conv.id ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-lg">
                  {conv.customerName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p
                    className={`text-base truncate ${
                      conv.hasUnread
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {conv.customerName}
                  </p>

                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {conv.lastActivity}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* LEFT: tick + message text */}
                  <div className="flex items-center gap-1 min-w-0">
                    {getConversationTick(
                      conv.lastMessageDirection,
                      conv.lastMessageStatus
                    )}

                    <p
                      className={`text-sm truncate ${
                        conv.hasUnread
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* RIGHT: unread badge (ONLY if last message is inbound) */}
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
      </div>
    </div>
  );
}

function ChatArea({
  conversation,
  messages,
  setMessages,
  readSentRef,
  onBack,
}: {
  conversation: Conversation;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readSentRef: React.MutableRefObject<Set<string>>;
  onBack?: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    message: Message;
    rect: DOMRect;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const copyMessage = async (message: Message): Promise<boolean> => {
    try {
      if (message.text) {
        await navigator.clipboard.writeText(message.text);
        return true;
      }

      if (message.caption) {
        await navigator.clipboard.writeText(message.caption);
        return true;
      }

      if (message.mediaUrl) {
        await navigator.clipboard.writeText(message.mediaUrl);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const getMessageStatusIcon = (status?: string) => {
    if (!status) return null;
    if (status === "sent") return <Check className="w-4 h-4" />;
    if (status === "delivered") return <CheckCheck className="w-4 h-4" />;
    if (status === "read")
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (status === "failed")
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    return null;
  };

  useEffect(() => {
    if (!conversation?.id) return;

    const socket = getSocket();

    const maybeMarkRead = async () => {
      if (document.visibilityState !== "visible") return;
      if (readSentRef.current.has(conversation.id)) return;

      // ✅ ALWAYS notify backend when chat is opened
      readSentRef.current.add(conversation.id);

      try {
        await api.post(`/inbox/${conversation.id}/mark-read`);
      } catch {
        readSentRef.current.delete(conversation.id);
      }
    };

    socket.emit("join-conversation", conversation.id);

    // Run once after render
    requestAnimationFrame(maybeMarkRead);

    // Re-run when tab becomes visible
    document.addEventListener("visibilitychange", maybeMarkRead);

    return () => {
      socket.emit("leave-conversation", conversation.id);
      document.removeEventListener("visibilitychange", maybeMarkRead);
    };
  }, [conversation.id]);

  useEffect(() => {
    if (!conversation?.id) return;
    if (document.visibilityState !== "visible") return;

    if (!readSentRef.current.has(conversation.id)) {
      requestAnimationFrame(async () => {
        try {
          readSentRef.current.add(conversation.id);
          await api.post(`/inbox/${conversation.id}/mark-read`);
        } catch {
          readSentRef.current.delete(conversation.id);
        }
      });
    }
  }, [messages.length, conversation.id]);

  useEffect(() => {
    if (!conversation?.id) return;

    const socket = getSocket();

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });

      if (msg.sender === "customer" && document.visibilityState === "visible") {
        // allow read receipt to be sent again
        readSentRef.current.delete(conversation.id);
      }
    };

    const STATUS_PRIORITY = {
      failed: 0,
      sent: 1,
      delivered: 2,
      read: 3,
    };

    const handleStatusUpdate = ({
      whatsappMessageId,
      status,
    }: {
      whatsappMessageId: string;
      status?: Message["status"];
    }) => {
      if (!status) return; // ✅ HARD GUARD

      setMessages((prev) =>
        prev.map((m) => {
          if (m.whatsappMessageId !== whatsappMessageId) return m;
          if (!m.status) return { ...m, status };

          if (STATUS_PRIORITY[m.status] >= STATUS_PRIORITY[status]) {
            return m; // ⛔ ignore downgrade
          }

          return { ...m, status };
        })
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleStatusUpdate);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleStatusUpdate);
    };
  }, [conversation.id, setMessages]);

  /* ===============================
     SEND MESSAGE → BACKEND
     (NO UI CHANGE)
  =============================== */

  // 👇 AUTO SCROLL TO BOTTOM (WhatsApp behavior)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (replyTo) {
      // small timeout ensures DOM is ready (important with animations)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [replyTo]);

  const sendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const text = inputValue.trim();
    setInputValue("");
    setSending(true);

    try {
      await api.post("/vendor/whatsapp/send-message", {
        conversationId: conversation.id,
        text,
        replyToMessageId: replyTo?.whatsappMessageId,
      });

      setReplyTo(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      console.error("Failed to send message", err);
      // optional: toast / snackbar
    } finally {
      setSending(false);
    }
  };

  const getDateLabel = (iso: string) => {
    const msgDate = new Date(iso);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return msgDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isNewDay = (a: string, b: string) =>
    new Date(a).toDateString() !== new Date(b).toDateString();

  return (
    <div className="flex-1 flex flex-col bg-muted/20 relative h-full overflow-hidden">
      {/* Header */}
      <div className="relative z-10 bg-card px-4 py-2.5 flex items-center justify-between border-b border-border flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
          {conversation.customerName?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div>
          <h3 className="font-medium text-foreground">
            {conversation.customerName}
          </h3>
          <p className="text-xs text-muted-foreground">{conversation.phone}</p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button className="p-2 rounded-full">
            <Video className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button className="p-2 rounded-full">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button className="p-2 rounded-full">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages.map((msg, i) => {
            const showDateSeparator =
              i === 0 || isNewDay(messages[i - 1].timestamp, msg.timestamp);

            const repliedMessage =
              msg.replyTo ??
              messages.find(
                (m) => m.whatsappMessageId === msg.replyToMessageId
              );

            return (
              <div key={msg.id}>
                {/* 📅 DATE SEPARATOR (WhatsApp style) */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground shadow-sm">
                      {getDateLabel(msg.timestamp)}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-end gap-2 ${
                    msg.sender === "executive" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`group relative max-w-md px-3 py-2 shadow-sm ${
                      msg.sender === "executive"
                        ? "bg-primary/10 border border-primary/20 rounded-lg rounded-br-none"
                        : "bg-card border border-border rounded-lg rounded-bl-none"
                    }`}
                  >
                    {(msg.replyTo || repliedMessage) && (
                      <div className="mb-1 px-2 py-1 border-l-4 border-primary bg-muted/50 rounded text-xs text-muted-foreground">
                        <div className="font-medium">
                          {(msg.replyTo ?? repliedMessage)?.sender ===
                          "executive"
                            ? "You"
                            : conversation.customerName}
                        </div>
                        <div className="truncate">
                          {(msg.replyTo ?? repliedMessage)?.text ||
                            ((msg.replyTo ?? repliedMessage)?.mediaUrl
                              ? "Media message"
                              : "")}
                        </div>
                      </div>
                    )}

                    {/* 🖼 IMAGE */}
                    {/* 🖼 IMAGE (WhatsApp style) */}
                    {msg.mediaUrl && msg.mimeType?.startsWith("image/") && (
                      <div className="mb-1">
                        <div
                          className="relative w-[320px] max-w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => window.open(msg.mediaUrl, "_blank")}
                        >
                          <Image
                            src={msg.mediaUrl}
                            alt="Image"
                            fill
                            sizes="(max-width: 768px) 90vw, 320px"
                            className="object-cover"
                          />
                        </div>

                        {msg.caption && (
                          <p className="mt-1 text-sm text-foreground">
                            {msg.caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 🎥 VIDEO (WhatsApp style) */}
                    {msg.mediaUrl && msg.mimeType?.startsWith("video/") && (
                      <div className="mb-1">
                        <div className="w-[320px] max-w-full rounded-lg overflow-hidden bg-black">
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="w-full h-auto"
                          />
                        </div>

                        {msg.caption && (
                          <p className="mt-1 text-sm text-foreground">
                            {msg.caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 🎵 AUDIO (WhatsApp style) */}
                    {msg.mediaUrl && msg.mimeType?.startsWith("audio/") && (
                      <div className="mb-1 w-[260px] max-w-full">
                        <audio
                          src={msg.mediaUrl}
                          controls
                          className="w-full h-10"
                        />

                        {msg.caption && (
                          <p className="mt-1 text-sm text-foreground">
                            {msg.caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 📄 DOCUMENT (WhatsApp style) */}
                    {msg.mediaUrl &&
                      msg.mimeType &&
                      !msg.mimeType.startsWith("image/") &&
                      !msg.mimeType.startsWith("video/") &&
                      !msg.mimeType.startsWith("audio/") && (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-[260px] max-w-full flex items-center gap-3 p-3 rounded-lg border bg-muted hover:bg-muted/70"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            📄
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {msg.mediaUrl.split("/").pop()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Document
                            </p>
                          </div>
                        </a>
                      )}

                    {/* 📝 TEXT MESSAGE */}
                    {msg.text && (
                      <p className="text-sm text-foreground break-words leading-relaxed">
                        {msg.text}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {msg.sender === "executive" && (
                        <span
                          className={
                            msg.status === "read"
                              ? "text-blue-500"
                              : "text-muted-foreground"
                          }
                        >
                          {getMessageStatusIcon(msg.status)}
                        </span>
                      )}
                    </div>

                    <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();

                          setActionMenu({
                            message: msg,
                            rect,
                          });
                        }}
                        className="p-1.5 rounded-full bg-card border shadow hover:bg-muted"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* 👇 Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="relative z-10 flex-shrink-0 bg-card border-t border-border">
        {conversation.businessHoursRemaining && (
          <div className="bg-yellow-50 border-b px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">
              24-hour message window expires in{" "}
              {conversation.businessHoursRemaining}
            </span>
          </div>
        )}

        {replyTo && (
          <div className="px-4 py-2 bg-muted/50 border-l-4 border-primary flex justify-between items-center">
            <div className="text-xs">
              <div className="font-medium">
                {replyTo.sender === "executive"
                  ? "You"
                  : conversation.customerName}
              </div>
              <div className="truncate max-w-xs">{replyTo.text}</div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <motion.button className="p-2 rounded-full hover:bg-muted">
                <Smile className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              <motion.button className="p-2 rounded-full hover:bg-muted">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            <div className="flex-1 bg-muted/50 rounded-lg px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="bg-transparent text-sm outline-none w-full"
              />
            </div>

            {inputValue.trim() ? (
              <motion.button
                onClick={sendMessage}
                className="bg-primary text-white p-2.5 rounded-full"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button className="p-2 rounded-full hover:bg-muted">
                <Mic className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {actionMenu && (
          <>
            {/* Click outside */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActionMenu(null)}
            />

            {(() => {
              const { rect } = actionMenu;

              const menuHeight = 160;
              const menuWidth = 192;

              const isNearBottom =
                rect.bottom + menuHeight > window.innerHeight;

              const top = isNearBottom
                ? rect.top - menuHeight - 8
                : rect.bottom + 8;

              const isIncoming = actionMenu.message.sender === "customer";

              const left = isIncoming
                ? // LEFT-SIDE MESSAGE → open menu on RIGHT
                  Math.min(window.innerWidth - menuWidth - 12, rect.left)
                : // RIGHT-SIDE MESSAGE → open menu on LEFT
                  Math.max(12, rect.right - menuWidth);

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed z-50 w-48 bg-card rounded-xl shadow-lg overflow-hidden"
                  style={{ top, left }}
                >
                  <ActionButton
                    label="Reply"
                    onClick={() => {
                      setReplyTo(actionMenu.message);
                      setActionMenu(null);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                  />
                  <ActionButton
                    label="Copy"
                    onClick={async () => {
                      const success = await copyMessage(actionMenu.message);

                      setActionMenu(null);

                      if (success) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      }
                    }}
                  />
                  <ActionButton label="Delete" destructive />
                </motion.div>
              );
            })()}
          </>
        )}
      </AnimatePresence>
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30
               bg-black/85 text-white text-sm px-4 py-2
               rounded-full shadow-md"
        >
          Copied
        </motion.div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors
        ${destructive ? "text-destructive" : "text-foreground"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
      `}
    >
      {label}
    </button>
  );
}

const mapApiConversation = (c: ApiConversation): Conversation => {
  const lastMsg = c.messages?.[c.messages.length - 1];

  const unreadCount =
    c.messages?.filter((m) => m.direction === "inbound" && m.status !== "read")
      .length ?? 0;

  return {
    id: c.id,
    customerName: c.lead.name || c.lead.phoneNumber,
    phone: c.lead.phoneNumber,
    lastMessage: (() => {
      if (!lastMsg) return "";

      if (lastMsg.content?.startsWith("[image")) return "📷 Photo";
      if (lastMsg.content?.startsWith("[video")) return "🎥 Video";
      if (lastMsg.content?.startsWith("[audio")) return "🎵 Audio";
      if (lastMsg.content?.startsWith("[document")) return "📄 Document";

      return lastMsg.content;
    })(),
    lastActivity: new Date(c.lastMessageAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    lastMessageDirection: lastMsg?.direction,
    lastMessageStatus: lastMsg?.status,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
};

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [showChat, setShowChat] = useState(false);
  const readSentRef = useRef<Set<string>>(new Set());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 🔥 2️⃣ THEN LISTEN FOR INBOX UPDATES
  useEffect(() => {
    const socket = getSocket();

    const handleInboxUpdate = async () => {
      try {
        const res = await api.get<ApiConversation[]>("/inbox");

        const mapped = res.data.map(mapApiConversation);

        setConversations(mapped);
      } catch (err) {
        console.error("Inbox refresh failed", err);
      }
    };

    socket.on("inbox:update", handleInboxUpdate);

    return () => {
      socket.off("inbox:update", handleInboxUpdate);
    };
  }, []);

  useEffect(() => {
    connectSocket(); // 🔥 AUTHENTICATED CONNECT

    const socket = getSocket();

    socket.on("connect", async () => {
      const res = await api.get<ApiConversation[]>("/inbox");
      setConversations(res.data.map(mapApiConversation));
      console.log("✅ SOCKET CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ SOCKET CONNECT ERROR:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ SOCKET DISCONNECTED:", reason);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, []);

  /* =======================
     SELECT CONVERSATION
  ======================= */
  const handleSelectConversation = async (id: string) => {
    readSentRef.current.delete(id);

    setMessages([]);
    setSelectedConversation(id);
    setShowChat(true);

    try {
      const res = await api.get<{ messages: ApiMessage[] }>(`/inbox/${id}`);

      const mappedMessages: Message[] = res.data.messages.map((m: any) => {
        const media = m.media?.[0]; // WhatsApp = 1 media per message

        return {
          id: m.id,
          whatsappMessageId: m.whatsappMessageId,
          replyToMessageId: m.replyToMessageId,

          // TEXT
          text: media ? undefined : m.content,

          // MEDIA
          mediaUrl: media?.mediaUrl,
          mimeType: media?.mimeType,
          caption: media?.caption,

          sender: m.direction === "outbound" ? "executive" : "customer",
          timestamp: m.createdAt,
          status: m.status ?? "delivered",
        };
      });

      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        mappedMessages.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    } catch (err) {
      console.error("Failed to load conversation", err);
      setMessages([]);
    }
  };

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div
        className={`${
          showChat ? "hidden md:block" : "block"
        } w-full md:w-auto h-full`}
      >
        <ConversationList
          conversations={conversations}
          selected={selectedConversation}
          onSelect={handleSelectConversation}
        />
      </div>
      <div
        className={`${showChat ? "block" : "hidden md:block"} flex-1 h-full`}
      >
        {currentConversation ? (
          <ChatArea
            conversation={currentConversation}
            messages={messages}
            setMessages={setMessages}
            readSentRef={readSentRef}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquareIcon />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a chat from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
