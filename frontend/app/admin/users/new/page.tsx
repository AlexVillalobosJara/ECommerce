import { DashboardShell } from "@/components/admin/dashboard-shell"
import { UserEditor } from "@/components/admin/users/user-editor"

export default function NewUserPage() {
    return (
        <DashboardShell>
            <UserEditor />
        </DashboardShell>
    )
}
