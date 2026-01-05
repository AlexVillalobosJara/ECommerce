/**
 * Tenant detection and configuration utilities
 */

import { Tenant } from "@/types/tenant"
import { API_BASE_URL } from "@/config/api"

export type TenantConfig = Tenant

/**
 * Detect if the current host is a subdomain or a custom domain
 */
export function getTenantIdentifier(hostname: string): { slug?: string, domain?: string } | null {
    // Remove port if present
    const host = hostname.split(':')[0]
    const parts = host.split('.')

    // For localhost development
    if (host === 'localhost' || host === '127.0.0.1') {
        return null
    }

    // Check if it's a subdomain of the main app domain (e.g., *.onrender.com or *.shop.com)
    // For this POC, we'll assume that if there are 3+ parts and the middle/last parts match 
    // the platform's domain, then the first part is the slug.
    // Otherwise, we'll treat the whole host as a custom domain.

    // Simplified logic: If it contains "onrender.com" or "vercel.app", it's a subdomain/environment host.
    const isPlatformDomain = host.includes('onrender.com') || host.includes('vercel.app') || host.includes('localhost')

    // If it's a platform subdomain (e.g. *.localhost, *.onrender.com, *.vercel.app)
    if (isPlatformDomain) {
        // demo-store.localhost has 2 parts
        if (host.includes('localhost') && parts.length >= 2 && parts[0] !== 'localhost') {
            return { slug: parts[0] }
        }
        // demo-store.onrender.com has 3 parts
        if (parts.length >= 3) {
            const subdomain = parts[0]
            if (subdomain !== 'www' && subdomain !== 'api') {
                return { slug: subdomain }
            }
        }
    }

    // If it's not a known platform domain and looks like a full domain, treat as custom domain
    if (parts.length >= 2) {
        // Strip 'www.' if present for cleaner database matching
        const cleanDomain = host.startsWith('www.') ? host.substring(4) : host
        return { domain: cleanDomain }
    }

    return null
}

/**
 * Extract tenant slug from hostname (Legacy support)
 */
export function getTenantSlug(hostname: string): string | null {
    const ident = getTenantIdentifier(hostname)
    return ident?.slug || null
}

/**
 * Fetch tenant configuration from backend
 */
export async function fetchTenantConfig(params: { slug?: string, domain?: string } | string): Promise<TenantConfig | null> {
    try {
        const apiBase = API_BASE_URL
        let url = `${apiBase}/api/tenants/`

        if (typeof params === 'string') {
            url += `?slug=${params}`
        } else if (params.slug) {
            url += `?slug=${params.slug}`
        } else if (params.domain) {
            url += `?domain=${params.domain}`
        } else {
            return null
        }

        const response = await fetch(url)

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
