"use client"

import { PremiumPaletteForm } from "@/components/admin/tenants/premium-palette-form"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function NewPremiumPalettePage() {
    return (
        <DashboardShell>
            <div className="max-w-5xl mx-auto py-6">
                <PremiumPaletteForm />
            </div>
        </DashboardShell>
    )
}
