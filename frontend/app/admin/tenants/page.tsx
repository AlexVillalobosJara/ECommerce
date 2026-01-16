"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { TenantsManagement } from "@/components/admin/tenants/tenants-management"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function TenantsPage() {
    const { user, isLoading } = useAdminAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && user && !user.is_superuser) {
            router.push("/admin")
        }
    }, [user, isLoading, router])

    if (isLoading || (user && !user.is_superuser)) {
        return null
    }

    return (
        <DashboardShell>
            <TenantsManagement />
        </DashboardShell>
    )
}
