import { ShippingZoneEditor } from "@/components/admin/shipping/shipping-zone-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default async function EditShippingZonePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    return (
        <DashboardShell>
            <ShippingZoneEditor zoneId={resolvedParams.id} />
        </DashboardShell>
    )
}
