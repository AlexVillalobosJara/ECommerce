/**
 * Tenant detection and configuration utilities
 */

import { Tenant } from "@/types/tenant"

export type TenantConfig = Tenant

/**
 * Extract tenant slug from hostname
 * For development: tenant1.localhost
 * For production: tenant1.yourdomain.com
 */
export function getTenantSlug(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0]

    // Split by dots
    const parts = host.split('.')

    // For localhost development
    if (host === 'localhost' || host === '127.0.0.1') {
        return null
    }

    // Check if we have a subdomain
    if (parts.length >= 2) {
        const subdomain = parts[0]

        // Skip www and api
        if (subdomain === 'www' || subdomain === 'api') {
            return null
        }

        return subdomain
    }

    return null
}

/**
 * Fetch tenant configuration from backend
 */
export async function fetchTenantConfig(slug: string): Promise<TenantConfig | null> {
    try {
        const response = await fetch(`http://localhost:8000/api/tenants/?slug=${slug}`)

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        const results = data.results || data

        if (Array.isArray(results) && results.length > 0) {
            return results[0]
        }

        return data
    } catch (error) {
        console.error('Error fetching tenant config:', error)
        return null
    }
}

/**
 * Apply tenant branding to document
 */
export function applyTenantBranding(config: TenantConfig) {
    if (typeof document === 'undefined') return

    // Set CSS variables for theming
    const root = document.documentElement

    if (config.primary_color) {
        root.style.setProperty('--tenant-primary', config.primary_color)
    }

    if (config.secondary_color) {
        root.style.setProperty('--tenant-secondary', config.secondary_color)
    }

    // Update page title
    if (config.name) {
        document.title = config.name
    }
}
