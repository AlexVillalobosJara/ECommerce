"use client"

import { use } from "react"
import { PremiumPaletteForm } from "@/components/admin/tenants/premium-palette-form"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function EditPremiumPalettePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)

    return (
        <DashboardShell>
            <div className="max-w-5xl mx-auto py-6">
                <PremiumPaletteForm paletteId={resolvedParams.id} />
            </div>
        </DashboardShell>
    )
}
