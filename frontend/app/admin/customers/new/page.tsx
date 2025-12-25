"use client"

import { CustomerEditor } from "@/components/admin/customers/customer-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function NewCustomerPage() {
    return (
        <DashboardShell>
            <CustomerEditor />
        </DashboardShell>
    )
}
