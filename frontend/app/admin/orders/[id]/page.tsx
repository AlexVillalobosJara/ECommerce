import { DashboardShell } from "@/components/admin/dashboard-shell"
import { OrderDetail } from "@/components/admin/order-detail"

interface OrderDetailPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = await params

    return (
        <DashboardShell>
            <OrderDetail orderId={id} />
        </DashboardShell>
    )
}
