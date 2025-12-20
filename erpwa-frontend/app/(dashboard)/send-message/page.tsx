"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { Select } from "@/components/select"
import { Badge } from "@/components/badge"
import { Checkbox } from "@/components/checkbox"
import { AlertCircle, CheckCircle2, Send } from "lucide-react"

interface Contact {
  id: string
  name: string
  phone: string
  status: "new" | "contacted" | "qualified" | "converted"
  category: string
  assignedExecutive: string
}

interface ContactGroup {
  category: string
  contacts: Contact[]
}

// Mock data for contacts organized by category
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "+1 (555) 123-4567",
    status: "new",
    category: "Cold Leads",
    assignedExecutive: "You",
  },
  {
    id: "2",
    name: "Jane Doe",
    phone: "+1 (555) 111-1111",
    status: "new",
    category: "Cold Leads",
    assignedExecutive: "You",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    phone: "+1 (555) 234-5678",
    status: "contacted",
    category: "Warm Leads",
    assignedExecutive: "Mike Wilson",
  },
  {
    id: "4",
    name: "Michael Chen",
    phone: "+1 (555) 345-6789",
    status: "qualified",
    category: "Hot Leads",
    assignedExecutive: "You",
  },
  {
    id: "5",
    name: "Emma Davis",
    phone: "+1 (555) 456-7890",
    status: "converted",
    category: "VIP Customers",
    assignedExecutive: "Sarah Johnson",
  },
  {
    id: "6",
    name: "Alex Wilson",
    phone: "+1 (555) 567-8901",
    status: "new",
    category: "Cold Leads",
    assignedExecutive: "Alex Chen",
  },
  {
    id: "7",
    name: "Robert Brown",
    phone: "+1 (555) 678-9012",
    status: "qualified",
    category: "Hot Leads",
    assignedExecutive: "You",
  },
  {
    id: "8",
    name: "Lisa Anderson",
    phone: "+1 (555) 789-0123",
    status: "contacted",
    category: "Warm Leads",
    assignedExecutive: "Mike Wilson",
  },
]

export default function SendMessagePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("1")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [filterBy, setFilterBy] = useState<"all" | "status">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all-statuses")

  const templates = [
    {
      id: "1",
      name: "Welcome Message",
      preview: "Hi {{name}}, welcome to our store!",
      variables: ["name"],
    },
    {
      id: "2",
      name: "Order Confirmation",
      preview: "Your order #{{order_id}} has been confirmed.",
      variables: ["order_id", "amount"],
    },
    {
      id: "3",
      name: "Shipping Notification",
      preview: "Your order is on its way. Tracking: {{tracking_id}}",
      variables: ["tracking_id"],
    },
    {
      id: "4",
      name: "Special Offer",
      preview: "Exclusive offer for {{name}}: {{offer_details}}",
      variables: ["name", "offer_details"],
    },
  ]

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)

  const groupedContacts: ContactGroup[] = mockContacts
    .filter((contact) => {
      if (statusFilter !== "all-statuses" && contact.status !== statusFilter) return false
      return true
    })
    .reduce((acc, contact) => {
      const group = acc.find((g) => g.category === contact.category)
      if (group) {
        group.contacts.push(contact)
      } else {
        acc.push({ category: contact.category, contacts: [contact] })
      }
      return acc
    }, [] as ContactGroup[])

  const selectedContacts = mockContacts.filter((c) => selectedRecipients.includes(c.id))

  const toggleCategory = (category: string) => {
    const categoryContacts = mockContacts
      .filter((c) => c.category === category && (statusFilter === "all-statuses" || c.status === statusFilter))
      .map((c) => c.id)

    const allSelected = categoryContacts.every((id) => selectedRecipients.includes(id))

    if (allSelected) {
      setSelectedRecipients(selectedRecipients.filter((id) => !categoryContacts.includes(id)))
    } else {
      setSelectedRecipients([...new Set([...selectedRecipients, ...categoryContacts])])
    }
  }

  const handleSend = () => {
    if (!selectedTemplate || selectedRecipients.length === 0) return

    setSendingStatus("sending")
    console.log("[v0] Sending bulk message:", {
      template: selectedTemplate,
      recipients: selectedRecipients,
      recipientCount: selectedRecipients.length,
      variables,
      timestamp: new Date().toISOString(),
    })

    // Simulate send delay
    setTimeout(() => {
      setSendingStatus("sent")
      setSelectedRecipients([])
      setSelectedTemplate("")
      setVariables({})
      setStatusFilter("all-statuses")

      // Reset after 3 seconds
      setTimeout(() => setSendingStatus("idle"), 3000)
    }, 2000)
  }

  const statusBadgeStyles: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    converted: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status Messages */}
        {sendingStatus === "sent" && (
          <Card className="bg-green-500/10 border-green-500/30">
            <div className="pt-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-400">Messages sent successfully!</p>
                <p className="text-sm text-green-400/70 mt-1">
                  {selectedContacts.length} message{selectedContacts.length !== 1 ? "s" : ""} queued for delivery.
                </p>
              </div>
            </div>
          </Card>
        )}

        {sendingStatus === "sending" && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <div className="pt-6 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500/50 border-t-blue-500 animate-spin" />
              <div>
                <p className="font-medium text-blue-400">Sending messages...</p>
                <p className="text-sm text-blue-400/70 mt-1">Please wait while we deliver your messages.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Template & Recipients */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <Card className="bg-card border-border">
              <div>
                <h2 className="text-lg font-bold">Select Template</h2>
                <p className="text-sm text-muted-foreground">Choose an approved template to send</p>
              </div>
              <div>
                <Select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* Template Preview */}
            {currentTemplate && (
              <Card className="bg-card border-border">
                <div>
                  <h2 className="text-base font-bold">Template Preview</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-secondary p-4 rounded-lg border border-border">
                    <p className="text-sm text-foreground">{currentTemplate.preview}</p>
                  </div>

                  {/* Variable Inputs */}
                  {currentTemplate.variables.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Fill in variables:</p>
                      {currentTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label className="text-sm font-medium text-foreground">{variable}</label>
                          <input
                            placeholder={`Enter ${variable}`}
                            value={variables[variable] || ""}
                            onChange={(e) =>
                              setVariables({
                                ...variables,
                                [variable]: e.target.value,
                              })
                            }
                            className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="bg-card border-border">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Select Recipients</h2>
                    <p className="text-sm text-muted-foreground">Choose contacts by category or filter by status</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {selectedRecipients.length} selected
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                {/* Status Filter */}
                <div className="flex gap-2">
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all-statuses">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </Select>
                </div>

                {/* Categories with Checkboxes */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {groupedContacts.map((group) => {
                    const groupContactIds = group.contacts.map((c) => c.id)
                    const allSelected = groupContactIds.every((id) => selectedRecipients.includes(id))
                    const someSelected = groupContactIds.some((id) => selectedRecipients.includes(id))

                    return (
                      <div key={group.category} className="border border-border rounded-lg p-3 space-y-2">
                        {/* Category Header with Select All */}
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => toggleCategory(group.category)}
                        >
                          <Checkbox checked={allSelected} onChange={() => toggleCategory(group.category)} />
                          <span className="font-medium text-foreground flex-1">{group.category}</span>
                          <span className="text-xs text-muted-foreground">
                            {groupContactIds.filter((id) => selectedRecipients.includes(id)).length}/
                            {group.contacts.length}
                          </span>
                        </div>

                        {/* Contacts in Category */}
                        <div className="space-y-2 pl-6">
                          {group.contacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors"
                            >
                              <Checkbox
                                checked={selectedRecipients.includes(contact.id)}
                                onChange={(checked) => {
                                  if (checked) {
                                    setSelectedRecipients([...selectedRecipients, contact.id])
                                  } else {
                                    setSelectedRecipients(selectedRecipients.filter((id) => id !== contact.id))
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">{contact.phone}</p>
                              </div>
                              <Badge
                                className={`text-xs flex-shrink-0 ${statusBadgeStyles[contact.status]} border`}
                                variant="outline"
                              >
                                {contact.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-6">
            <Card className="bg-card border-border lg:sticky lg:top-6">
              <div>
                <h2 className="text-base font-bold">Send Summary</h2>
              </div>
              <div className="space-y-4">
                {/* Recipients Summary */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Recipients</p>
                  <div className="bg-secondary rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {selectedContacts.length > 0 ? (
                      <>
                        {selectedContacts.map((contact) => (
                          <div key={contact.id} className="flex items-start gap-2 text-xs">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{contact.name}</p>
                              <p className="text-muted-foreground">{contact.phone}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-xs">No recipients selected</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary rounded p-2 text-center">
                    <p className="text-xs text-muted-foreground">Recipients</p>
                    <p className="text-lg font-semibold text-foreground">{selectedRecipients.length}</p>
                  </div>
                  <div className="bg-secondary rounded p-2 text-center">
                    <p className="text-xs text-muted-foreground">Template</p>
                    <p className="text-lg font-semibold text-foreground">{selectedTemplate ? "✓" : "-"}</p>
                  </div>
                </div>

                {/* Warnings */}
                {selectedRecipients.length === 0 && (
                  <div className="flex gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Select at least one recipient</span>
                  </div>
                )}

                {!selectedTemplate && selectedRecipients.length > 0 && (
                  <div className="flex gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Select a template</span>
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!selectedTemplate || selectedRecipients.length === 0 || sendingStatus === "sending"}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingStatus === "sending" ? "Sending..." : "Send Messages"}
                </Button>

                {/* Info */}
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded border border-border">
                  <p className="font-medium text-foreground mb-1">Important</p>
                  Messages use WhatsApp approved templates. Free tier limited to 24 hours after customer initiation.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
