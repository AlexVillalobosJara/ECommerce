import type { Metadata } from "next"
import { AdminAuthProvider } from "@/contexts/AdminAuthContext"
import { AdminUIProvider } from "@/contexts/AdminUIContext"
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
                <AdminUIProvider>
                    {children}
                </AdminUIProvider>
            </AdminAuthProvider>
        </div>
    )
}
