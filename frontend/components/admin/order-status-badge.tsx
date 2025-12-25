"use client"

import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    XCircle
} from "lucide-react"
import type { OrderStatus } from "@/types/admin"

interface OrderStatusBadgeProps {
    status: OrderStatus
    className?: string
}

const statusConfig: Record<OrderStatus, {
    label: string
    color: string
    icon: typeof FileText
}> = {
    Draft: {
        label: "Borrador",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FileText
    },
    PendingPayment: {
        label: "Pendiente Pago",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock
    },
    Paid: {
        label: "Pagado",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2
    },
    QuoteRequested: {
        label: "Cotización Solicitada",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: FileText
    },
    QuoteSent: {
        label: "Cotización Enviada",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: FileText
    },
    QuoteApproved: {
        label: "Cotización Aprobada",
        color: "bg-teal-50 text-teal-700 border-teal-200",
        icon: CheckCircle2
    },
    Processing: {
        label: "En Preparación",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Package
    },
    Shipped: {
        label: "Despachado",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Truck
    },
    Delivered: {
        label: "Entregado",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2
    },
    Cancelled: {
        label: "Cancelado",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle
    },
    Refunded: {
        label: "Reembolsado",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: XCircle
    },
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <Badge
            variant="secondary"
            className={`${config.color} ${className || ''}`}
        >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
        </Badge>
    )
}

export { statusConfig }
