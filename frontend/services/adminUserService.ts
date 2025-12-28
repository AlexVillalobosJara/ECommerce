import type {
    AdminTenantUser,
    UserFormData,
    UserFilters
} from '@/types/admin'
import { API_BASE } from '@/config/api'
import { fetchWithAuth, getHeaders } from '@/lib/api-client'

export async function getUsers(filters?: UserFilters): Promise<AdminTenantUser[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.role) params.append('role', filters.role)
    if (filters?.status) params.append('status', filters.status)

    const url = `${API_BASE}/users/${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: getHeaders(),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users' }))
        throw new Error(errorData.detail || `Error fetching users: ${response.status}`)
    }

    const data = await response.json()
    // Handle DRF pagination
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results
    }

    return Array.isArray(data) ? data : []
}

export async function getUser(userId: string): Promise<AdminTenantUser> {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/`, {
        method: 'GET',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error('Failed to fetch user details')
    }

    return response.json()
}

export async function createUser(data: UserFormData): Promise<AdminTenantUser> {
    // Backend expects user data in a nested 'user' object and 'role' at top level
    const payload = {
        user: {
            username: data.username,
            email: data.email,
            password: data.password,
            first_name: data.first_name,
            last_name: data.last_name,
        },
        role: data.role,
        tenant: data.tenant,
        is_active: data.is_active
    }

    const response = await fetchWithAuth(`${API_BASE}/users/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || error.message || 'Failed to create user')
    }

    return response.json()
}

export async function updateUser(userId: string, data: Partial<UserFormData>): Promise<AdminTenantUser> {
    const payload: any = {}

    if (data.role) payload.role = data.role
    if (data.is_active !== undefined) payload.is_active = data.is_active

    if (data.username || data.email || data.first_name || data.last_name || data.password) {
        payload.user = {}
        if (data.username) payload.user.username = data.username
        if (data.email) payload.user.email = data.email
        if (data.first_name) payload.user.first_name = data.first_name
        if (data.last_name) payload.user.last_name = data.last_name
        if (data.password) payload.user.password = data.password
    }

    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || error.message || 'Failed to update user')
    }

    return response.json()
}

export async function deleteUser(userId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/users/${userId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error('Failed to delete user')
    }
}
