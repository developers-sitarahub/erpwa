// Real API wrapper for leads - connects to backend
import api from './api'
import type { ApiResponse, Lead } from './types'
import ExcelJS from 'exceljs'

export const leadsAPI = {
    /**
     * List all leads with optional filtering
     * Returns { leads: Lead[], total: number, status_counts: Record<string, number> }
     */
    list: async (
        categoryId?: number,
        subcategoryId?: number,
        status?: string
    ): Promise<ApiResponse<{ leads: Lead[]; total: number; status_counts: Record<string, number> }>> => {
        const params = new URLSearchParams()
        if (categoryId) params.append('category_id', categoryId.toString())
        if (subcategoryId) params.append('subcategory_id', subcategoryId.toString())
        if (status) params.append('status', status)

        const queryString = params.toString()
        const url = `/leads-management${queryString ? `?${queryString}` : ''}`

        const response = await api.get(url)
        // Backend returns { data: { leads: [...], total: number, status_counts: {...} } }
        return { data: response.data.data || response.data }
    },

    /**
     * Get lead by ID
     */
    detail: async (id: number): Promise<ApiResponse<Lead>> => {
        const response = await api.get(`/leads-management/${id}`)
        return { data: response.data.data || response.data }
    },

    /**
     * Create a single lead
     */
    create: async (data: FormData): Promise<ApiResponse<any>> => {
        const body: any = {}
        if (data.get('company_name')) body.company_name = data.get('company_name')
        if (data.get('mobile_number')) body.mobile_number = data.get('mobile_number')
        if (data.get('email')) body.email = data.get('email')
        if (data.get('city')) body.city = data.get('city')
        if (data.get('category_id')) body.category_id = data.get('category_id')
        if (data.get('subcategory_id')) body.subcategory_id = data.get('subcategory_id')
        if (data.get('sales_person_name')) body.sales_person_name = data.get('sales_person_name')
        if (data.get('status')) body.status = data.get('status')

        const response = await api.post('/leads-management', body)
        return { data: response.data }
    },

    /**
     * Bulk create leads
     */
    bulkCreate: async (leads: any[]): Promise<ApiResponse<any>> => {
        const response = await api.post('/leads-management/bulk', { leads })
        return { data: response.data }
    },

    /**
     * Update a lead
     */
    update: async (id: number, data: FormData): Promise<ApiResponse<any>> => {
        const body: any = {}
        if (data.get('company_name')) body.company_name = data.get('company_name')
        if (data.get('mobile_number')) body.mobile_number = data.get('mobile_number')
        if (data.get('email')) body.email = data.get('email')
        if (data.get('city')) body.city = data.get('city')
        if (data.get('category_id')) body.category_id = data.get('category_id')
        if (data.get('subcategory_id')) body.subcategory_id = data.get('subcategory_id')
        if (data.get('sales_person_name')) body.sales_person_name = data.get('sales_person_name')
        if (data.get('status')) body.status = data.get('status')

        const response = await api.put(`/leads-management/${id}`, body)
        return { data: response.data }
    },

    /**
     * Bulk update leads
     */
    bulkUpdate: async (leadIds: number[], data: any): Promise<ApiResponse<any>> => {
        const response = await api.put('/leads-management/bulk', {
            lead_ids: leadIds,
            ...data,
        })
        return { data: response.data }
    },

    /**
     * Delete a lead
     */
    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/leads-management/${id}`)
        return { data: response.data }
    },

    /**
     * Bulk delete leads
     */
    bulkDelete: async (leadIds: number[]): Promise<ApiResponse<any>> => {
        const response = await api.delete('/leads-management/bulk', {
            data: { lead_ids: leadIds },
        })
        return { data: response.data }
    },

    /**
     * Create leads from manual text input
     * Parses text with separator (default: |) and creates multiple leads
     */
    createManual: async (data: FormData): Promise<ApiResponse<any>> => {
        const leadsText = data.get('leads_text') as string
        const separator = (data.get('separator') as string) || '|'
        const categoryId = data.get('category_id') as string
        const subcategoryId = data.get('subcategory_id') as string
        const salesPersonName = data.get('sales_person_name') as string

        if (!leadsText || !categoryId) {
            throw new Error('Leads text and category are required')
        }

        // Parse the text into leads
        const lines = leadsText.split('\n').filter(line => line.trim())
        const leads = []

        for (const line of lines) {
            const parts = line.split(separator).map(p => p.trim())
            if (parts.length >= 2) {
                // Format: company_name | phone_number | email | city
                // Phone number should be without +, with country code, no spaces
                let phoneNumber = (parts[1] || '').replace(/\+/g, '').replace(/\s/g, '')

                leads.push({
                    company_name: parts[0] || '',
                    mobile_number: phoneNumber,
                    email: parts[2] || '',
                    city: parts[3] || '',
                    category_id: categoryId,
                    subcategory_id: subcategoryId || undefined,
                    sales_person_name: salesPersonName || undefined,
                    status: 'new',
                })
            }
        }

        if (leads.length === 0) {
            throw new Error('No valid leads found in text')
        }

        // Use bulk create endpoint
        const response = await api.post('/leads-management/bulk', { leads })
        return { data: response.data }
    },

    /**
     * Upload file and return preview
     * Supports both Excel (.xlsx) and CSV files
     */
    uploadFile: async (data: FormData): Promise<ApiResponse<any>> => {
        const file = data.get('leads_file') as File

        if (!file) {
            throw new Error('File is required')
        }

        return new Promise((resolve, reject) => {
            const isCsv = file.name.toLowerCase().endsWith('.csv')
            const reader = new FileReader()

            reader.onload = async (e) => {
                try {
                    let json: any[][] = []

                    if (isCsv) {
                        const text = e.target?.result as string
                        // Simple CSV parser
                        const rows = text.split('\n')
                        json = rows.map(row => {
                            // Handle quotes? For now simple split by comma
                            // This is a basic implementation. 
                            // If complex CSV parsing is needed, a library like papaparse is recommended, 
                            // but we are avoiding adding new deps if possible.
                            return row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
                        })
                    } else {
                        const buffer = e.target?.result as ArrayBuffer
                        const workbook = new ExcelJS.Workbook()
                        await workbook.xlsx.load(buffer)

                        const worksheet = workbook.worksheets[0]
                        if (!worksheet) {
                            throw new Error('No worksheet found in file')
                        }

                        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                            // ExcelJS row.values is 1-based, index 0 is null/undefined
                            const rowValues = Array.isArray(row.values) ? row.values.slice(1) : []
                            // Convert all values to string, handling objects (like hyperlinks)
                            const stringValues = rowValues.map(val => {
                                if (val === null || val === undefined) return ''
                                // Handle hyperlink objects
                                if (typeof val === 'object' && val !== null && 'text' in val) return String(val.text)
                                // Handle rich text objects
                                if (typeof val === 'object' && val !== null && 'richText' in val) {
                                    const richTextVal = val as any
                                    return richTextVal.richText.map((rt: any) => rt.text).join('')
                                }
                                // Handle other objects by converting to JSON then string
                                if (typeof val === 'object') return JSON.stringify(val)
                                return String(val)
                            })
                            json.push(stringValues)
                        })
                    }

                    if (json.length === 0) {
                        throw new Error('File is empty or has no data')
                    }

                    // Find header row (look for "Company Name" or "Mobile Number" or similar)
                    let headerRowIndex = 0
                    const headerRow = json[0] || []

                    // Try to find column indices for: company_name, phone_number, email, city
                    let companyNameIndex = -1
                    let mobileNumberIndex = -1
                    let emailIndex = -1
                    let cityIndex = -1

                    // Check if first row looks like headers
                    const firstRowLower = headerRow.map((cell: any) => String(cell).toLowerCase().trim())

                    // Try to find Company Name column
                    companyNameIndex = firstRowLower.findIndex((cell: string) =>
                        cell.includes('company') || cell.includes('name') || cell.includes('business')
                    )

                    // Try to find Mobile Number column
                    mobileNumberIndex = firstRowLower.findIndex((cell: string) =>
                        cell.includes('mobile') || cell.includes('phone') || cell.includes('number') || cell.includes('contact')
                    )

                    // Try to find Email column
                    emailIndex = firstRowLower.findIndex((cell: string) =>
                        cell.includes('email') || cell.includes('e-mail') || cell.includes('mail')
                    )

                    // Try to find City column
                    cityIndex = firstRowLower.findIndex((cell: string) =>
                        cell.includes('city') || cell.includes('location')
                    )

                    // Default indices if not found (assume order: company, phone, email, city)
                    if (companyNameIndex === -1) companyNameIndex = 0
                    if (mobileNumberIndex === -1) mobileNumberIndex = 1
                    if (emailIndex === -1) emailIndex = 2
                    if (cityIndex === -1) cityIndex = 3

                    // Parse data rows
                    const preview: any[] = []
                    const startRow = (companyNameIndex >= 0 && mobileNumberIndex >= 0 && companyNameIndex !== mobileNumberIndex) ? 1 : 0

                    for (let i = startRow; i < json.length; i++) {
                        const row = json[i]
                        if (!row || row.length === 0) continue

                        const companyName = String(row[companyNameIndex] || '').trim()
                        let mobileNumber = String(row[mobileNumberIndex] || '').trim()
                        const email = String(row[emailIndex] || '').trim()
                        const city = String(row[cityIndex] || '').trim()

                        // Skip empty rows
                        if (!companyName && !mobileNumber) continue

                        // Clean phone number: remove + and spaces
                        mobileNumber = mobileNumber.replace(/\+/g, '').replace(/\s/g, '')

                        preview.push({
                            company_name: companyName,
                            mobile_number: mobileNumber,
                            email: email,
                            city: city,
                            // Store original row data for reference
                            'Company Name': companyName,
                            'Mobile Number': mobileNumber,
                            'Email': email,
                            'City': city,
                        })
                    }

                    if (preview.length === 0) {
                        throw new Error('No valid data found in file. Please ensure file has Company Name and Mobile Number columns.')
                    }

                    // Store in sessionStorage for confirmImport with timestamp
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('leads_preview', JSON.stringify(preview))
                        sessionStorage.setItem('leads_total_count', preview.length.toString())
                        sessionStorage.setItem('leads_preview_timestamp', Date.now().toString())
                    }

                    resolve({
                        data: {
                            success: true,
                            preview: preview.slice(0, 50), // Return first 50 for preview
                            total_count: preview.length,
                        },
                    })
                } catch (error: any) {
                    reject({
                        data: {
                            error: error.message || 'Failed to parse file. Please ensure it is a valid Excel or CSV file with Company Name and Mobile Number columns.'
                        },
                        status: 400
                    })
                }
            }

            reader.onerror = (error) => {
                reject({
                    data: {
                        error: 'Failed to read file. Please try again.'
                    },
                    status: 500
                })
            }

            // Read as ArrayBuffer for XLSX, Text for CSV
            if (isCsv) {
                reader.readAsText(file)
            } else {
                reader.readAsArrayBuffer(file)
            }
        })
    },

    /**
     * Confirm import from preview data
     * Takes preview data from sessionStorage and creates leads
     */
    confirmImport: async (data: FormData): Promise<ApiResponse<any>> => {
        const categoryId = data.get('category_id') as string
        const subcategoryId = data.get('subcategory_id') as string
        const salesPersonName = data.get('sales_person_name') as string

        if (!categoryId) {
            throw new Error('Category is required')
        }

        // Get preview data from sessionStorage
        if (typeof window === 'undefined') {
            throw new Error('Preview data not found')
        }

        const previewStr = sessionStorage.getItem('leads_preview')
        if (!previewStr) {
            throw new Error('No preview data found. Please upload file again.')
        }

        const preview = JSON.parse(previewStr)
        const leads = preview.map((item: any) => ({
            company_name: item.company_name || '',
            mobile_number: item.mobile_number || '',
            email: item.email || '',
            city: item.city || '',
            category_id: categoryId,
            subcategory_id: subcategoryId || undefined,
            sales_person_name: salesPersonName || undefined,
            status: 'new',
        }))

        // Use bulk create endpoint
        const response = await api.post('/leads-management/bulk', { leads })

        // Clear sessionStorage after successful import
        if (response.data.success) {
            sessionStorage.removeItem('leads_preview')
            sessionStorage.removeItem('leads_total_count')
            sessionStorage.removeItem('leads_preview_timestamp')
        }

        return { data: response.data }
    },
}
