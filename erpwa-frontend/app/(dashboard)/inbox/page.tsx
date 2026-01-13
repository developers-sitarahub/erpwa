"use client"

import { useState } from "react"
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

interface Message {
  id: string
  text: string
  sender: "customer" | "executive"
  timestamp: string
  status?: "sent" | "delivered" | "read" | "failed"
  type?: "text" | "template" | "media" | "document"
  isStarred?: boolean
}

interface Conversation {
  id: string
  customerName: string
  phone: string
  avatar?: string
  messages: Message[]
  lastMessage: string
  lastActivity: string
  unreadCount?: number
  isPinned?: boolean
  tags?: string[]
  businessHoursRemaining?: string
}

function ConversationList({
  conversations,
  selected,
  onSelect,
}: {
  conversations: Conversation[]
  selected: string
  onSelect: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

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
            className={`w-full px-4 py-3 border-b border-border/50 text-left transition-colors hover:bg-muted/50 ${selected === conv.id ? "bg-muted" : ""
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-lg">
                  {conv.customerName.charAt(0).toUpperCase()}
                </div>
                {conv.unreadCount && conv.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-white font-semibold">
                    {conv.unreadCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-medium text-foreground truncate">{conv.customerName}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conv.lastActivity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                  {conv.isPinned && <Star className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                </div>
                {conv.tags && conv.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {conv.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-border hover:bg-muted whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ChatArea({ conversation, onBack }: { conversation: Conversation; onBack?: () => void }) {
  const [inputValue, setInputValue] = useState("")

  const getMessageStatusIcon = (status?: string) => {
    if (!status) return null
    if (status === "sent") return <Check className="w-4 h-4" />
    if (status === "delivered") return <CheckCheck className="w-4 h-4" />
    if (status === "read") return <CheckCheck className="w-4 h-4 text-blue-500" />
    if (status === "failed") return <AlertCircle className="w-4 h-4 text-destructive" />
    return null
  }

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
          <button onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        {/* Updated avatar to use primary color */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
          {conversation.customerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-medium text-foreground">{conversation.customerName}</h3>
          <p className="text-xs text-muted-foreground">{conversation.phone}</p>
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

      {/* Messages Area - WhatsApp style with proper bubbles */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {conversation.messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-end gap-2 ${msg.sender === "executive" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group relative max-w-md px-3 py-2 shadow-sm ${msg.sender === "executive"
                  ? "bg-primary/10 border border-primary/20 dark:bg-primary/20 rounded-lg rounded-br-none"
                  : "bg-card border border-border rounded-lg rounded-bl-none"
                  }`}
              >
                {/* Message text */}
                <p className="text-sm text-foreground break-words leading-relaxed">{msg.text}</p>

                {/* Timestamp and status - WhatsApp style */}
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  {msg.sender === "executive" && (
                    <span className={msg.status === "read" ? "text-blue-500" : "text-muted-foreground"}>
                      {getMessageStatusIcon(msg.status)}
                    </span>
                  )}
                  {msg.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                </div>

                {/* Message options on hover */}
                <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-lg shadow-lg border border-border flex">
                  <button className="p-1.5 hover:bg-muted rounded-l-lg">
                    <Archive className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 hover:bg-muted">
                    <Star className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 hover:bg-muted rounded-r-lg">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Section */}
      <div className="relative z-10 flex-shrink-0 bg-card border-t border-border">
        {/* 24-Hour Window Warning */}
        {conversation.businessHoursRemaining && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2.5 flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400">
              24-hour message window expires in {conversation.businessHoursRemaining}
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
                    setInputValue("")
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
                onClick={() => setInputValue("")}
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

          {/* Quick replies */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {["Hello!", "Thank you", "I'll get back to you"].map((reply) => (
              <button
                key={reply}
                className="text-xs bg-muted/50 px-3 py-1.5 rounded-full border border-border hover:bg-muted whitespace-nowrap"
                onClick={() => setInputValue(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState("1")
  const [showChat, setShowChat] = useState(false)

  const conversations: Conversation[] = [
    {
      id: "1",
      customerName: "John Smith",
      phone: "+1 (555) 123-4567",
      lastMessage: "Hi, I'm interested in your product",
      lastActivity: "2:30 PM",
      unreadCount: 2,
      tags: ["Hot Lead"],
      businessHoursRemaining: "4 hours",
      messages: [
        { id: "1", text: "Hi, I'm interested in your product", sender: "customer", timestamp: "10:30 AM" },
        {
          id: "2",
          text: "Great! I'd be happy to help. What would you like to know?",
          sender: "executive",
          timestamp: "10:32 AM",
          status: "read",
        },
        { id: "3", text: "What are the pricing options?", sender: "customer", timestamp: "10:35 AM" },
        {
          id: "4",
          text: "We have three plans available. Let me send you the details.",
          sender: "executive",
          timestamp: "10:37 AM",
          status: "delivered",
        },
      ],
    },
    {
      id: "2",
      customerName: "Sarah Johnson",
      phone: "+1 (555) 234-5678",
      lastMessage: "Thanks for the quick response!",
      lastActivity: "1:15 PM",
      isPinned: true,
      tags: ["Premium"],
      messages: [
        { id: "1", text: "Thanks for the quick response!", sender: "customer", timestamp: "2:15 PM" },
        { id: "2", text: "You're welcome! Happy to help.", sender: "executive", timestamp: "2:16 PM", status: "read" },
      ],
    },
    {
      id: "3",
      customerName: "Michael Chen",
      phone: "+1 (555) 345-6789",
      lastMessage: "Do you have this item in stock?",
      lastActivity: "12:00 PM",
      unreadCount: 1,
      messages: [{ id: "1", text: "Do you have this item in stock?", sender: "customer", timestamp: "12:00 PM" }],
    },
  ]

  const currentConversation = conversations.find((c) => c.id === selectedConversation)

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id)
    setShowChat(true)
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
        {currentConversation && <ChatArea conversation={currentConversation} onBack={() => setShowChat(false)} />}
      </div>
    </div>
  )
}
