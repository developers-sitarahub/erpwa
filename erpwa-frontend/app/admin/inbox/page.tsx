"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Phone, MoreVertical, ArrowLeft, CheckCheck, Clock, User, Tag, MessageSquare } from "lucide-react"

interface Conversation {
  id: string
  leadName: string
  phone: string
  assignedTo: string
  leadLastMessage: string
  salesLastMessage: string
  lastActivity: string
  status: "Active" | "Qualified" | "Converted" | "New"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500"
      case "Active":
        return "bg-primary"
      case "Qualified":
        return "bg-yellow-500"
      case "Converted":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="w-full md:w-96 bg-card border-r border-border flex flex-col h-full">
      <div className="bg-card p-3 flex items-center justify-between border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">All Leads</h2>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full"
        >
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      <div className="px-3 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search leads..."
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
                  {conv.leadName.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor(conv.status)} rounded-full border-2 border-white dark:border-[#111b21]`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-medium text-foreground truncate">{conv.leadName}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conv.lastActivity}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">{conv.assignedTo}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.leadLastMessage}</p>
                {conv.tags && conv.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {conv.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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

      <div className="relative z-10 bg-card px-4 py-2.5 flex items-center justify-between border-b border-border flex-shrink-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          {/* Updated avatar to use primary color */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
            {conversation.leadName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{conversation.leadName}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {conversation.phone} • Assigned to {conversation.assignedTo}
            </p>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{conversation.status}</span>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area - Admin view with labeled messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
        {/* Lead's Message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span>Lead's Last Message</span>
          </div>
          <div className="flex justify-start">
            {/* Updated lead message bubble to theme colors */}
            <div className="max-w-md px-3 py-2 bg-card border border-border rounded-lg rounded-bl-none shadow-sm">
              <p className="text-sm text-foreground break-words leading-relaxed">{conversation.leadLastMessage}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{conversation.lastActivity}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sales' Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
            <span>Sales' Last Message by {conversation.assignedTo}</span>
            <User className="w-3 h-3" />
          </div>
          <div className="flex justify-end">
            {/* Updated sales message bubble to primary color */}
            <div className="max-w-md px-3 py-2 bg-primary/10 border border-primary/20 dark:bg-primary/20 rounded-lg rounded-br-none shadow-sm">
              <p className="text-sm text-foreground break-words leading-relaxed">{conversation.salesLastMessage}</p>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <span className="text-[10px] text-muted-foreground">Just now</span>
                <CheckCheck className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

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

      {/* Admin Info Footer */}
      <div className="relative z-10 flex-shrink-0 bg-card border-t border-border px-4 py-3">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Tags: {conversation.tags?.join(", ") || "None"}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>Status: {conversation.status}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{conversation.phone}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminInbox() {
  const [selectedConversation, setSelectedConversation] = useState("1")
  const [showChat, setShowChat] = useState(false)

  const conversations: Conversation[] = [
    {
      id: "1",
      leadName: "Acme Corporation",
      phone: "+1 (555) 123-4567",
      assignedTo: "John Doe",
      leadLastMessage: "Hi, we are interested in your enterprise plan. Can you provide more details?",
      salesLastMessage: "Thank you for your interest! I'll schedule a call to discuss your requirements.",
      lastActivity: "2 min ago",
      status: "Active",
      tags: ["Enterprise", "Hot Lead"],
      businessHoursRemaining: "4 hours",
    },
    {
      id: "2",
      leadName: "Tech Startup Inc",
      phone: "+1 (555) 234-5678",
      assignedTo: "Sarah Smith",
      leadLastMessage: "What are your pricing options for small teams?",
      salesLastMessage: "We offer flexible pricing based on your needs. Let me send you our pricing sheet.",
      lastActivity: "15 min ago",
      status: "Active",
      tags: ["Startup"],
    },
    {
      id: "3",
      leadName: "Global Solutions Ltd",
      phone: "+1 (555) 345-6789",
      assignedTo: "Mike Johnson",
      leadLastMessage: "Do you offer integrations with Salesforce?",
      salesLastMessage: "Yes, we have 50+ integrations including Salesforce. I can show you a demo.",
      lastActivity: "1 hour ago",
      status: "Qualified",
      tags: ["Integration"],
    },
    {
      id: "4",
      leadName: "Creative Agency Co",
      phone: "+1 (555) 456-7890",
      assignedTo: "Emma Wilson",
      leadLastMessage: "Can we customize the dashboard for our brand?",
      salesLastMessage: "Our system is fully customizable to match your brand identity.",
      lastActivity: "3 hours ago",
      status: "Converted",
      tags: ["Premium", "Agency"],
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
