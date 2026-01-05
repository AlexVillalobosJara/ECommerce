/**
 * Hook to get current tenant information from admin user context
 */

import { useEffect, useState } from 'react'

interface TenantInfo {
    tenantId: string | null
    tenantSlug: string | null
    isLoading: boolean
}

export function useTenant(): TenantInfo {
    const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
        tenantId: null,
        tenantSlug: null,
        isLoading: true,
    })

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            // Get JWT token from localStorage
            const token = localStorage.getItem('admin_access_token')

            if (token) {
                // Decode JWT to get tenant_id (client-side decode, no verification)
                try {
                    const base64Url = token.split('.')[1]
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    )
                    const payload = JSON.parse(jsonPayload)

                    if (payload && payload.tenant_id) {
                        setTenantInfo({
                            tenantId: payload.tenant_id,
                            tenantSlug: payload.tenant_slug || null,
                            isLoading: false,
                        })
                    } else {
                        console.warn('No tenant_id found in JWT token')
                        setTenantInfo({
                            tenantId: null,
                            tenantSlug: null,
                            isLoading: false,
                        })
                    }
                } catch (decodeError) {
                    console.error('Failed to decode JWT:', decodeError)
                    setTenantInfo({
                        tenantId: null,
                        tenantSlug: null,
                        isLoading: false,
                    })
                }
            } else {
                setTenantInfo({
                    tenantId: null,
                    tenantSlug: null,
                    isLoading: false,
                })
            }
        } catch (error) {
            console.error('Failed to extract tenant from JWT:', error)
            setTenantInfo({
                tenantId: null,
                tenantSlug: null,
                isLoading: false,
            })
        }
    }, [])

    return tenantInfo
}
