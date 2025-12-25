import { DashboardShell } from "@/components/admin/dashboard-shell"
import { ProductEditor } from "@/components/admin/product-editor"

export default function NewProductPage() {
    return (
        <DashboardShell>
            <ProductEditor />
        </DashboardShell>
    )
}
