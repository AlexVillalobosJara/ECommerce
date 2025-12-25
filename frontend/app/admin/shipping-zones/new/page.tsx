import { ShippingZoneEditor } from "@/components/admin/shipping/shipping-zone-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function NewShippingZonePage() {
    return (
        <DashboardShell>
            <ShippingZoneEditor />
        </DashboardShell>
    )
}
