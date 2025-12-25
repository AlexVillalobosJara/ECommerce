import { DashboardShell } from "@/components/admin/dashboard-shell"
import { OrdersManagement } from "@/components/admin/orders-management"

export default function OrdersPage() {
    return (
        <DashboardShell>
            <OrdersManagement />
        </DashboardShell>
    )
}
