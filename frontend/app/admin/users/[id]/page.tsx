import * as React from "react"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import { UserEditor } from "@/components/admin/users/user-editor"

interface EditUserPageProps {
    params: Promise<{
        id: string
    }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
    const { id } = React.use(params)

    return (
        <DashboardShell>
            <UserEditor userId={id} />
        </DashboardShell>
    )
}
