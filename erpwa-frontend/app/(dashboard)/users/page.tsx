"use client"

import type React from "react"
import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/button"
import { Badge } from "@/components/badge"
import { Select } from "@/components/select"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/card"

/* ===================== TYPES ===================== */

interface User {
  id: string
  name: string
  role: "admin" | "sales_executive"
  status: "active" | "inactive"
}

/* ===================== BADGES ===================== */

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

/* ===================== MODAL ===================== */

function AddUserModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // submit logic here
    setFormData({ name: "", email: "", role: "" })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-between pb-4">
          <CardTitle>Add New User</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                required
                placeholder="User name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>

              <Select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="" disabled>
                  Select role...
                </option>
                <option value="sales_executive">Sales Executive</option>
                <option value="admin">Admin</option>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Add User
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
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

/* ===================== PAGE ===================== */

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
            <h2 className="text-xl font-semibold">Team Members</h2>
            <p className="text-sm text-muted-foreground">
              Manage users and their roles
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
