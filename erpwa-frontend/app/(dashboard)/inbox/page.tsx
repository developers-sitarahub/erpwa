"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Star,
  Archive,
  Trash2,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { getSocket, connectSocket } from "@/lib/socket"
import { useAuth } from "@/context/authContext"

interface Message {
  id: string
  content: string
  direction: "inbound" | "outbound"
  messageType: string
  whatsappMessageId?: string
  status?: string
  createdAt: string
  media?: Array<{
    mediaUrl: string
    mimeType: string
    caption?: string
  }>
}

interface Conversation {
  id: string
  lead: {
    id: string
    phoneNumber: string
    companyName?: string
  }
  lastMessageAt: string
  messages: Message[]
  sessionExpiresAt?: string
  isOpen: boolean
}

interface InboxConversation extends Conversation {
  unreadCount?: number
}

function ConversationList({
  conversations,
  selected,
  onSelect,
}: {
  conversations: InboxConversation[]
  selected: string
  onSelect: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const getLastMessageText = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "No messages"
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.media && lastMsg.media.length > 0) {
      return `📎 ${lastMsg.messageType}`
    }
    return lastMsg.content || "No content"
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

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
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Messages from your WhatsApp will appear here</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
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
                    {(conv.lead.companyName || conv.lead.phoneNumber).charAt(0).toUpperCase()}
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-white font-semibold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-base font-medium text-foreground truncate">
                      {conv.lead.companyName || conv.lead.phoneNumber}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {getTimeAgo(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate pr-2">
                      {getLastMessageText(conv.messages)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}

function ChatArea({
  conversationId,
  onBack
}: {
  conversationId: string
  onBack?: () => void
}) {
  const [inputValue, setInputValue] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversation()
  }, [conversationId])

  useEffect(() => {
    const socket = getSocket()

    // Join conversation room
    socket.emit("join-conversation", conversationId)

    // Listen for new messages
    socket.on("message:new", (newMessage: any) => {
      console.log("📥 New message received:", newMessage)
      setConversation((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: newMessage.id,
              content: newMessage.text || `[${newMessage.mediaUrl ? 'media' : 'message'}]`,
              direction: newMessage.sender === "customer" ? "inbound" : "outbound",
              messageType: newMessage.mediaUrl ? "media" : "text",
              whatsappMessageId: newMessage.whatsappMessageId,
              status: "delivered",
              createdAt: newMessage.timestamp,
              media: newMessage.mediaUrl
                ? [{ mediaUrl: newMessage.mediaUrl, mimeType: newMessage.mimeType || "", caption: newMessage.caption }]
                : [],
            },
          ],
        }
      })
    })

    // Listen for message status updates
    socket.on("message:status", ({ whatsappMessageId, status }: any) => {
      console.log("📊 Message status update:", whatsappMessageId, status)
      setConversation((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.whatsappMessageId === whatsappMessageId ? { ...msg, status } : msg
          ),
        }
      })
    })

    return () => {
      socket.emit("leave-conversation", conversationId)
      socket.off("message:new")
      socket.off("message:status")
    }
  }, [conversationId])

  const loadConversation = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get(`/inbox/${conversationId}`)
      setConversation(data)
    } catch (error) {
      console.error("Failed to load conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    try {
      // TODO: Implement send message API
      setInputValue("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const getMessageStatusIcon = (status?: string) => {
    if (!status) return null
    if (status === "sent") return <Check className="w-4 h-4" />
    if (status === "delivered") return <CheckCheck className="w-4 h-4" />
    if (status === "read") return <CheckCheck className="w-4 h-4 text-blue-500" />
    if (status === "failed") return <AlertCircle className="w-4 h-4 text-destructive" />
    return null
  }

  const getSessionRemaining = () => {
    if (!conversation?.sessionExpiresAt) return null
    const expires = new Date(conversation.sessionExpiresAt)
    const now = new Date()
    if (expires <= now) return null

    const diff = expires.getTime() - now.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    )
  }

  const sessionRemaining = getSessionRemaining()

  return (
    <div className="flex-1 flex flex-col bg-muted/20 relative h-full overflow-hidden">
      {/* WhatsApp background pattern */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-5"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Header */}
      <div className="relative z-10 bg-card px-4 py-2.5 flex items-center justify-between border-b border-border flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="md:hidden mr-2">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
            {(conversation.lead.companyName || conversation.lead.phoneNumber).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {conversation.lead.companyName || conversation.lead.phoneNumber}
            </h3>
            <p className="text-xs text-muted-foreground">{conversation.lead.phoneNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full"
          >
            <Video className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full"
          >
            <Phone className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {conversation.messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-end gap-2 ${msg.direction === "outbound" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`group relative max-w-md px-3 py-2 shadow-sm ${msg.direction === "outbound"
                  ? "bg-primary/10 border border-primary/20 dark:bg-primary/20 rounded-lg rounded-br-none"
                  : "bg-card border border-border rounded-lg rounded-bl-none"
                  }`}
              >
                {/* Message text */}
                <p className="text-sm text-foreground break-words leading-relaxed">{msg.content}</p>

                {/* Timestamp and status */}
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.direction === "outbound" && (
                    <span className={msg.status === "read" ? "text-blue-500" : "text-muted-foreground"}>
                      {getMessageStatusIcon(msg.status)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex-shrink-0 bg-card border-t border-border">
        {/* 24-Hour Window Warning */}
        {sessionRemaining && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2.5 flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400">
              24-hour message window expires in {sessionRemaining}
            </span>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Smile className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            <div className="flex-1 bg-muted/50 rounded-lg px-4 py-2.5">
              <input
                type="text"
                placeholder="Type a message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    sendMessage()
                  }
                }}
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {inputValue.trim() ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-full flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string>("")
  const [showChat, setShowChat] = useState(false)
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Connect socket
    connectSocket()
    loadInbox()

    // Listen for inbox updates
    const socket = getSocket()
    socket.on("inbox:update", ({ conversationId }: any) => {
      console.log("🔔 Inbox update for conversation:", conversationId)
      loadInbox()
    })

    return () => {
      socket.off("inbox:update")
    }
  }, [])

  const loadInbox = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get("/inbox")
      setConversations(data)

      // Auto-select first conversation
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load inbox:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id)
    setShowChat(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading inbox...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className={`${showChat ? "hidden md:block" : "block"} w-full md:w-auto h-full`}>
        <ConversationList
          conversations={conversations}
          selected={selectedConversation}
          onSelect={handleSelectConversation}
        />
      </div>
      <div className={`${showChat ? "block" : "hidden md:block"} flex-1 h-full`}>
        {selectedConversation ? (
          <ChatArea conversationId={selectedConversation} onBack={() => setShowChat(false)} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20 h-full">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
