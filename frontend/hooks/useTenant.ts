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
            const adminUserStr = localStorage.getItem('admin_user')
            if (adminUserStr) {
                const adminUser = JSON.parse(adminUserStr)
                setTenantInfo({
                    tenantId: adminUser.tenant_id || null,
                    tenantSlug: adminUser.tenant_slug || null,
                    isLoading: false,
                })
            } else {
                setTenantInfo({
                    tenantId: null,
                    tenantSlug: null,
                    isLoading: false,
                })
            }
        } catch (error) {
            console.error('Failed to parse admin user from localStorage:', error)
            setTenantInfo({
                tenantId: null,
                tenantSlug: null,
                isLoading: false,
            })
        }
    }, [])

    return tenantInfo
}
