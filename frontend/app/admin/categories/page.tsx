"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { CategoriesManagement } from "@/components/admin/categories-management"

export default function CategoriesPage() {
    return (
        <DashboardShell>
            <CategoriesManagement />
        </DashboardShell>
    )
}
