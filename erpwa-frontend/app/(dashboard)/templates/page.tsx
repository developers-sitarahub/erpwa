"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

interface Template {
  id: string
  name: string
  preview: string
  hasMedia: boolean
  category: string
  adminOnly?: boolean
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Card className="bg-card border-border hover:border-border hover:shadow-sm transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base text-foreground">{template.name}</CardTitle>
            <CardDescription className="text-xs">{template.category}</CardDescription>
          </div>
          {template.adminOnly && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              Admin Only
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{template.preview}</p>
        {template.hasMedia && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded border border-border">
            <ImageIcon className="w-4 h-4 flex-shrink-0" />
            <span>Media included</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const templates: Template[] = [
    {
      id: "1",
      name: "Welcome Message",
      preview: "Hi {{name}}, welcome to our store! We're excited to help you find what you need.",
      hasMedia: false,
      category: "Greeting",
    },
    {
      id: "2",
      name: "Order Confirmation",
      preview: "Your order #{{order_id}} has been confirmed. Your total is {{amount}}. Thank you!",
      hasMedia: true,
      category: "Transactional",
    },
    {
      id: "3",
      name: "Shipping Notification",
      preview: "Great news! Your order is on its way. Tracking ID: {{tracking_id}}",
      hasMedia: false,
      category: "Update",
    },
    {
      id: "4",
      name: "Follow-up Message",
      preview: "Hi {{name}}, just checking in. Do you have any questions about your purchase?",
      hasMedia: false,
      category: "Follow-up",
    },
    {
      id: "5",
      name: "Promotional Offer",
      preview: "Limited time offer! Get 20% off your next purchase with code SAVE20.",
      hasMedia: true,
      category: "Marketing",
      adminOnly: true,
    },
    {
      id: "6",
      name: "Return Instructions",
      preview: "Need to return your item? Here's your return authorization: {{rma_id}}",
      hasMedia: false,
      category: "Support",
      adminOnly: true,
    },
  ]

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Message Templates</h2>
          <p className="text-sm text-muted-foreground">
            WhatsApp approved templates for sending bulk messages. Admin-only templates require special permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  )
}
