"use client"

import { useParams } from "next/navigation"
import { CustomerEditor } from "@/components/admin/customers/customer-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function EditCustomerPage() {
    const params = useParams()
    // Ensure id is a string
    const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined

    if (!id) return <div>Error: ID not found</div>

    return (
        <DashboardShell>
            <CustomerEditor customerId={id} />
        </DashboardShell>
    )
}
