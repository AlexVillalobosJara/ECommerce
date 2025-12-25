"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Package,
    MapPin,
    User,
    Mail,
    Phone,
    FileText,
    Calendar,
    DollarSign,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { OrderStatusBadge } from "./order-status-badge"
import { OrderStatusUpdate } from "./order-status-update"
import { QuoteResponseSheet } from "./quote-response-sheet"
import { getOrder } from "@/services/adminOrderService"
import { getAbsoluteMediaUrl } from "@/lib/media-utils"
import type { AdminOrder } from "@/types/admin"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

interface OrderDetailProps {
    orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
    const router = useRouter()
    const { tenant } = useTenant()
    const [order, setOrder] = useState<AdminOrder | null>(null)
    const [loading, setLoading] = useState(true)
    const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false)
    const [isQuoteSheetOpen, setIsQuoteSheetOpen] = useState(false)

    useEffect(() => {
        loadOrder()
    }, [orderId])

    const loadOrder = async () => {
        try {
            setLoading(true)
            const data = await getOrder(orderId)
            setOrder(data)
        } catch (error) {
            console.error('Error loading order:', error)
            toast.error('Error al cargar pedido')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Cargando pedido...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Pedido no encontrado</p>
            </div>
        )
    }

    const isQuote = order.order_type === "Quote"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{order.order_number}</h1>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isQuote ? "Solicitud de cotización" : "Pedido de venta"} •{" "}
                            {format(new Date(order.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isQuote && order.status === "QuoteRequested" && (
                        <Button onClick={() => setIsQuoteSheetOpen(true)} className="gap-2">
                            <DollarSign className="w-4 h-4" />
                            Responder Cotización
                        </Button>
                    )}
                    {order.status !== "Cancelled" && order.status !== "Delivered" && (
                        <Button variant="outline" onClick={() => setIsStatusSheetOpen(true)} className="gap-2">
                            <Package className="w-4 h-4" />
                            Actualizar Estado
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-lg">Items del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-6">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {item.product_image_url ? (
                                                    <img
                                                        src={getAbsoluteMediaUrl(item.product_image_url) || ''}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{item.product_name}</h4>
                                                        {item.variant_name && (
                                                            <p className="text-sm text-muted-foreground mt-0.5">{item.variant_name}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1 font-mono">SKU: {item.sku}</p>
                                                        {item.attributes_snapshot && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {Object.entries(item.attributes_snapshot).map(([key, value]) => (
                                                                    <Badge key={key} variant="secondary" className="text-xs">
                                                                        {key}: {value}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                                                        {item.unit_price > 0 ? (
                                                            <>
                                                                <p className="text-sm mt-1">{formatPrice(item.unit_price, tenant)} c/u</p>
                                                                <p className="font-semibold mt-1">{formatPrice(item.total, tenant)}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-amber-600 font-medium mt-1">Por cotizar</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Notes */}
                    {order.customer_notes && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Notas del Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{order.customer_notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Shipping Address */}
                    {order.shipping_street_address && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Dirección de Envío
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="font-semibold">{order.shipping_recipient_name}</p>
                                    <p className="text-sm text-muted-foreground">{order.shipping_phone}</p>
                                </div>
                                <Separator />
                                <div className="text-sm space-y-1">
                                    <p>{order.shipping_street_address}</p>
                                    {order.shipping_apartment && <p>{order.shipping_apartment}</p>}
                                    <p>
                                        {order.shipping_commune}, {order.shipping_city}
                                    </p>
                                    <p>{order.shipping_region}</p>
                                    {order.shipping_postal_code && <p>Código Postal: {order.shipping_postal_code}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Summary */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{order.subtotal > 0 ? formatPrice(order.subtotal, tenant) : "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Envío</span>
                                    <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost, tenant) : "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">IVA (19%)</span>
                                    <span>{order.tax_amount > 0 ? formatPrice(order.tax_amount, tenant) : "—"}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>{order.total > 0 ? formatPrice(order.total, tenant) : "Por definir"}</span>
                                </div>
                            </div>

                            {isQuote && order.quote_valid_until && (
                                <>
                                    <Separator />
                                    <div className="flex items-start gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-muted-foreground">Válido hasta</p>
                                            <p className="font-medium">{format(new Date(order.quote_valid_until), "dd MMMM yyyy", { locale: es })}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-2">
                                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Nombre</p>
                                    <p className="font-medium">{order.shipping_recipient_name || order.customer_email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{order.customer_email}</p>
                                </div>
                            </div>
                            {order.customer_phone && (
                                <div className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Teléfono</p>
                                        <p className="font-medium">{order.customer_phone}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <OrderStatusUpdate
                isOpen={isStatusSheetOpen}
                onClose={() => setIsStatusSheetOpen(false)}
                order={order}
                onSuccess={loadOrder}
            />

            <QuoteResponseSheet
                isOpen={isQuoteSheetOpen}
                onClose={() => setIsQuoteSheetOpen(false)}
                order={order}
                onSuccess={loadOrder}
            />
        </div>
    )
}
