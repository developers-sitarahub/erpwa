import api from './api'
import type { ApiResponse } from './types'

export interface User {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    status: string
    isOnline: boolean
    lastLoginAt?: string
    activatedAt?: string
}

export const usersAPI = {
    list: async (role?: string): Promise<ApiResponse<User[]>> => {
        const url = role ? `/users?role=${role}` : '/users'
        const response = await api.get(url)
        return { data: response.data }
    },

    create: async (userData: { name: string; email: string; role: string; password?: string }): Promise<ApiResponse<User>> => {
        const response = await api.post('/users', userData)
        return { data: response.data }
    },

    update: async (id: string, userData: { name?: string; email?: string; role?: string; password?: string; status?: string }): Promise<ApiResponse<User>> => {
        const response = await api.put(`/users/${id}`, userData)
        return { data: response.data }
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/users/${id}`)
        return { data: response.data }
    },
}
