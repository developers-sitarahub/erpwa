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
import { Plus, Edit2, Trash2, Upload, X, Images as ImagesIcon, FolderOpen, Loader2, ChevronDown } from "lucide-react"
import { categoriesAPI } from "@/lib/categoriesApi"
import { galleryAPI } from "@/lib/galleryApi"
import type { Category, GalleryImage } from "@/lib/types"
import { toast } from "react-toastify"

export default function GalleryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Upload form states
  const [uploadForm, setUploadForm] = useState({
    category_id: "",
    subcategory_id: "",
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploadSubcategories, setUploadSubcategories] = useState<Category[]>([])

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    price_currency: "USD",
  })

  // Bulk selection
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      setCurrentPage(1)
      loadImages(1, false)
    }
  }, [selectedCategory, selectedSubcategory])

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data || [])
    } catch (error: any) {
      toast.error("Failed to load categories")
    }
  }

  const loadImages = async (page: number = 1, append: boolean = false) => {
    if (!selectedCategory) return
    try {
      if (!append) {
        setLoading(true)
      }
      const response = await galleryAPI.list(
        selectedCategory,
        selectedSubcategory || undefined,
        page
      )
      const newImages = response.data?.images || []
      if (append) {
        setImages([...images, ...newImages])
      } else {
        setImages(newImages)
      }
      setHasMore(response.data?.hasMore || false)
      setCurrentPage(page)
    } catch (error: any) {
      toast.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  const loadMoreImages = () => {
    if (hasMore && !loading) {
      loadImages(currentPage + 1, true)
    }
  }

  const loadSubcategories = async (categoryId: number) => {
    try {
      const response = await categoriesAPI.detail(categoryId)
      setUploadSubcategories(response.data.subcategories || [])
    } catch (error) {
      setUploadSubcategories([])
    }
  }

  const handleCategoryClick = async (categoryId: number) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
    const response = await categoriesAPI.detail(categoryId)
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      category.subcategories = response.data.subcategories || []
      setCategories([...categories])
    }
  }

  const handleSubcategoryClick = (subcategoryId: number) => {
    setSelectedSubcategory(subcategoryId)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedImages.length || !uploadForm.category_id) {
      toast.error("Please select category and images")
      return
    }

    if (selectedImages.length > 500) {
      toast.error("Maximum 500 images allowed per upload")
      return
    }

    try {
      const formData = new FormData()
      formData.append("category_id", uploadForm.category_id)
      if (uploadForm.subcategory_id) {
        formData.append("subcategory_id", uploadForm.subcategory_id)
      }
      selectedImages.forEach((file) => {
        formData.append("images", file)
      })

      const response = await galleryAPI.upload(formData)

      if (response.data?.success !== false) {
        toast.success(`Successfully uploaded ${selectedImages.length} image(s)!`)
        setSelectedImages([])
        setUploadForm({ category_id: "", subcategory_id: "" })
        setUploadSubcategories([])
        setCurrentPage(1)
        await loadImages(1, false)
      } else {
        toast.error("Failed to upload images")
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to upload images"
      toast.error(errorMsg)
      console.error("Image upload error:", error)
    }
  }

  const handleDeleteImage = async (imageId: number, imageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${imageTitle}"?`)) {
      return
    }
    try {
      await galleryAPI.delete([imageId])
      toast.success("Image deleted successfully!")
      await loadImages()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete image")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedImageIds.length === 0) {
      toast.error("Please select images to delete")
      return
    }
    if (!confirm(`Are you sure you want to delete ${selectedImageIds.length} image(s)?`)) {
      return
    }
    try {
      await galleryAPI.delete(selectedImageIds)
      toast.success(`Successfully deleted ${selectedImageIds.length} image(s)!`)
      setSelectedImageIds([])
      await loadImages()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete images")
    }
  }

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image)
    setEditForm({
      title: image.title || "",
      description: image.description || "",
      price: image.price?.toString() || "",
      price_currency: image.price_currency || "USD",
    })
    setShowEditModal(true)
  }

  const handleUpdateImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingImage) return

    try {
      const formData = new FormData()
      formData.append("title", editForm.title.trim())
      formData.append("description", editForm.description.trim())
      if (editForm.price) {
        formData.append("price", editForm.price)
      }
      formData.append("price_currency", editForm.price_currency)

      const response = await galleryAPI.update(editingImage.id, formData)

      if (response.data?.success !== false) {
        toast.success("Image updated successfully!")
        setShowEditModal(false)
        setEditingImage(null)
        await loadImages()
      } else {
        toast.error("Failed to update image")
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update image"
      toast.error(errorMsg)
      console.error("Image update error:", error)
    }
  }

  const getImageUrl = (image: GalleryImage) => {
    return image.s3_url || image.url || image.image_url || image.image?.url || ""
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)
  const subcategories = selectedCategoryData?.subcategories || []

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Gallery Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and manage images across categories
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Upload Images</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={uploadForm.category_id}
                    onChange={(e) => {
                      setUploadForm({ ...uploadForm, category_id: e.target.value, subcategory_id: "" })
                      if (e.target.value) {
                        loadSubcategories(parseInt(e.target.value))
                      } else {
                        setUploadSubcategories([])
                      }
                    }}
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

                {uploadSubcategories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Sub-Category (Optional)
                    </label>
                    <select
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={uploadForm.subcategory_id}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, subcategory_id: e.target.value })
                      }
                    >
                      <option value="">All sub-categories</option>
                      {uploadSubcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Images (Max 500)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 500) {
                        toast.error("Maximum 500 images allowed")
                        return
                      }
                      setSelectedImages(files)
                    }}
                    disabled={!uploadForm.category_id}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white file:cursor-pointer disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedImages.length > 0
                      ? `${selectedImages.length} file(s) selected`
                      : "Select category first"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={!uploadForm.category_id || selectedImages.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Category Navigation */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Categories</h3>
          </CardHeader>
          <CardContent>
            {/* Categories */}
            <div className="flex flex-wrap gap-4 justify-start">
              {categories.map((category) => (
                <div key={category.id} className="text-center">
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-colors ${selectedCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-secondary text-foreground hover:bg-primary/20"
                      }`}
                  >
                    <FolderOpen className="w-6 h-6" />
                    <span className="font-medium">{category.name}</span>
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-muted-foreground">No categories found. Create categories first.</p>
              )}
            </div>

            {/* Subcategories (Separate Block) */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3 text-left">Sub-Categories</h4>
                <div className="flex flex-wrap gap-2 justify-start">
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat.id}
                      onClick={() => handleSubcategoryClick(subcat.id)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${selectedSubcategory === subcat.id
                        ? "bg-primary text-white shadow-md"
                        : "bg-secondary border border-border text-foreground hover:bg-muted/70"
                        }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      {subcat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Gallery */}
        {selectedCategory ? (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Images
                  {selectedCategoryData && (
                    <>
                      {" - "}
                      {selectedCategoryData.name}
                      {selectedSubcategory &&
                        ` > ${subcategories.find((s) => s.id === selectedSubcategory)?.name}`}
                    </>
                  )}
                </h3>
              </div>
              {selectedImageIds.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedImageIds.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading images...</p>
                </div>
              ) : images.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative rounded-lg border-2 border-border overflow-hidden hover:border-primary transition-colors bg-card"
                      >
                        {/* Checkbox */}
                        <div className="absolute top-2 left-2 z-10 bg-card/90 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedImageIds.includes(image.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedImageIds([...selectedImageIds, image.id])
                              } else {
                                setSelectedImageIds(selectedImageIds.filter((id) => id !== image.id))
                              }
                            }}
                            className="w-4 h-4 cursor-pointer rounded border-border"
                          />
                        </div>

                        {/* Image */}
                        <img
                          src={getImageUrl(image)}
                          alt={image.title || "Gallery Image"}
                          className="w-full h-48 object-cover group-hover:opacity-75 transition-opacity"
                          loading="lazy"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditImage(image)}
                            className="p-2 bg-primary hover:bg-primary/90 rounded-full text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id, image.title || "Image")}
                            className="p-2 bg-destructive hover:bg-destructive/90 rounded-full text-white transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="p-2 bg-card border-t border-border">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {image.title || "Untitled"}
                          </h4>
                          {image.price && (
                            <p className="text-sm text-primary font-semibold">
                              {image.price_display || image.get_display_price || `${image.price} ${image.price_currency}`}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {image.sub_category_name
                              ? `${image.category_name} > ${image.sub_category_name}`
                              : image.category_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && images.length >= 50 && (
                    <div className="text-center mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={loadMoreImages}
                        disabled={loading}
                        className="bg-secondary border-border text-foreground hover:bg-muted"
                      >
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <ImagesIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No images in this category yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a category to view images</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 max-h-screen overflow-y-auto">
          <Card className="w-full max-w-md bg-card border-border my-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Edit Image</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingImage(null)
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateImage} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <input
                    placeholder="Enter image title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    placeholder="Enter image description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Currency</label>
                    <select
                      value={editForm.price_currency}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price_currency: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                      <option>INR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Update Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-secondary border-border text-foreground hover:bg-muted"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingImage(null)
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
    </div>
  )
}



