import type { Tenant } from "@/types/tenant"

import { API_BASE_URL } from "@/config/api"

const API_URL = API_BASE_URL

export const api = {
    async getTenants(): Promise<Tenant[]> {
        const response = await fetch(`${API_URL}/api/tenants/`)
        if (!response.ok) throw new Error("Failed to fetch tenants")
        const data = await response.json()
        return data.results || data
    },

    async getTenant(id: string): Promise<Tenant> {
        const response = await fetch(`${API_URL}/api/tenants/${id}/`)
        if (!response.ok) throw new Error("Failed to fetch tenant")
        return response.json()
    },

    async createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
        const response = await fetch(`${API_URL}/api/tenants/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tenant),
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || "Failed to create tenant")
        }
        return response.json()
    },

    async updateTenant(id: string, tenant: Partial<Tenant>): Promise<Tenant> {
        const response = await fetch(`${API_URL}/api/tenants/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tenant),
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || "Failed to update tenant")
        }
        return response.json()
    },

    async deleteTenant(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/api/tenants/${id}/`, {
            method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete tenant")
    },
}
