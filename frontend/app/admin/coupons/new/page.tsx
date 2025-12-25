"use client"

import { CouponEditor } from "@/components/admin/promotions/coupon-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function NewCouponPage() {
    return (
        <DashboardShell>
            <CouponEditor />
        </DashboardShell>
    )
}
