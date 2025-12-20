"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { Badge } from "@/components/badge"
import { Select } from "@/components/select"
import { Plus, X } from "lucide-react"

interface User {
  id: string
  name: string
  role: "admin" | "sales_executive"
  status: "active" | "inactive"
}

function RoleBadge({ role }: { role: User["role"] }) {
  return (
    <Badge
      variant="outline"
      className={
        role === "admin"
          ? "bg-red-500/20 text-red-400 border-red-500/30"
          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
      }
    >
      {role === "admin" ? "Admin" : "Sales Executive"}
    </Badge>
  )
}

function StatusBadge({ status }: { status: User["status"] }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "active"
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }
    >
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  )
}

function AddUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormData({ name: "", email: "", role: "" })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <Card.Header className="flex flex-row items-center justify-between space-y-0 pb-4">
          <Card.Title>Add New User</Card.Title>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                placeholder="User name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <Select.Trigger className="bg-secondary border-border">
                  <Select.Value placeholder="Select role..." />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="sales_executive">Sales Executive</Select.Item>
                  <Select.Item value="admin">Admin</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                Add User
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
        </Card.Content>
      </Card>
    </div>
  )
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const users: User[] = [
    { id: "1", name: "You", role: "admin", status: "active" },
    { id: "2", name: "Mike Wilson", role: "sales_executive", status: "active" },
    { id: "3", name: "Sarah Johnson", role: "sales_executive", status: "active" },
    { id: "4", name: "Alex Chen", role: "sales_executive", status: "active" },
    { id: "5", name: "John Doe", role: "sales_executive", status: "inactive" },
  ]

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage users and their roles</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <Card.Header>
            <Card.Title>All Users</Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      </div>

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
