"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/card"
import { Badge } from "@/components/badge"
import { Plus, Edit2, Trash2, Eye, EyeOff, X, FolderOpen, Check, AlertTriangle } from "lucide-react"
import { categoriesAPI } from "@/lib/categoriesApi"
import type { Category, Contact } from "@/lib/types"
import { toast } from "react-toastify"

function StatusBadge({ status, isLead }: { status: string; isLead?: boolean }) {
  // Lead statuses
  const leadStyles: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
    contacted: "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30",
    qualified: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
    converted: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
    lost: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
  }

  const leadLabels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    converted: "Converted",
    lost: "Lost",
  }

  // Contact statuses
  const contactStyles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    active: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
    inactive: "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30",
    closed: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
  }

  const contactLabels: Record<string, string> = {
    pending: "Pending",
    active: "Active",
    inactive: "Inactive",
    closed: "Closed",
  }

  const styles = isLead ? leadStyles : contactStyles
  const labels = isLead ? leadLabels : contactLabels
  const displayStatus = status || (isLead ? "new" : "pending")

  return (
    <Badge className={`${styles[displayStatus] || styles[isLead ? "new" : "pending"]} border`} variant="outline">
      {labels[displayStatus] || displayStatus}
    </Badge>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactCount, setContactCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  // Category form states
  const [categoryName, setCategoryName] = useState("")
  const [subcategoryName, setSubcategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [cascadeDeleteModal, setShowCascadeDeleteModal] = useState<{
    show: boolean
    categoryId: number
    categoryName: string
    imagesCount: number
    contactsCount: number
    leadsCount: number
    subcategoriesCount: number
  } | null>(null)

  // Add Contact Modal states
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    company_name: "",
    mobile_number: "",
    category_id: "",
    subcategory_id: "",
    sales_person_name: "",
    status: "pending" as Contact["status"],
  })
  const [contactSubcategories, setContactSubcategories] = useState<Category[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Only load count if we have a valid category or subcategory selected
    const hasValidCategory = selectedCategory !== null && !isNaN(selectedCategory) && selectedCategory > 0
    const hasValidSubcategory = selectedSubcategory !== null && !isNaN(selectedSubcategory) && selectedSubcategory > 0

    if (hasValidCategory || hasValidSubcategory) {
      loadContactCount()
      setShowDetails(false)
    } else {
      // Reset count when no valid category is selected
      setContactCount(0)
      setShowDetails(false)
      setContacts([])
    }
  }, [selectedCategory, selectedSubcategory])

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data || [])
    } catch (error: any) {
      toast.error("Failed to load categories: " + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const loadContactCount = async () => {
    // Only call API if we have at least one valid category/subcategory ID
    const hasValidCategory = selectedCategory !== null && !isNaN(selectedCategory) && selectedCategory > 0
    const hasValidSubcategory = selectedSubcategory !== null && !isNaN(selectedSubcategory) && selectedSubcategory > 0

    if (!hasValidCategory && !hasValidSubcategory) {
      setContactCount(0)
      return
    }

    try {
      const response = await categoriesAPI.getContacts(
        hasValidCategory ? selectedCategory : undefined,
        hasValidSubcategory ? selectedSubcategory : undefined
      )
      // API returns { data: { count, contacts } }
      const count = (response.data as any)?.count ?? 0
      setContactCount(count)
    } catch (error: any) {
      // API wrapper now never throws, but just in case
      console.error("Failed to load contact count:", error)
      setContactCount(0)
    }
  }

  const loadContactDetails = async () => {
    // Only call API if we have at least one valid category/subcategory ID
    const hasValidCategory = selectedCategory !== null && !isNaN(selectedCategory) && selectedCategory > 0
    const hasValidSubcategory = selectedSubcategory !== null && !isNaN(selectedSubcategory) && selectedSubcategory > 0

    if (!hasValidCategory && !hasValidSubcategory) {
      setContacts([])
      toast.error("Please select a category or subcategory first")
      return
    }

    try {
      const response = await categoriesAPI.getContacts(
        hasValidCategory ? selectedCategory : undefined,
        hasValidSubcategory ? selectedSubcategory : undefined
      )
      // API returns { data: { count, contacts } }
      const contacts = response.data?.contacts ?? []
      setContacts(contacts)
      setShowDetails(true)
    } catch (error: any) {
      // API wrapper now never throws, but just in case
      console.error("Failed to load contacts:", error)
      setContacts([])
      toast.error("Failed to load contacts")
    }
  }

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
    setShowDetails(false)
    loadSubcategories(categoryId)
  }

  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId || isNaN(categoryId)) {
      console.error("Invalid category ID:", categoryId)
      return
    }
    try {
      const response = await categoriesAPI.detail(categoryId)
      const category = categories.find((c) => c.id === categoryId)
      if (category) {
        category.subcategories = response.data?.subcategories || []
        setCategories([...categories])
      }
    } catch (error) {
      console.error("Failed to load subcategories:", error)
    }
  }

  const handleSubcategoryClick = (subcategoryId: number) => {
    setSelectedSubcategory(subcategoryId)
    setShowDetails(false)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const formData = new FormData()
      formData.append("category_name", categoryName.trim())
      if (subcategoryName.trim()) {
        formData.append("subcategory_name", subcategoryName.trim())
      }
      if (selectedCategory) {
        formData.append("parent_id", selectedCategory.toString())
      }

      const response = await categoriesAPI.create(formData)

      if (response.data?.success !== false) {
        toast.success("Category created successfully!")
        setCategoryName("")
        setSubcategoryName("")
        await loadCategories()
      } else {
        toast.error("Failed to create category")
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create category"
      toast.error(errorMsg)
      console.error("Category creation error:", error)
    }
  }

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    try {
      const response = await categoriesAPI.delete(categoryId, {})

      // Check if cascade delete is required
      if (response.data.requires_cascade) {
        setShowCascadeDeleteModal({
          show: true,
          categoryId,
          categoryName,
          imagesCount: response.data.images_count || 0,
          contactsCount: response.data.contacts_count || 0,
          leadsCount: response.data.leads_count || 0,
          subcategoriesCount: response.data.subcategories_count || 0,
        })
        return
      }

      if (response.data.success) {
        toast.success(response.data.message || "Category deleted successfully!")
        await loadCategories()
        if (selectedCategory === categoryId) {
          setSelectedCategory(null)
          setSelectedSubcategory(null)
        }
      } else {
        toast.error(response.data.error || "Failed to delete category")
      }
    } catch (error: any) {
      let errorData = error.response?.data
      if (typeof errorData === "string") {
        try {
          errorData = JSON.parse(errorData)
        } catch {
          errorData = { error: errorData }
        }
      }

      if (errorData?.requires_cascade) {
        setShowCascadeDeleteModal({
          show: true,
          categoryId,
          categoryName,
          imagesCount: errorData.images_count || 0,
          contactsCount: errorData.contacts_count || 0,
          leadsCount: errorData.leads_count || 0,
          subcategoriesCount: errorData.subcategories_count || 0,
        })
      } else {
        toast.error(errorData?.error || "Failed to delete category")
      }
    }
  }

  const handleConfirmCascadeDelete = async () => {
    if (!cascadeDeleteModal) return

    const deleteOptions = {
      delete_subcategories:
        cascadeDeleteModal.subcategoriesCount > 0 &&
        (document.getElementById("deleteSubcategories") as HTMLInputElement)?.checked,
      delete_gallery:
        cascadeDeleteModal.imagesCount > 0 &&
        (document.getElementById("deleteGallery") as HTMLInputElement)?.checked,
      delete_contacts:
        cascadeDeleteModal.contactsCount > 0 &&
        (document.getElementById("deleteContacts") as HTMLInputElement)?.checked,
      delete_leads:
        cascadeDeleteModal.leadsCount > 0 &&
        (document.getElementById("deleteLeads") as HTMLInputElement)?.checked,
    }

    const hasData =
      cascadeDeleteModal.imagesCount > 0 ||
      cascadeDeleteModal.contactsCount > 0 ||
      cascadeDeleteModal.leadsCount > 0 ||
      cascadeDeleteModal.subcategoriesCount > 0

    if (hasData && !Object.values(deleteOptions).some((v) => v)) {
      toast.error("Please select at least one deletion option")
      return
    }

    try {
      const response = await categoriesAPI.delete(cascadeDeleteModal.categoryId, deleteOptions)
      if (response.data.success) {
        toast.success(response.data.message || "Category deleted successfully!")
        setShowCascadeDeleteModal(null)
        await loadCategories()
        if (selectedCategory === cascadeDeleteModal.categoryId) {
          setSelectedCategory(null)
          setSelectedSubcategory(null)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete category")
    }
  }

  const handleDeleteContact = async (contactId: number, contactName: string) => {
    if (!confirm(`Are you sure you want to delete contact "${contactName}"?`)) {
      return
    }

    try {
      await categoriesAPI.deleteContact(contactId)
      toast.success("Contact deleted successfully!")
      await loadContactDetails()
      await loadContactCount()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete contact")
    }
  }

  const handleUpdateContactStatus = async (contactId: number, status: string) => {
    try {
      const formData = new FormData()
      formData.append("status", status)

      const response = await categoriesAPI.updateContact(contactId, formData)

      if (response.data?.success !== false) {
        toast.success("Contact updated successfully!")
        await loadContactDetails()
        await loadContactCount()
      } else {
        toast.error("Failed to update contact")
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update contact"
      toast.error(errorMsg)
      console.error("Contact update error:", error)
    }
  }

  const loadContactSubcategories = async (categoryId: number) => {
    try {
      const response = await categoriesAPI.detail(categoryId)
      setContactSubcategories(response.data.subcategories || [])
    } catch (error) {
      setContactSubcategories([])
    }
  }

  const handleContactCategoryChange = (categoryId: string) => {
    setContactForm({ ...contactForm, category_id: categoryId, subcategory_id: "" })
    if (categoryId) {
      loadContactSubcategories(parseInt(categoryId))
    } else {
      setContactSubcategories([])
    }
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactForm.company_name.trim()) {
      toast.error("Company name is required")
      return
    }
    if (!contactForm.mobile_number.trim()) {
      toast.error("Mobile number is required")
      return
    }
    if (!contactForm.category_id) {
      toast.error("Category is required")
      return
    }

    try {
      const formData = new FormData()
      formData.append("company_name", contactForm.company_name.trim())
      formData.append("mobile_number", contactForm.mobile_number.trim())
      formData.append("category_id", contactForm.category_id)
      if (contactForm.subcategory_id) {
        formData.append("subcategory_id", contactForm.subcategory_id)
      }
      formData.append("sales_person_name", contactForm.sales_person_name.trim())
      formData.append("status", contactForm.status)

      const response = await categoriesAPI.createContact(formData)

      if (response.data?.success !== false) {
        toast.success("Contact created successfully!")
        setShowAddContactModal(false)
        setContactForm({
          company_name: "",
          mobile_number: "",
          category_id: selectedCategory?.toString() || "",
          subcategory_id: selectedSubcategory?.toString() || "",
          sales_person_name: "",
          status: "pending",
        })
        setContactSubcategories([])
        await loadContactDetails()
        await loadContactCount()
      } else {
        toast.error("Failed to create contact")
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create contact"
      toast.error(errorMsg)
      console.error("Contact creation error:", error)
    }
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)
  const subcategories = selectedCategoryData?.subcategories || []

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Category & Contact Management
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage categories, subcategories, and contacts
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {(selectedCategory || selectedSubcategory) && (
          <div className="bg-secondary/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedSubcategory(null)
                }}
                className="text-primary hover:underline font-medium"
              >
                Categories
              </button>
              {selectedCategory && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className="text-primary hover:underline font-medium"
                  >
                    {selectedCategoryData?.name}
                  </button>
                </>
              )}
              {selectedSubcategory && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-foreground font-medium">
                    {subcategories.find((s) => s.id === selectedSubcategory)?.name}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Category Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Category Management</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="category_name" className="text-sm font-medium text-foreground block mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    id="category_name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="subcategory_name"
                    className="text-sm font-medium text-foreground block mb-2"
                  >
                    Sub-Category Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    id="subcategory_name"
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>
            </form>

            {/* Category List */}
            {categories.length > 0 && (
              <div className="border-t border-border pt-4">
                <h6 className="mb-3 text-sm font-semibold text-foreground">Existing Categories</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-primary" />
                          <h6 className="font-semibold text-foreground">{cat.name}</h6>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="p-1 hover:bg-secondary rounded transition-colors"
                            onClick={() => {
                              setEditingCategory(cat)
                              setCategoryName(cat.name)
                              setShowEditModal(true)
                            }}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cat.get_subcategories_count || cat.subcategories?.length || 0} subcategories
                      </p>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted-foreground text-xs block mb-1">
                            Subcategories:
                          </small>
                          <div className="flex flex-wrap gap-1">
                            {cat.subcategories.map((subcat) => (
                              <Badge
                                key={subcat.id}
                                variant="outline"
                                className="text-xs bg-secondary/50 border-border flex items-center gap-1"
                              >
                                {subcat.name}
                                <button
                                  className="p-0.5 hover:bg-secondary rounded"
                                  onClick={() => {
                                    setEditingCategory(subcat)
                                    setCategoryName(subcat.name)
                                    setShowEditModal(true)
                                  }}
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  className="p-0.5 hover:bg-destructive/20 rounded"
                                  onClick={() => handleDeleteCategory(subcat.id, subcat.name)}
                                  title="Delete"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <h3 className="text-lg font-semibold text-foreground">Contacts</h3>
            <Button
              onClick={() => {
                setContactForm({
                  company_name: "",
                  mobile_number: "",
                  category_id: selectedCategory?.toString() || "",
                  subcategory_id: selectedSubcategory?.toString() || "",
                  sales_person_name: "",
                  status: "pending",
                })
                if (selectedCategory) {
                  loadContactSubcategories(selectedCategory)
                }
                setShowAddContactModal(true)
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filter by Category */}
            {categories.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground block mb-2">
                  Filter by Category:
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`px-4 py-2 rounded text-sm transition-colors ${selectedCategory === cat.id
                        ? "bg-primary text-white"
                        : "bg-secondary text-foreground hover:bg-primary/20"
                        }`}
                      onClick={() => handleCategoryClick(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Subcategories */}
                {selectedCategory && subcategories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Sub-Category :-
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {subcategories.map((subcat) => (
                        <button
                          key={subcat.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${selectedSubcategory === subcat.id
                            ? "bg-primary text-white shadow-md"
                            : "bg-secondary border border-border text-foreground hover:bg-muted/70"
                            }`}
                          onClick={() => handleSubcategoryClick(subcat.id)}
                        >
                          <span>•</span>
                          {subcat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Count and Show Details */}
            {(selectedCategory || selectedSubcategory) && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                <div>
                  <strong className="text-foreground">Total Contacts:</strong>{" "}
                  <span className="text-primary font-semibold">{contactCount}</span>
                  {selectedCategoryData && (
                    <>
                      <br />
                      <small className="text-muted-foreground">
                        in {selectedCategoryData.name}
                        {selectedSubcategory &&
                          ` > ${subcategories.find((s) => s.id === selectedSubcategory)?.name}`}
                      </small>
                    </>
                  )}
                </div>
                <Button onClick={loadContactDetails} className="bg-primary hover:bg-primary/90">
                  <Eye className="w-4 h-4 mr-2" />
                  Show Details
                </Button>
              </div>
            )}

            {/* Contacts Table */}
            {showDetails && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Company Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Mobile Number
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Sub-Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Sales Person
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts && contacts.length > 0 ? (
                      contacts.map((contact: any) => (
                        <tr key={contact.id || `${contact.mobile_number}-${contact.company_name}`} className="border-b border-border hover:bg-muted/30">
                          <td className="py-3 px-4 text-foreground">{contact.company_name || "--"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{contact.mobile_number || "--"}</td>
                          <td className="py-3 px-4 text-foreground">
                            {contact.category_name || "--"}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {contact.sub_category_name || "--"}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {contact.sales_person_name || "--"}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={contact.status || (contact.is_lead ? "new" : "pending")} isLead={contact.is_lead} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {contact.is_lead ? (
                                <span className="text-xs text-muted-foreground px-2 py-1 bg-blue-500/10 rounded">
                                  Lead
                                </span>
                              ) : (
                                <button
                                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                                  onClick={() => {
                                    if (contact.id) {
                                      handleDeleteContact(contact.id, contact.company_name || "contact")
                                    } else {
                                      toast.error("Cannot delete lead from here. Please use the Leads page.")
                                    }
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-muted-foreground">
                          No contacts found for this category{selectedSubcategory ? " / subcategory" : ""}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!selectedCategory && !selectedSubcategory && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a category or sub-category above to view contact count and details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Edit Category</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
                  setCategoryName("")
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()

                  if (!categoryName.trim()) {
                    toast.error("Category name is required")
                    return
                  }

                  try {
                    const formData = new FormData()
                    formData.append("name", categoryName.trim())

                    const response = await categoriesAPI.update(editingCategory.id, formData)

                    if (response.data?.success !== false) {
                      toast.success("Category updated successfully!")
                      setShowEditModal(false)
                      setEditingCategory(null)
                      setCategoryName("")
                      await loadCategories()
                    } else {
                      toast.error("Failed to update category")
                    }
                  } catch (error: any) {
                    const errorMsg =
                      error.response?.data?.error ||
                      error.response?.data?.message ||
                      error.message ||
                      "Failed to update category"
                    toast.error(errorMsg)
                    console.error("Category update error:", error)
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Update Category
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-secondary border-border text-foreground hover:bg-muted"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingCategory(null)
                      setCategoryName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cascade Delete Modal */}
      {cascadeDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Delete Category Options</h2>
              <button
                onClick={() => setShowCascadeDeleteModal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-foreground">
                  Category "{cascadeDeleteModal.categoryName}" has:
                  {cascadeDeleteModal.subcategoriesCount > 0 && (
                    <>
                      <br />- {cascadeDeleteModal.subcategoriesCount} subcategory(ies)
                    </>
                  )}
                  {cascadeDeleteModal.imagesCount > 0 && (
                    <>
                      <br />- {cascadeDeleteModal.imagesCount} image(s)
                    </>
                  )}
                  {cascadeDeleteModal.contactsCount > 0 && (
                    <>
                      <br />- {cascadeDeleteModal.contactsCount} contact(s)
                    </>
                  )}
                  {cascadeDeleteModal.leadsCount > 0 && (
                    <>
                      <br />- {cascadeDeleteModal.leadsCount} lead(s)
                    </>
                  )}
                  <br />
                  <br />
                  What would you like to delete?
                  <br />
                  <br />
                  <strong className="text-destructive">⚠️ WARNING: This action cannot be undone!</strong>
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="deleteSubcategories"
                      disabled={cascadeDeleteModal.subcategoriesCount === 0}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      Delete {cascadeDeleteModal.subcategoriesCount} subcategory(ies)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="deleteGallery"
                      disabled={cascadeDeleteModal.imagesCount === 0}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      Delete {cascadeDeleteModal.imagesCount} image(s)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="deleteContacts"
                      disabled={cascadeDeleteModal.contactsCount === 0}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      Delete {cascadeDeleteModal.contactsCount} contact(s)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="deleteLeads"
                      disabled={cascadeDeleteModal.leadsCount === 0}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      Delete {cascadeDeleteModal.leadsCount} lead(s)
                    </span>
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-secondary border-border text-foreground hover:bg-muted"
                    onClick={() => setShowCascadeDeleteModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                    onClick={handleConfirmCascadeDelete}
                  >
                    Delete Category
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 max-h-screen overflow-y-auto">
          <Card className="w-full max-w-md bg-card border-border my-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Add New Contact</h2>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={contactForm.company_name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, company_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Mobile Number (with country code) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={contactForm.mobile_number}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, mobile_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={contactForm.category_id}
                    onChange={(e) => handleContactCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sub-Category</label>
                  <select
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50"
                    value={contactForm.subcategory_id}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, subcategory_id: e.target.value })
                    }
                    disabled={!contactForm.category_id || contactSubcategories.length === 0}
                  >
                    <option value="">
                      --{" "}
                      {contactForm.category_id
                        ? "Select Sub-Category (Optional)"
                        : "Select Category First"}{" "}
                      --
                    </option>
                    {contactSubcategories.map((subcat) => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-xs text-muted-foreground">
                    Select a category first to see subcategories
                  </small>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sales Person Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={contactForm.sales_person_name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, sales_person_name: e.target.value })
                    }
                    placeholder="Enter sales person name manually"
                  />
                  <small className="text-xs text-muted-foreground">
                    Manually enter the sales person name
                  </small>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={contactForm.status}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        status: e.target.value as Contact["status"],
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Add Contact
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-secondary border-border text-foreground hover:bg-muted"
                    onClick={() => setShowAddContactModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


