"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { TenantEditor } from "@/components/admin/tenants/tenant-editor"
import { useParams, useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { useEffect } from "react"

export default function EditTenantPage() {
    const params = useParams()
    const id = params.id as string
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
            <TenantEditor tenantId={id} />
        </DashboardShell>
    )
}
