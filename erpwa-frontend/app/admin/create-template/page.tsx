"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Badge } from "@/components/badge"
import { Plus, Trash2, Eye } from "lucide-react"

export default function CreateTemplate() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Welcome Message",
      category: "General",
      content: "Hi {{name}}, welcome to our service! How can we help you today?",
      createdDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Follow-up",
      category: "Sales",
      content: "Hi {{name}}, following up on our previous conversation about {{product}}",
      createdDate: "2024-01-14",
    },
  ])

  const [formData, setFormData] = useState({ name: "", category: "General", content: "" })

  const handleAddTemplate = () => {
    if (formData.name && formData.content) {
      setTemplates([
        ...templates,
        {
          id: Date.now(),
          ...formData,
          createdDate: new Date().toISOString().split("T")[0],
        },
      ])
      setFormData({ name: "", category: "General", content: "" })
    }
  }

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create Template</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage message templates for your team</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-semibold">New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Template Name</label>
                  <Input
                    placeholder="e.g., Welcome Message"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>General</option>
                    <option>Sales</option>
                    <option>Support</option>
                    <option>Follow-up</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message Content</label>
                  <textarea
                    placeholder="Use {{variable}} for dynamic content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preview</label>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border text-sm text-foreground min-h-20">
                    {formData.content || "Your message preview will appear here"}
                  </div>
                </div>

                <Button onClick={handleAddTemplate} className="w-full" disabled={!formData.name || !formData.content}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-semibold">All Templates ({templates.length})</CardTitle>
                <CardDescription className="text-sm">Manage and edit existing templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{template.createdDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
