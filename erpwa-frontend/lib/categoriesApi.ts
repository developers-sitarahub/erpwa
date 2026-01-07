// Real API wrapper for categories - connects to backend
import api from './api'
import type { ApiResponse, Category, Contact } from './types'

export const categoriesAPI = {
    /**
     * List all categories with subcategories
     */
    list: async (): Promise<ApiResponse<Category[]>> => {
        const response = await api.get('/categories')
        return { data: response.data.data || response.data }
    },

    /**
     * Get category by ID with subcategories
     */
    detail: async (id: number): Promise<ApiResponse<Category>> => {
        const response = await api.get(`/categories/${id}`)
        return { data: response.data.data || response.data }
    },

    /**
     * Create category or subcategory
     */
    create: async (data: FormData): Promise<ApiResponse<any>> => {
        // Convert FormData to object for JSON request
        const body: any = {}
        if (data.get('category_name')) body.category_name = data.get('category_name')
        if (data.get('subcategory_name')) body.subcategory_name = data.get('subcategory_name')
        if (data.get('parent_id')) body.parent_id = data.get('parent_id')

        const response = await api.post('/categories', body)
        return { data: response.data }
    },

    /**
     * Update category name
     */
    update: async (id: number, data: FormData): Promise<ApiResponse<any>> => {
        const body: any = {}
        if (data.get('name')) body.name = data.get('name')

        const response = await api.put(`/categories/${id}`, body)
        return { data: response.data }
    },

    /**
     * Delete category with cascade options
     */
    delete: async (
        id: number,
        options?: {
            delete_subcategories?: boolean
            delete_gallery?: boolean
            delete_contacts?: boolean
            delete_leads?: boolean
        }
    ): Promise<ApiResponse<any>> => {
        const params = new URLSearchParams()
        if (options?.delete_subcategories) params.append('delete_subcategories', 'true')
        if (options?.delete_gallery) params.append('delete_gallery', 'true')
        if (options?.delete_contacts) params.append('delete_contacts', 'true')
        if (options?.delete_leads) params.append('delete_leads', 'true')

        const queryString = params.toString()
        const url = `/categories/${id}${queryString ? `?${queryString}` : ''}`

        try {
            const response = await api.delete(url)
            return { data: response.data }
        } catch (error: any) {
            // If it's a cascade delete requirement, return the error response
            if (error.response?.status === 400 && error.response?.data?.requires_cascade) {
                return { data: error.response.data }
            }
            throw error
        }
    },

    /**
     * Get contacts for a category/subcategory
     * Only calls API if at least one valid ID is provided
     */
    getContacts: async (
        categoryId?: number,
        subcategoryId?: number
    ): Promise<ApiResponse<{ count: number; contacts: Contact[] }>> => {
        const params = new URLSearchParams()

        const validCategoryId = categoryId && !isNaN(categoryId) && categoryId > 0 ? categoryId : undefined
        const validSubcategoryId = subcategoryId && !isNaN(subcategoryId) && subcategoryId > 0 ? subcategoryId : undefined

        if (validCategoryId) params.append('category_id', validCategoryId.toString())
        if (validSubcategoryId) params.append('subcategory_id', validSubcategoryId.toString())

        const queryString = params.toString()
        const url = `/categories/contacts?${queryString}`

        try {
            const response = await api.get(url)
            return { data: response.data.data || response.data }
        } catch (error: any) {
            // Always return empty on error instead of throwing (prevents UI errors)
            console.warn('Error fetching contacts:', error.response?.data?.error || error.message, { categoryId, subcategoryId })
            return { data: { count: 0, contacts: [] } }
        }
    },

    /**
     * Create a contact
     */
    createContact: async (data: FormData): Promise<ApiResponse<any>> => {
        const body: any = {}
        if (data.get('company_name')) body.company_name = data.get('company_name')
        if (data.get('mobile_number')) body.mobile_number = data.get('mobile_number')
        if (data.get('category_id')) body.category_id = data.get('category_id')
        if (data.get('subcategory_id')) body.subcategory_id = data.get('subcategory_id')
        if (data.get('sales_person_name')) body.sales_person_name = data.get('sales_person_name')
        if (data.get('status')) body.status = data.get('status')

        const response = await api.post('/categories/contacts', body)
        return { data: response.data }
    },

    /**
     * Update a contact
     */
    updateContact: async (id: number, data: FormData): Promise<ApiResponse<any>> => {
        const body: any = {}
        if (data.get('status')) body.status = data.get('status')
        if (data.get('company_name')) body.company_name = data.get('company_name')
        if (data.get('mobile_number')) body.mobile_number = data.get('mobile_number')
        if (data.get('category_id')) body.category_id = data.get('category_id')
        if (data.get('subcategory_id')) body.subcategory_id = data.get('subcategory_id')
        if (data.get('sales_person_name')) body.sales_person_name = data.get('sales_person_name')

        const response = await api.put(`/categories/contacts/${id}`, body)
        return { data: response.data }
    },

    /**
     * Delete a contact
     */
    deleteContact: async (id: number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/categories/contacts/${id}`)
        return { data: response.data }
    },
}
