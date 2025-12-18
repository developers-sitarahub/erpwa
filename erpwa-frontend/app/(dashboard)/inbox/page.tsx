"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/input"
import { AlertCircle, Send, Search, Phone, MoreVertical } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "customer" | "executive"
  timestamp: string
  status?: "sent" | "delivered" | "read"
}

interface Conversation {
  id: string
  customerName: string
  phone: string
  assignedExecutive: string
  messages: Message[]
  lastActivity: string
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
  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Chats</h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <MoreVertical className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>
        <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search chats"
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv, i) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ backgroundColor: "var(--muted)" }}
            onClick={() => onSelect(conv.id)}
            className={`w-full px-4 py-3 border-b border-border text-left transition-colors ${
              selected === conv.id ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <motion.div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex-shrink-0 flex items-center justify-center text-white font-semibold">
                {conv.customerName.charAt(0)}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{conv.customerName}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{conv.lastActivity}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.phone}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ChatArea({ conversation }: { conversation: Conversation }) {
  const [inputValue, setInputValue] = useState("")

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border p-4 bg-card flex items-center justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="font-semibold text-foreground">{conversation.customerName}</h3>
          <p className="text-xs text-muted-foreground">Last activity: {conversation.lastActivity}</p>
        </motion.div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Phone className="w-5 h-5 text-foreground" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <MoreVertical className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {conversation.messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${msg.sender === "executive" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                msg.sender === "executive"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-secondary text-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm break-words">{msg.text}</p>
              <div className="flex items-center gap-1 mt-1 text-xs opacity-70 justify-end">
                <span>{msg.timestamp}</span>
                {msg.sender === "executive" && msg.status && <span>{msg.status === "read" ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-t border-border bg-destructive/10 px-4 py-3 flex items-center gap-2"
      >
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="text-xs text-destructive">24-hour message window expires in 4 hours</span>
      </motion.div>

      <div className="border-t border-border p-4 bg-card space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setInputValue("")}
            className="flex-1 rounded-full"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-xs text-muted-foreground">Use templates for quick responses</p>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState("1")

  const conversations: Conversation[] = [
    {
      id: "1",
      customerName: "John Smith",
      phone: "+1 (555) 123-4567",
      assignedExecutive: "You",
      lastActivity: "2:30 PM",
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
      assignedExecutive: "Mike Wilson",
      lastActivity: "1:15 PM",
      messages: [
        { id: "1", text: "Thanks for the quick response!", sender: "customer", timestamp: "2:15 PM" },
        { id: "2", text: "You're welcome! Happy to help.", sender: "executive", timestamp: "2:16 PM", status: "read" },
      ],
    },
    {
      id: "3",
      customerName: "Michael Chen",
      phone: "+1 (555) 345-6789",
      assignedExecutive: "You",
      lastActivity: "12:00 PM",
      messages: [{ id: "1", text: "Do you have this item in stock?", sender: "customer", timestamp: "12:00 PM" }],
    },
  ]

  const currentConversation = conversations.find((c) => c.id === selectedConversation)

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <ConversationList
        conversations={conversations}
        selected={selectedConversation}
        onSelect={setSelectedConversation}
      />
      {currentConversation && <ChatArea conversation={currentConversation} />}
    </div>
  )
}
