"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Plus, X, Loader2, Search } from "lucide-react";

import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { Select } from "@/components/select";
import { useAuth } from "@/context/authContext";
import { usersAPI, User } from "@/lib/usersApi";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

/* ===================== BADGES ===================== */

function RoleBadge({ role }: { role: string }) {
  const displayRole = role.replace("vendor_", "").replace("_", " ");
  return (
    <Badge
      variant="outline"
      className={
        role.includes("admin") || role.includes("owner")
          ? "bg-red-500/20 text-red-400 border-red-500/30 capitalize"
          : "bg-blue-500/20 text-blue-400 border-blue-500/30 capitalize"
      }
    >
      {displayRole}
    </Badge>
  );
}

function StatusBadge({
  status,
  activatedAt,
}: {
  status: string;
  activatedAt?: string;
}) {
  const isActive =
    status === "active" || (status !== "inactive" && activatedAt);
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }
    >
      {isActive ? "Active" : activatedAt ? "Inactive" : "Pending Setup"}
    </Badge>
  );
}

/* ===================== MODAL ===================== */

function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sales",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersAPI.create(formData);
      toast.success("📧 Invitation email sent!");
      onSuccess();
      onClose();
      setFormData({ name: "", email: "", role: "sales" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
                <option value="sales">Sales Executive</option>
                <option value="vendor_admin">Admin</option>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Add User"
                )}
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
  );
}

/* ===================== PAGE ===================== */

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.list();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isOwnerOrAdmin =
    currentUser?.role === "vendor_owner" ||
    currentUser?.role === "vendor_admin";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Team Members</h2>
            <p className="text-sm text-muted-foreground">
              View and manage users in your organization
            </p>
          </div>

          {isOwnerOrAdmin && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Users ({users.length})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Name & Email
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground text-right">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-muted-foreground italic"
                      >
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {u.name}
                              {u.id === currentUser?.id && " (You)"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={u.status}
                            activatedAt={u.activatedAt}
                          />
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
