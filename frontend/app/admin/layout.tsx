import type { Metadata } from "next"
import { AdminAuthProvider } from "@/contexts/AdminAuthContext"
import "./admin.css"

export const metadata: Metadata = {
    title: "Zumi Admin Dashboard",
    description: "Modern e-commerce admin dashboard for SME owners",
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="admin-theme">
            <AdminAuthProvider>
                {children}
            </AdminAuthProvider>
        </div>
    )
}
