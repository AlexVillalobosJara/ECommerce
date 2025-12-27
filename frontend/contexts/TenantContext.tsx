"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTenantIdentifier, fetchTenantConfig, applyTenantBranding, type TenantConfig } from '@/lib/tenant'

interface TenantContextType {
    tenant: TenantConfig | null
    loading: boolean
    error: string | null
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    error: null,
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

    useEffect(() => {
        async function loadTenant() {
            try {
                setLoading(true)
                setError(null)

                // Get tenant identifier from hostname or prop
                let slug = tenantSlug
                let domain: string | undefined

                if (!slug && typeof window !== 'undefined') {
                    const identifier = getTenantIdentifier(window.location.hostname)
                    slug = identifier?.slug
                    domain = identifier?.domain

                    console.log('[TenantContext] Identifier from hostname:', { slug, domain })

                    // Fallback: check query parameter
                    const params = new URLSearchParams(window.location.search)
                    if (!slug && !domain && params.has('tenant')) {
                        slug = params.get('tenant')!
                        console.log('[TenantContext] Slug from query param:', slug)
                    }

                    // Fallback: check localStorage
                    if (!slug && !domain) {
                        slug = localStorage.getItem('tenant_slug') as string | undefined
                        console.log('[TenantContext] Slug from localStorage:', slug)
                    }
                }

                if (!slug && !domain) {
                    console.error('[TenantContext] No tenant identifier found')
                    setError('No tenant specified')
                    setLoading(false)
                    return
                }

                // Persist successful slug if found
                if (slug) {
                    localStorage.setItem('tenant_slug', slug)
                }

                // Fetch tenant configuration
                console.log('[TenantContext] Fetching config for:', { slug, domain })
                const config = await fetchTenantConfig({ slug, domain })
                console.log('[TenantContext] Config received:', config)

                if (!config) {
                    console.error('[TenantContext] Tenant not found for slug:', slug)
                    setError('Tenant not found')
                    setLoading(false)
                    return
                }

                setTenant(config)

                // Apply branding
                applyTenantBranding(config)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load tenant')
            } finally {
                setLoading(false)
            }
        }

        loadTenant()
    }, [tenantSlug])

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    )
}
