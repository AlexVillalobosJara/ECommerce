"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTenantIdentifier, fetchTenantConfig, applyTenantBranding, type TenantConfig } from '@/lib/tenant'

interface TenantContextType {
    tenant: TenantConfig | null
    loading: boolean
    error: string | null
    refreshTenantConfig: () => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    error: null,
    refreshTenantConfig: async () => { },
})

export function useTenant() {
    return useContext(TenantContext)
}

interface TenantProviderProps {
    children: ReactNode
    tenantSlug?: string // For testing/SSR
}

export function TenantProvider({ children, tenantSlug }: TenantProviderProps) {
    const [tenant, setTenant] = useState<TenantConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadTenant = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true)
            setError(null)

            // Get tenant identifier from hostname or prop
            let slug = tenantSlug
            let domain: string | undefined

            if (!slug && typeof window !== 'undefined') {
                const identifier = getTenantIdentifier(window.location.hostname)
                slug = identifier?.slug
                domain = identifier?.domain

                // Fallback: check query parameter
                const params = new URLSearchParams(window.location.search)
                if (!slug && !domain && params.has('tenant')) {
                    slug = params.get('tenant')!
                }

                // Fallback: check localStorage
                if (!slug && !domain) {
                    slug = localStorage.getItem('tenant_slug') as string | undefined
                }
            }

            if (!slug && !domain) {
                if (!isRefresh) setError('No tenant specified')
                setLoading(false)
                return
            }

            // Persist successful slug if found
            if (slug) {
                localStorage.setItem('tenant_slug', slug)
            }

            // Fetch tenant configuration
            const config = await fetchTenantConfig({ slug, domain })

            if (!config) {
                if (!isRefresh) setError('Tenant not found')
                return
            }

            setTenant(config)

            // Apply branding
            applyTenantBranding(config)
        } catch (err) {
            if (!isRefresh) setError(err instanceof Error ? err.message : 'Failed to load tenant')
        } finally {
            if (!isRefresh) setLoading(false)
        }
    }

    const refreshTenantConfig = async () => {
        await loadTenant(true)
    }

    useEffect(() => {
        loadTenant()
    }, [tenantSlug])

    return (
        <TenantContext.Provider value={{ tenant, loading, error, refreshTenantConfig }}>
            {children}
        </TenantContext.Provider>
    )
}
