"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Badge } from "@/components/badge"
import { Plus, Edit2, Trash2, CheckCircle2, Circle } from "lucide-react"

export default function ManageTeam() {
  const [team, setTeam] = useState([
    { id: 1, name: "John Doe", email: "john@company.com", role: "Senior Sales", leads: 48, status: "active" },
    { id: 2, name: "Sarah Smith", email: "sarah@company.com", role: "Sales Executive", leads: 52, status: "active" },
    { id: 3, name: "Mike Johnson", email: "mike@company.com", role: "Sales Executive", leads: 38, status: "active" },
    { id: 4, name: "Emma Wilson", email: "emma@company.com", role: "Team Lead", leads: 45, status: "inactive" },
  ])

  const toggleStatus = (id: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, status: member.status === "active" ? "inactive" : "active" } : member,
      ),
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-background">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Manage Team</h1>
          <p className="text-sm text-muted-foreground mt-2">View and manage sales team members</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-border">
            <div className="p-4 md:p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base md:text-lg font-semibold text-foreground">Team Members ({team.length})</h3>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Name</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Email</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Role</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Leads</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Status</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member, index) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4 md:px-6 text-foreground font-medium">{member.name}</td>
                      <td className="py-4 px-4 md:px-6 text-muted-foreground text-sm">{member.email}</td>
                      <td className="py-4 px-4 md:px-6">
                        <Badge variant="outline">{member.role}</Badge>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-foreground">{member.leads}</td>
                      <td className="py-4 px-4 md:px-6">
                        <button onClick={() => toggleStatus(member.id)} className="flex items-center gap-2 text-sm">
                          {member.status === "active" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              <span className="text-primary">Active</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 md:px-6 flex gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
