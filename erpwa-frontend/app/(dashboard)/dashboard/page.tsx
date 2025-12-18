"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/card"
import { MessageSquare, CheckCircle, Clock, FileText, TrendingUp, Users } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down"
  icon: React.ReactNode
  description: string
  index: number
}

function KPICard({ title, value, change, trend, icon, description, index }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <motion.div whileHover={{ scale: 1.1 }} className="text-primary">
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{description}</p>
            {change && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
              >
                {trend === "up" ? "↑" : "↓"} {change}
              </motion.span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecentConversation({
  name,
  message,
  time,
  unread,
  index,
}: {
  name: string
  message: string
  time: string
  unread: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ backgroundColor: "var(--muted)" }}
      className={`px-6 py-4 border-b border-border last:border-b-0 cursor-pointer transition-colors ${unread ? "bg-muted/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium text-foreground truncate ${unread ? "font-bold" : ""}`}>{name}</p>
            {unread && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex h-2 w-2 rounded-full bg-primary flex-shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">{message}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const kpis = [
    {
      title: "Messages Sent",
      value: "2,847",
      change: "12%",
      trend: "up" as const,
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Last 30 days",
    },
    {
      title: "Delivered",
      value: "2,721",
      change: "8%",
      trend: "up" as const,
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Successfully delivered",
    },
    {
      title: "Active Conversations",
      value: "156",
      change: "5%",
      trend: "down" as const,
      icon: <Clock className="w-5 h-5" />,
      description: "Currently active",
    },
    {
      title: "Response Rate",
      value: "87%",
      change: "3%",
      trend: "up" as const,
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Average response",
    },
    {
      title: "Total Leads",
      value: "384",
      change: "15%",
      trend: "up" as const,
      icon: <Users className="w-5 h-5" />,
      description: "This month",
    },
    {
      title: "Templates",
      value: "18",
      icon: <FileText className="w-5 h-5" />,
      description: "Approved & ready",
    },
  ]

  const conversations = [
    {
      name: "John Smith",
      message: "Thanks for the quick response! Can you send me the invoice?",
      time: "2:30 PM",
      unread: true,
    },
    { name: "Sarah Johnson", message: "Perfect, I'll place the order now", time: "1:45 PM", unread: false },
    { name: "Michael Chen", message: "Do you have this item in stock?", time: "12:15 PM", unread: false },
    { name: "Emma Davis", message: "Great! I'll confirm once I receive it", time: "10:30 AM", unread: false },
    { name: "Alex Wilson", message: "Thank you for your help with my order", time: "Yesterday", unread: false },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} index={i} />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 20 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Conversations</CardTitle>
              <CardDescription>Latest messages from your customers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {conversations.map((conv, i) => (
                  <RecentConversation key={i} {...conv} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
