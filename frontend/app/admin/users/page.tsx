import { DashboardShell } from "@/components/admin/dashboard-shell"
import { UsersManagement } from "@/components/admin/users/users-management"

export default function UsersPage() {
    return (
        <DashboardShell>
            <UsersManagement />
        </DashboardShell>
    )
}
