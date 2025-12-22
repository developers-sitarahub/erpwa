"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/card"
import { Users, MessageSquare, TrendingUp, UserCheck, BeanIcon as TeamIcon, Activity } from "lucide-react"

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

function TeamActivity({
  member,
  action,
  time,
  index,
}: {
  member: string
  action: string
  time: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ backgroundColor: "var(--muted)" }}
      className="px-6 py-4 border-b border-border last:border-b-0 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{member}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">{action}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const kpis = [
    {
      title: "Team Members",
      value: "12",
      change: "2",
      trend: "up" as const,
      icon: <Users className="w-5 h-5" />,
      description: "Active members",
    },
    {
      title: "Total Leads",
      value: "1,248",
      change: "18%",
      trend: "up" as const,
      icon: <UserCheck className="w-5 h-5" />,
      description: "All leads combined",
    },
    {
      title: "Messages Sent",
      value: "45,231",
      change: "12%",
      trend: "up" as const,
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Total messages",
    },
    {
      title: "Conversion Rate",
      value: "32%",
      change: "5%",
      trend: "up" as const,
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Lead to customer",
    },
    {
      title: "Active Conversations",
      value: "234",
      change: "8%",
      trend: "up" as const,
      icon: <Activity className="w-5 h-5" />,
      description: "Currently active",
    },
    {
      title: "Team Performance",
      value: "94%",
      change: "3%",
      trend: "up" as const,
      icon: <TeamIcon className="w-5 h-5" />,
      description: "Average score",
    },
  ]

  const teamActivities = [
    { member: "John Doe", action: "Converted lead: Acme Corp to customer", time: "5 min ago" },
    { member: "Sarah Smith", action: "Assigned new lead: Tech Startup Inc", time: "12 min ago" },
    { member: "Mike Johnson", action: "Created template: Follow-up Message", time: "25 min ago" },
    { member: "Emma Wilson", action: "Sent bulk message to 45 leads", time: "1 hour ago" },
    { member: "Alex Brown", action: "Updated lead status: Global Solutions", time: "2 hours ago" },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} index={i} />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg font-semibold">Team Activity</CardTitle>
              <CardDescription className="text-sm">Recent actions from your team members</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {teamActivities.map((activity, i) => (
                  <TeamActivity key={i} {...activity} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
