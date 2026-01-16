"use client"

import { usePathname } from "next/navigation"
import { TenantProvider } from "@/contexts/TenantContext"
import type { ReactNode } from "react"

interface ConditionalTenantProviderProps {
    children: ReactNode
}

/**
 * Conditionally wraps children with TenantProvider only for storefront routes.
 * Admin routes (/admin/*) don't need tenant resolution from hostname - they get
 * tenant from JWT token via AdminAuthProvider.
 */
export function ConditionalTenantProvider({ children }: ConditionalTenantProviderProps) {
    const pathname = usePathname()

    // Don't use TenantProvider for admin routes
    const isAdminRoute = pathname?.startsWith('/admin')

    if (isAdminRoute) {
        // Admin routes use AdminAuthProvider AND TenantProvider (for settings), 
        // but NO TenantStyleProvider (to preserve Admin UI)
        return (
            <TenantProvider>
                {children}
            </TenantProvider>
        )
    }

    // Storefront routes need TenantProvider
    return (
        <TenantProvider>
            {children}
        </TenantProvider>
    )
}
