"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Badge } from "@/components/badge"
import { Plus, Trash2 } from "lucide-react"

export default function AddLead() {
  const [leads, setLeads] = useState([
    { id: 1, name: "Acme Corp", email: "contact@acme.com", phone: "+1 (555) 123-4567", category: "Enterprise" },
    { id: 2, name: "Tech Start", email: "hello@techstart.com", phone: "+1 (555) 234-5678", category: "Startup" },
  ])

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", category: "Standard" })

  const handleAddLead = () => {
    if (formData.name && formData.email && formData.phone) {
      setLeads([
        ...leads,
        {
          id: Date.now(),
          ...formData,
        },
      ])
      setFormData({ name: "", email: "", phone: "", category: "Standard" })
    }
  }

  const handleDeleteLead = (id: number) => {
    setLeads(leads.filter((l) => l.id !== id))
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-background">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add Lead</h1>
          <p className="text-sm text-muted-foreground mt-2">Add new leads to the system</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 md:p-6 bg-card border-border">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">New Lead</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <Input
                    placeholder="Company name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option>Standard</option>
                    <option>Enterprise</option>
                    <option>Startup</option>
                  </select>
                </div>

                <Button
                  onClick={handleAddLead}
                  className="w-full"
                  disabled={!formData.name || !formData.email || !formData.phone}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Leads List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-4 md:p-6 bg-card border-border">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">All Leads ({leads.length})</h3>
              <div className="space-y-3">
                {leads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-card border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground break-words">{lead.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline">{lead.category}</Badge>
                        <span className="text-xs text-muted-foreground">{lead.phone}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors self-end sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
