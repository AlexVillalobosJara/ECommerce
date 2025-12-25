import { DashboardShell } from "@/components/admin/dashboard-shell"
import { CategoryEditor } from "@/components/admin/category-editor"

interface EditCategoryPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
    const { id } = await params

    return (
        <DashboardShell>
            <CategoryEditor categoryId={id} />
        </DashboardShell>
    )
}
