// Mock API functions for frontend development
import {
    getMockCategories,
    getMockContacts,
    getMockLeads,
    getMockGalleryImages,
    addMockCategory,
    updateMockCategory,
    deleteMockCategory,
    addMockContact,
    updateMockContact,
    deleteMockContact,
    addMockLeads,
    updateMockLead,
    deleteMockLead,
    addMockGalleryImages,
    updateMockGalleryImage,
    deleteMockGalleryImages,
} from './mockData'
import type { Category, Contact, Lead, GalleryImage } from './types'

// Simulate network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock API responses
const mockResponse = <T>(data: T) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
})

const mockError = (message: string, status: number = 400) => {
    const error: any = new Error(message)
    error.response = {
        data: { error: message },
        status,
        statusText: 'Error',
    }
    return Promise.reject(error)
}

export const mockCategoriesAPI = {
    list: async () => {
        await delay()
        const categories = getMockCategories()
        return mockResponse(categories)
    },

    detail: async (id: number) => {
        await delay()
        const category = getMockCategories().find((c) => c.id === id)
        if (!category) {
            return mockError('Category not found', 404)
        }

        return mockResponse({
            id: category.id,
            name: category.name,
            subcategories: category.subcategories || [],
        })
    },

    create: async (data: FormData) => {
        await delay()
        const categoryName = data.get('category_name') as string
        const subcategoryName = data.get('subcategory_name') as string
        const parentId = data.get('parent_id') ? parseInt(data.get('parent_id') as string) : undefined

        if (!categoryName) {
            return mockError('Category name is required', 400)
        }

        if (subcategoryName && !parentId) {
            return mockError('Parent category is required for subcategory', 400)
        }

        if (subcategoryName && parentId) {
            addMockCategory({ name: subcategoryName, parent_id: parentId })
        } else {
            addMockCategory({ name: categoryName })
        }

        return mockResponse({ success: true })
    },

    update: async (id: number, data: FormData) => {
        await delay()
        const name = data.get('name') as string

        if (!name) {
            return mockError('Category name is required', 400)
        }

        const updated = updateMockCategory(id, name)
        if (!updated) {
            return mockError('Category not found', 404)
        }

        return mockResponse({ success: true })
    },

    delete: async (
        id: number,
        deleteOptions?: {
            delete_subcategories?: boolean
            delete_gallery?: boolean
            delete_contacts?: boolean
            delete_leads?: boolean
        }
    ) => {
        await delay()
        const result = deleteMockCategory(id, deleteOptions)

        if (result.requires_cascade) {
            return mockError(JSON.stringify(result), 400)
        }

        if (result.success) {
            return mockResponse(result)
        }

        return mockError(result.error || 'Failed to delete category', 404)
    },

    getContacts: async (categoryId?: number, subcategoryId?: number) => {
        await delay()
        let contacts = getMockContacts()

        if (categoryId) {
            contacts = contacts.filter((c) => c.category === categoryId)
        }
        if (subcategoryId) {
            contacts = contacts.filter((c) => c.sub_category === subcategoryId)
        }

        return mockResponse({
            contacts,
            count: contacts.length,
        })
    },

    createContact: async (data: FormData) => {
        await delay()
        const categoryId = parseInt(data.get('category_id') as string)
        const subcategoryId = data.get('subcategory_id')
            ? parseInt(data.get('subcategory_id') as string)
            : undefined

        const category = getMockCategories().find((c) => c.id === categoryId)
        let subcategoryName: string | undefined
        if (subcategoryId && category) {
            subcategoryName = category.subcategories?.find((s) => s.id === subcategoryId)?.name
        }

        const contact = addMockContact({
            company_name: data.get('company_name') as string,
            mobile_number: data.get('mobile_number') as string,
            category: categoryId,
            category_name: category?.name,
            sub_category: subcategoryId,
            sub_category_name: subcategoryName,
            sales_person_name: (data.get('sales_person_name') as string) || '',
            status: (data.get('status') as Contact['status']) || 'pending',
        })

        return mockResponse({ success: true, contact })
    },

    updateContact: async (id: number, data: FormData) => {
        await delay()
        const status = data.get('status') as Contact['status']
        const result = updateMockContact(id, { status })

        if (result.success) {
            return mockResponse(result)
        }

        return mockError(result.error || 'Failed to update contact', 404)
    },

    deleteContact: async (id: number) => {
        await delay()
        const result = deleteMockContact(id)

        if (result.success) {
            return mockResponse(result)
        }

        return mockError(result.error || 'Failed to delete contact', 404)
    },
}

export const mockLeadsAPI = {
    list: async (categoryId?: number, subcategoryId?: number) => {
        await delay()
        let leads = getMockLeads()

        if (categoryId) {
            leads = leads.filter((l) => l.category === categoryId)
        }
        if (subcategoryId) {
            leads = leads.filter((l) => l.sub_category === subcategoryId)
        }

        return mockResponse({ leads })
    },

    createManual: async (data: FormData) => {
        await delay()
        const categoryId = parseInt(data.get('category_id') as string)
        const subcategoryId = parseInt(data.get('subcategory_id') as string)
        const salesPersonName = (data.get('sales_person_name') as string) || ''
        const leadsText = data.get('leads_text') as string
        const separator = (data.get('separator') as string) || '|'

        const category = getMockCategories().find((c) => c.id === categoryId)
        const subcategoryName = category?.subcategories?.find((s) => s.id === subcategoryId)?.name

        const lines = leadsText.split('\n').filter((line) => line.trim())
        const newLeads: Array<Omit<Lead, 'id' | 'created_at'>> = []

        for (const line of lines) {
            const parts = line.split(separator).map((p) => p.trim())
            if (parts.length >= 2) {
                newLeads.push({
                    company_name: parts[0],
                    mobile_number: parts[1],
                    category: categoryId,
                    category_name: category?.name,
                    sub_category: subcategoryId,
                    sub_category_name: subcategoryName,
                    sales_person_name: salesPersonName,
                    status: 'new',
                })
            }
        }

        if (newLeads.length > 0) {
            addMockLeads(newLeads)
            return mockResponse({ success: true, count: newLeads.length })
        }

        return mockError('No valid leads found', 400)
    },

    uploadFile: async (data: FormData) => {
        await delay()
        // Simulate file parsing - in real app, this would parse Excel/CSV
        const file = data.get('leads_file') as File

        // Store preview in sessionStorage (simulating Django session)
        const preview = [
            { 'Company Name': 'Sample Company 1', 'Mobile Number': '+1234567890' },
            { 'Company Name': 'Sample Company 2', 'Mobile Number': '+9876543210' },
        ]

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('leads_preview', JSON.stringify(preview))
            sessionStorage.setItem('leads_total_count', '2')
        }

        return mockResponse({
            success: true,
            preview,
            total_count: 2,
        })
    },

    confirmImport: async (data: FormData) => {
        await delay()
        const categoryId = parseInt(data.get('category_id') as string)
        const subcategoryId = parseInt(data.get('subcategory_id') as string)
        const salesPersonName = (data.get('sales_person_name') as string) || ''

        // Get preview from sessionStorage
        let preview: any[] = []
        if (typeof window !== 'undefined') {
            const previewStr = sessionStorage.getItem('leads_preview')
            if (previewStr) {
                preview = JSON.parse(previewStr)
            }
        }

        const category = getMockCategories().find((c) => c.id === categoryId)
        const subcategoryName = category?.subcategories?.find((s) => s.id === subcategoryId)?.name

        const newLeads: Array<Omit<Lead, 'id' | 'created_at'>> = preview.map((row: any) => ({
            company_name: row['Company Name'] || '',
            mobile_number: row['Mobile Number'] || '',
            category: categoryId,
            category_name: category?.name,
            sub_category: subcategoryId,
            sub_category_name: subcategoryName,
            sales_person_name: salesPersonName,
            status: 'new',
        }))

        if (newLeads.length > 0) {
            addMockLeads(newLeads)
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('leads_preview')
                sessionStorage.removeItem('leads_total_count')
            }
            return mockResponse({ success: true, count: newLeads.length })
        }

        return mockError('No leads to import', 400)
    },

    update: async (id: number, data: FormData) => {
        await delay()
        const updates: Partial<Lead> = {}

        if (data.get('category')) {
            const categoryId = parseInt(data.get('category') as string)
            const category = getMockCategories().find((c) => c.id === categoryId)
            updates.category = categoryId
            updates.category_name = category?.name
        }

        if (data.get('sub_category')) {
            const subcategoryId = parseInt(data.get('sub_category') as string)
            updates.sub_category = subcategoryId
            // Find subcategory name
            for (const cat of getMockCategories()) {
                const subcat = cat.subcategories?.find((s) => s.id === subcategoryId)
                if (subcat) {
                    updates.sub_category_name = subcat.name
                    break
                }
            }
        }

        if (data.get('sales_person_name')) {
            updates.sales_person_name = data.get('sales_person_name') as string
        }

        const result = updateMockLead(id, updates)

        if (result.success) {
            return mockResponse(result)
        }

        return mockError(result.error || 'Failed to update lead', 404)
    },

    delete: async (id: number) => {
        await delay()
        const result = deleteMockLead(id)

        if (result.success) {
            return mockResponse(result)
        }

        return mockError('Failed to delete lead', 404)
    },
}

export const mockGalleryAPI = {
    list: async (categoryId: number, subcategoryId?: number, page: number = 1) => {
        await delay()
        let images = getMockGalleryImages().filter((i) => i.category === categoryId)

        if (subcategoryId) {
            images = images.filter((i) => i.sub_category === subcategoryId)
        }

        // Pagination (50 per page)
        const pageSize = 50
        const start = (page - 1) * pageSize
        const end = start + pageSize
        const paginatedImages = images.slice(start, end)
        const hasMore = images.length > end

        return mockResponse({
            images: paginatedImages,
            has_more: hasMore,
            page,
            total: images.length,
        })
    },

    upload: async (data: FormData) => {
        await delay()
        const categoryId = parseInt(data.get('category_id') as string)
        const subcategoryId = data.get('subcategory_id')
            ? parseInt(data.get('subcategory_id') as string)
            : undefined
        const files = data.getAll('images') as File[]

        const category = getMockCategories().find((c) => c.id === categoryId)
        const subcategoryName = subcategoryId
            ? category?.subcategories?.find((s) => s.id === subcategoryId)?.name
            : undefined

        const newImages: Array<Omit<GalleryImage, 'id' | 'created_at'>> = files.map((file) => ({
            url: URL.createObjectURL(file),
            s3_url: URL.createObjectURL(file),
            category: categoryId,
            category_name: category?.name,
            sub_category: subcategoryId,
            sub_category_name: subcategoryName,
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: '',
        }))

        addMockGalleryImages(newImages)

        return mockResponse({ success: true, count: newImages.length })
    },

    update: async (id: number, data: FormData) => {
        await delay()
        const updates: Partial<GalleryImage> = {}

        if (data.get('title')) {
            updates.title = data.get('title') as string
        }
        if (data.get('description')) {
            updates.description = data.get('description') as string
        }
        if (data.get('price')) {
            updates.price = parseFloat(data.get('price') as string)
        }
        if (data.get('price_currency')) {
            updates.price_currency = data.get('price_currency') as string
        }

        const result = updateMockGalleryImage(id, updates)

        if (result.success) {
            return mockResponse(result)
        }

        return mockError(result.error || 'Failed to update image', 404)
    },

    delete: async (ids: number[]) => {
        await delay()
        const result = deleteMockGalleryImages(ids)

        if (result.success) {
            return mockResponse(result)
        }

        return mockError('Failed to delete images', 404)
    },
}

