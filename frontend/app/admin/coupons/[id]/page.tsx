"use client"

import { useParams } from "next/navigation"
import { CouponEditor } from "@/components/admin/promotions/coupon-editor"
import { DashboardShell } from "@/components/admin/dashboard-shell"

export default function EditCouponPage() {
    const params = useParams()
    const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined

    if (!id) return <div>Error: ID not found</div>

    return (
        <DashboardShell>
            <CouponEditor couponId={id} />
        </DashboardShell>
    )
}
