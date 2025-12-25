import { DashboardShell } from "@/components/admin/dashboard-shell"
import { ProductEditor } from "@/components/admin/product-editor"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    return (
        <DashboardShell>
            <ProductEditor productId={id} />
        </DashboardShell>
    )
}
