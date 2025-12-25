"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { PaymentSettings } from "@/components/admin/payment-settings"

export default function PaymentsSettingsPage() {
    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuración de Pagos</h1>
                    <p className="text-muted-foreground mt-2">
                        Configura las pasarelas de pago para tu tienda
                    </p>
                </div>

                <PaymentSettings />
            </div>
        </DashboardShell>
    )
}
