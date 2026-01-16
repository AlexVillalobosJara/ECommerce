import { API_BASE_URL } from "@/config/api"
import { PremiumPalette } from "@/types/tenant"

const API_URL = `${API_BASE_URL}/api/premium-palettes/`

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_access_token')
}

// Minimal tenant slug logic for admin service
function getTenantSlug(): string | null {
    if (typeof window === 'undefined') return null
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    if (hostname.includes('localhost') && parts.length >= 2 && parts[0] !== 'localhost') {
        return parts[0]
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

export const adminPremiumPaletteService = {
    async listPalettes(): Promise<PremiumPalette[]> {
        return authFetch(API_URL)
    },

    async getPalette(id: string): Promise<PremiumPalette> {
        return authFetch(`${API_URL}${id}/`)
    },

    async createPalette(data: Partial<PremiumPalette>): Promise<PremiumPalette> {
        return authFetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    async updatePalette(id: string, data: Partial<PremiumPalette>): Promise<PremiumPalette> {
        return authFetch(`${API_URL}${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async deletePalette(id: string): Promise<void> {
        return authFetch(`${API_URL}${id}/`, {
            method: 'DELETE',
        })
    }
}
