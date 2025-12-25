import { ShippingZonesManagement } from "@/components/admin/shipping/shipping-zones-management"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function ShippingZonesPage() {
    return (
        <DashboardShell>
            <ShippingZonesManagement />
        </DashboardShell>
    )
}
