"use client"

import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { Badge } from "@/components/badge"
import { Select } from "@/components/select"
import { Plus, X } from "lucide-react"

interface Lead {
  id: string
  name: string
  phone: string
  status: "new" | "contacted" | "qualified" | "converted"
  assignedExecutive: string
}

function StatusBadge({ status }: { status: Lead["status"] }) {
  const styles: Record<Lead["status"], string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    converted: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  const labels: Record<Lead["status"], string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    converted: "Converted",
  }

  return (
    <Badge className={`${styles[status]} border`} variant="outline">
      {labels[status]}
    </Badge>
  )
}

function AddLeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    assignedExecutive: "",
  })

  const executives = ["You", "Mike Wilson", "Sarah Johnson", "Alex Chen"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormData({ name: "", phone: "", assignedExecutive: "" })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <h2 className="text-xl font-semibold text-foreground">Add New Lead</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                placeholder="Lead name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Assign To</label>
              <Select
                value={formData.assignedExecutive}
                onValueChange={(val) => setFormData({ ...formData, assignedExecutive: val })}
              >
                {/* Updated SelectTrigger and SelectValue components */}
                <div className="bg-secondary border-border">
                  <span>{formData.assignedExecutive || "Select executive..."}</span>
                </div>
                {/* Updated SelectContent component */}
                <div>
                  {executives.map((exec) => (
                    <div key={exec} onClick={() => setFormData({ ...formData, assignedExecutive: exec })}>
                      {exec}
                    </div>
                  ))}
                </div>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                Add Lead
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-secondary border-border text-foreground hover:bg-muted"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LeadsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const leads: Lead[] = [
    {
      id: "1",
      name: "John Smith",
      phone: "+1 (555) 123-4567",
      status: "new",
      assignedExecutive: "You",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      phone: "+1 (555) 234-5678",
      status: "contacted",
      assignedExecutive: "Mike Wilson",
    },
    {
      id: "3",
      name: "Michael Chen",
      phone: "+1 (555) 345-6789",
      status: "qualified",
      assignedExecutive: "You",
    },
    {
      id: "4",
      name: "Emma Davis",
      phone: "+1 (555) 456-7890",
      status: "converted",
      assignedExecutive: "Sarah Johnson",
    },
    {
      id: "5",
      name: "Alex Wilson",
      phone: "+1 (555) 567-8901",
      status: "new",
      assignedExecutive: "Alex Chen",
    },
  ]

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Sales Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage and track your sales pipeline</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <CardHeader>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">All Leads</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{lead.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{lead.phone}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 px-4 text-foreground">{lead.assignedExecutive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
