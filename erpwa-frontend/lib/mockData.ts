// Mock data for frontend development (no backend connection)
import type { Category, Contact, Lead, GalleryImage } from './types'

// In-memory data stores (simulating database)
let mockCategories: Category[] = [
    {
        id: 1,
        name: 'Electronics',
        subcategories: [
            { id: 11, name: 'Mobile Phones', parent: 1 },
            { id: 12, name: 'Laptops', parent: 1 },
            { id: 13, name: 'Tablets', parent: 1 },
        ],
        get_subcategories_count: 3,
        get_contacts_count: 15,
    },
    {
        id: 2,
        name: 'Fashion',
        subcategories: [
            { id: 21, name: 'Men', parent: 2 },
            { id: 22, name: 'Women', parent: 2 },
            { id: 23, name: 'Kids', parent: 2 },
        ],
        get_subcategories_count: 3,
        get_contacts_count: 8,
    },
    {
        id: 3,
        name: 'Watches',
        subcategories: [
            { id: 31, name: 'Analog', parent: 3 },
            { id: 32, name: 'Digital', parent: 3 },
        ],
        get_subcategories_count: 2,
        get_contacts_count: 4,
    },
    {
        id: 4,
        name: 'Clothes',
        subcategories: [
            { id: 41, name: 'T-Shirt', parent: 4 },
            { id: 42, name: 'Pants', parent: 4 },
        ],
        get_subcategories_count: 2,
        get_contacts_count: 12,
    },
]

let mockContacts: Contact[] = [
    {
        id: 1,
        company_name: 'ABC Corp',
        mobile_number: '+1234567890',
        category: 1,
        category_name: 'Electronics',
        sub_category: 11,
        sub_category_name: 'Mobile Phones',
        sales_person_name: 'John Doe',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
    },
    {
        id: 2,
        company_name: 'XYZ Ltd',
        mobile_number: '+9876543210',
        category: 1,
        category_name: 'Electronics',
        sub_category: 12,
        sub_category_name: 'Laptops',
        sales_person_name: 'Jane Smith',
        status: 'pending',
        created_at: '2024-01-14T14:20:00Z',
    },
    {
        id: 3,
        company_name: 'Tech Solutions',
        mobile_number: '+1112223333',
        category: 1,
        category_name: 'Electronics',
        sub_category: 11,
        sub_category_name: 'Mobile Phones',
        sales_person_name: 'John Doe',
        status: 'active',
        created_at: '2024-01-13T09:15:00Z',
    },
    {
        id: 4,
        company_name: 'Fashion Hub',
        mobile_number: '+4445556666',
        category: 2,
        category_name: 'Fashion',
        sub_category: 21,
        sub_category_name: 'Men',
        sales_person_name: 'Alice Johnson',
        status: 'inactive',
        created_at: '2024-01-12T16:45:00Z',
    },
    {
        id: 5,
        company_name: 'Style Co',
        mobile_number: '+7778889999',
        category: 2,
        category_name: 'Fashion',
        sub_category: 22,
        sub_category_name: 'Women',
        sales_person_name: 'Bob Williams',
        status: 'closed',
        created_at: '2024-01-11T11:30:00Z',
    },
]

let mockLeads: Lead[] = [
    {
        id: 1,
        company_name: 'Tech Solutions',
        mobile_number: '+1112223333',
        category: 1,
        category_name: 'Electronics',
        sub_category: 11,
        sub_category_name: 'Mobile Phones',
        sales_person_name: 'John Doe',
        status: 'new',
        created_at: '2024-01-15T10:30:00Z',
    },
    {
        id: 2,
        company_name: 'Fashion Hub',
        mobile_number: '+4445556666',
        category: 2,
        category_name: 'Fashion',
        sub_category: 21,
        sub_category_name: 'Men',
        sales_person_name: 'Jane Smith',
        status: 'contacted',
        created_at: '2024-01-14T14:20:00Z',
    },
    {
        id: 3,
        company_name: 'Digital World',
        mobile_number: '+5556667777',
        category: 1,
        category_name: 'Electronics',
        sub_category: 12,
        sub_category_name: 'Laptops',
        sales_person_name: 'John Doe',
        status: 'qualified',
        created_at: '2024-01-13T09:15:00Z',
    },
    {
        id: 4,
        company_name: 'Watch Masters',
        mobile_number: '+6667778888',
        category: 3,
        category_name: 'Watches',
        sub_category: 31,
        sub_category_name: 'Analog',
        sales_person_name: 'Alice Johnson',
        status: 'converted',
        created_at: '2024-01-12T16:45:00Z',
    },
    {
        id: 5,
        company_name: 'Style Plus',
        mobile_number: '+7778889999',
        category: 2,
        category_name: 'Fashion',
        sub_category: 22,
        sub_category_name: 'Women',
        sales_person_name: 'Bob Williams',
        status: 'lost',
        created_at: '2024-01-11T11:30:00Z',
    },
]

let mockGalleryImages: GalleryImage[] = [
    {
        id: 1,
        url: 'https://via.placeholder.com/300x200?text=Image+1',
        s3_url: 'https://via.placeholder.com/300x200?text=Image+1',
        title: 'Product Image 1',
        description: 'This is a sample product image with detailed description',
        price: 99.99,
        price_currency: 'USD',
        get_display_price: 'USD 99.99',
        price_display: 'USD 99.99',
        category: 1,
        category_name: 'Electronics',
        sub_category: 11,
        sub_category_name: 'Mobile Phones',
        created_at: '2024-01-15T10:30:00Z',
    },
    {
        id: 2,
        url: 'https://via.placeholder.com/300x200?text=Image+2',
        s3_url: 'https://via.placeholder.com/300x200?text=Image+2',
        title: 'Product Image 2',
        description: 'Another sample product image',
        price: 149.99,
        price_currency: 'USD',
        get_display_price: 'USD 149.99',
        price_display: 'USD 149.99',
        category: 1,
        category_name: 'Electronics',
        sub_category: 12,
        sub_category_name: 'Laptops',
        created_at: '2024-01-14T14:20:00Z',
    },
    {
        id: 3,
        url: 'https://via.placeholder.com/300x200?text=Image+3',
        s3_url: 'https://via.placeholder.com/300x200?text=Image+3',
        title: 'Fashion Item 1',
        price: 79.99,
        price_currency: 'USD',
        get_display_price: 'USD 79.99',
        price_display: 'USD 79.99',
        category: 2,
        category_name: 'Fashion',
        sub_category: 21,
        sub_category_name: 'Men',
        created_at: '2024-01-13T09:15:00Z',
    },
    {
        id: 4,
        url: 'https://via.placeholder.com/300x200?text=Image+4',
        s3_url: 'https://via.placeholder.com/300x200?text=Image+4',
        title: 'Watch Collection',
        description: 'Premium watch collection',
        price: 299.99,
        price_currency: 'USD',
        get_display_price: 'USD 299.99',
        price_display: 'USD 299.99',
        category: 3,
        category_name: 'Watches',
        sub_category: 31,
        sub_category_name: 'Analog',
        created_at: '2024-01-12T16:45:00Z',
    },
    {
        id: 5,
        url: 'https://via.placeholder.com/300x200?text=Image+5',
        s3_url: 'https://via.placeholder.com/300x200?text=Image+5',
        category: 4,
        category_name: 'Clothes',
        sub_category: 41,
        sub_category_name: 'T-Shirt',
        created_at: '2024-01-11T11:30:00Z',
    },
]

// Helper function to get next ID
let nextCategoryId = 100
let nextContactId = 100
let nextLeadId = 100
let nextImageId = 100

// Export functions to access and modify data
export const getMockCategories = () => [...mockCategories]
export const getMockContacts = () => [...mockContacts]
export const getMockLeads = () => [...mockLeads]
export const getMockGalleryImages = () => [...mockGalleryImages]

export const addMockCategory = (category: Omit<Category, 'id'> & { parent_id?: number }) => {
    const newCategory: Category = {
        ...category,
        id: nextCategoryId++,
        subcategories: [],
        get_subcategories_count: 0,
        get_contacts_count: 0,
    }

    if (category.parent_id) {
        // Add as subcategory
        const parent = mockCategories.find((c) => c.id === category.parent_id)
        if (parent) {
            if (!parent.subcategories) parent.subcategories = []
            parent.subcategories.push(newCategory)
            parent.get_subcategories_count = (parent.get_subcategories_count || 0) + 1
        }
    } else {
        // Add as main category
        mockCategories.push(newCategory)
    }

    return newCategory
}

export const updateMockCategory = (id: number, name: string) => {
    // Update main category
    const category = mockCategories.find((c) => c.id === id)
    if (category) {
        category.name = name
        return category
    }

    // Update subcategory
    for (const cat of mockCategories) {
        if (cat.subcategories) {
            const subcat = cat.subcategories.find((s) => s.id === id)
            if (subcat) {
                subcat.name = name
                return subcat
            }
        }
    }

    return null
}

export const deleteMockCategory = (
    id: number,
    options?: {
        delete_subcategories?: boolean
        delete_gallery?: boolean
        delete_contacts?: boolean
        delete_leads?: boolean
    }
) => {
    // Check if it's a main category or subcategory
    const mainCategory = mockCategories.find((c) => c.id === id)

    if (mainCategory) {
        // Check for dependencies
        const hasSubcategories = (mainCategory.subcategories?.length || 0) > 0
        const hasContacts = mockContacts.some((c) => c.category === id)
        const hasLeads = mockLeads.some((l) => l.category === id)
        const hasImages = mockGalleryImages.some((i) => i.category === id)

        if (hasSubcategories || hasContacts || hasLeads || hasImages) {
            if (!options || !Object.values(options).some((v) => v)) {
                return {
                    requires_cascade: true,
                    subcategories_count: mainCategory.subcategories?.length || 0,
                    contacts_count: mockContacts.filter((c) => c.category === id).length,
                    leads_count: mockLeads.filter((l) => l.category === id).length,
                    images_count: mockGalleryImages.filter((i) => i.category === id).length,
                }
            }

            // Delete based on options
            if (options.delete_subcategories) {
                mainCategory.subcategories = []
            }
            if (options.delete_contacts) {
                mockContacts = mockContacts.filter((c) => c.category !== id)
            }
            if (options.delete_leads) {
                mockLeads = mockLeads.filter((l) => l.category !== id)
            }
            if (options.delete_gallery) {
                mockGalleryImages = mockGalleryImages.filter((i) => i.category !== id)
            }
        }

        mockCategories = mockCategories.filter((c) => c.id !== id)
        return { success: true, message: 'Category deleted successfully' }
    }

    // Try to find and delete subcategory
    for (const cat of mockCategories) {
        if (cat.subcategories) {
            const subcatIndex = cat.subcategories.findIndex((s) => s.id === id)
            if (subcatIndex !== -1) {
                const hasContacts = mockContacts.some((c) => c.sub_category === id)
                const hasLeads = mockLeads.some((l) => l.sub_category === id)
                const hasImages = mockGalleryImages.some((i) => i.sub_category === id)

                if (hasContacts || hasLeads || hasImages) {
                    if (!options || !Object.values(options).some((v) => v)) {
                        return {
                            requires_cascade: true,
                            subcategories_count: 0,
                            contacts_count: mockContacts.filter((c) => c.sub_category === id).length,
                            leads_count: mockLeads.filter((l) => l.sub_category === id).length,
                            images_count: mockGalleryImages.filter((i) => i.sub_category === id).length,
                        }
                    }

                    if (options.delete_contacts) {
                        mockContacts = mockContacts.filter((c) => c.sub_category !== id)
                    }
                    if (options.delete_leads) {
                        mockLeads = mockLeads.filter((l) => l.sub_category !== id)
                    }
                    if (options.delete_gallery) {
                        mockGalleryImages = mockGalleryImages.filter((i) => i.sub_category !== id)
                    }
                }

                cat.subcategories.splice(subcatIndex, 1)
                cat.get_subcategories_count = (cat.get_subcategories_count || 0) - 1
                return { success: true, message: 'Subcategory deleted successfully' }
            }
        }
    }

    return { success: false, error: 'Category not found' }
}

export const addMockContact = (contact: Omit<Contact, 'id' | 'created_at'>) => {
    const newContact: Contact = {
        ...contact,
        id: nextContactId++,
        created_at: new Date().toISOString(),
    }
    mockContacts.push(newContact)

    // Update category contact count
    if (contact.category) {
        const category = mockCategories.find((c) => c.id === contact.category)
        if (category) {
            category.get_contacts_count = (category.get_contacts_count || 0) + 1
        }
    }

    return newContact
}

export const updateMockContact = (id: number, updates: Partial<Contact>) => {
    const contact = mockContacts.find((c) => c.id === id)
    if (contact) {
        Object.assign(contact, updates)
        return { success: true, ...contact }
    }
    return { success: false, error: 'Contact not found' }
}

export const deleteMockContact = (id: number) => {
    const contact = mockContacts.find((c) => c.id === id)
    if (contact) {
        mockContacts = mockContacts.filter((c) => c.id !== id)

        // Update category contact count
        if (contact.category) {
            const category = mockCategories.find((c) => c.id === contact.category)
            if (category) {
                category.get_contacts_count = Math.max(0, (category.get_contacts_count || 0) - 1)
            }
        }

        return { success: true, message: 'Contact deleted successfully' }
    }
    return { success: false, error: 'Contact not found' }
}

export const addMockLeads = (leads: Array<Omit<Lead, 'id' | 'created_at'>>) => {
    const newLeads = leads.map((lead) => ({
        ...lead,
        id: nextLeadId++,
        created_at: new Date().toISOString(),
    }))
    mockLeads.push(...newLeads)
    return newLeads
}

export const updateMockLead = (id: number, updates: Partial<Lead>) => {
    const lead = mockLeads.find((l) => l.id === id)
    if (lead) {
        Object.assign(lead, updates)
        // Update category/subcategory names if IDs changed
        if (updates.category !== undefined) {
            const category = mockCategories.find((c) => c.id === updates.category)
            lead.category_name = category?.name || '--'
        }
        if (updates.sub_category !== undefined) {
            for (const cat of mockCategories) {
                if (cat.subcategories) {
                    const subcat = cat.subcategories.find((s) => s.id === updates.sub_category)
                    if (subcat) {
                        lead.sub_category_name = subcat.name
                        break
                    }
                }
            }
        }
        return { success: true, ...lead }
    }
    return { success: false, error: 'Lead not found' }
}

export const deleteMockLead = (id: number) => {
    mockLeads = mockLeads.filter((l) => l.id !== id)
    return { success: true, message: 'Lead deleted successfully' }
}

export const addMockGalleryImages = (images: Array<Omit<GalleryImage, 'id' | 'created_at'>>) => {
    const newImages = images.map((image) => ({
        ...image,
        id: nextImageId++,
        created_at: new Date().toISOString(),
        url: image.url || image.s3_url || image.image_url || 'https://via.placeholder.com/300x200',
        s3_url: image.s3_url || image.url || image.image_url || 'https://via.placeholder.com/300x200',
    }))
    mockGalleryImages.push(...newImages)
    return newImages
}

export const updateMockGalleryImage = (id: number, updates: Partial<GalleryImage>) => {
    const image = mockGalleryImages.find((i) => i.id === id)
    if (image) {
        Object.assign(image, updates)
        if (updates.price !== undefined && updates.price_currency) {
            image.get_display_price = `${updates.price_currency} ${updates.price.toFixed(2)}`
            image.price_display = `${updates.price_currency} ${updates.price.toFixed(2)}`
        }
        return { success: true, ...image }
    }
    return { success: false, error: 'Image not found' }
}

export const deleteMockGalleryImages = (ids: number[]) => {
    const deletedIds: number[] = []
    ids.forEach((id) => {
        const index = mockGalleryImages.findIndex((i) => i.id === id)
        if (index !== -1) {
            mockGalleryImages.splice(index, 1)
            deletedIds.push(id)
        }
    })
    return { success: true, deleted_ids: deletedIds, message: `Deleted ${deletedIds.length} image(s)` }
}

