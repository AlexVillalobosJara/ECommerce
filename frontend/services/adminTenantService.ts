import { API_BASE_URL } from "@/config/api"

const API_URL = API_BASE_URL

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_access_token')
}

function getTenantSlug(): string | null {
    if (typeof window === 'undefined') return null

    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // For localhost development (e.g., autotest.localhost)
    if (hostname.includes('localhost') && parts.length >= 2 && parts[0] !== 'localhost') {
        return parts[0]
    }

    // For platform domains (e.g., autotest.onrender.com)
    if (parts.length >= 3 && (hostname.includes('onrender.com') || hostname.includes('vercel.app'))) {
        const subdomain = parts[0]
        if (subdomain !== 'www' && subdomain !== 'api') {
            return subdomain
        }
    }

    return null
}

async function authFetch(url: string, options: RequestInit = {}) {
    const token = getAuthToken()
    const tenantSlug = getTenantSlug()
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(tenantSlug && { 'X-Tenant': tenantSlug }),
        ...options.headers,
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    if (!response.ok) {
        let errorData
        try {
            errorData = await response.json()
        } catch {
            throw new Error(`Error ${response.status}`)
        }
        throw new Error(errorData.detail || errorData.error || "Error en la solicitud")
    }

    return response.json()
}

export const adminTenantService = {
    async listTenants() {
        return authFetch(`${API_URL}/api/admin/tenants/`)
    },

    async getTenant(id: string) {
        return authFetch(`${API_URL}/api/admin/tenants/${id}/`)
    },

    async createTenant(data: any) {
        return authFetch(`${API_URL}/api/admin/tenants/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    async updateTenant(id: string, data: any) {
        return authFetch(`${API_URL}/api/admin/tenants/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async deleteTenant(id: string) {
        return authFetch(`${API_URL}/api/admin/tenants/${id}/`, {
            method: 'DELETE',
        })
    }
}
