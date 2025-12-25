"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { TenantSettingsForm } from "@/components/admin/settings/tenant-settings-form"

export default function SettingsPage() {
    return (
        <DashboardShell>
            <TenantSettingsForm />
        </DashboardShell>
    )
}
