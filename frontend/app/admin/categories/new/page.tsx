import { DashboardShell } from "@/components/admin/dashboard-shell"
import { CategoryEditor } from "@/components/admin/category-editor"

export default function NewCategoryPage() {
    return (
        <DashboardShell>
            <CategoryEditor />
        </DashboardShell>
    )
}
