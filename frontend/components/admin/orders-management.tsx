"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Calendar, DollarSign, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { OrderStatusBadge } from "./order-status-badge"
import { getOrders, getOrderStats } from "@/services/adminOrderService"
import type { AdminOrderListItem, OrderStats } from "@/types/admin"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"
import { cn } from "@/lib/utils"

export function OrdersManagement() {
    const router = useRouter()
    const [orders, setOrders] = useState<AdminOrderListItem[]>([])
    const [stats, setStats] = useState<OrderStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [activeTab, setActiveTab] = useState<"orders" | "quotes">("orders")
    const { tenant } = useTenant()

    const formatPriceDisplay = (price: number | string | null) => {
        return formatPrice(price, tenant)
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [ordersResponse, statsData] = await Promise.all([
                getOrders(),
                getOrderStats()
            ])
            // Handle paginated response if service doesn't extract it
            const ordersData = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse as any).results || []
            setOrders(ordersData)
            setStats(statsData)
        } catch (error) {
            console.error('Error loading orders:', error)
            toast.error('Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }

    const handleViewOrder = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`)
    }

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        const matchesType = activeTab === "orders" ? order.order_type === "Sale" : order.order_type === "Quote"

        return matchesSearch && matchesStatus && matchesType
    })

    const displayStats = {
        total: stats?.by_type.Sale || 0,
        pending: stats?.by_status.PendingPayment || 0,
        processing: stats?.by_status.Processing || 0,
        quotes: stats?.by_status.Draft || 0,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Pedidos</h1>
                <p className="text-muted-foreground mt-2">Administra pedidos y cotizaciones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pedidos</p>
                                <p className="text-2xl font-bold mt-1">{displayStats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Package className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pendiente Pago</p>
                                <p className="text-2xl font-bold mt-1 text-amber-600">{displayStats.pending}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En Preparación</p>
                                <p className="text-2xl font-bold mt-1 text-blue-600">{displayStats.processing}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-700 font-medium">Cotizaciones Pendientes</p>
                                <p className="text-2xl font-bold mt-1 text-amber-600">{displayStats.quotes}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "orders" | "quotes")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="orders">Pedidos</TabsTrigger>
                    <TabsTrigger value="quotes" className="relative">
                        Cotizaciones
                        {displayStats.quotes > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                                {displayStats.quotes}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6 mt-6">
                    {/* Filters */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por número, cliente o email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Estados</SelectItem>
                                        <SelectItem value="Draft">Borrador</SelectItem>
                                        <SelectItem value="PendingPayment">Pendiente Pago</SelectItem>
                                        <SelectItem value="Paid">Pagado</SelectItem>
                                        <SelectItem value="QuoteRequested">Cotización Solicitada</SelectItem>
                                        <SelectItem value="QuoteSent">Cotización Enviada</SelectItem>
                                        <SelectItem value="QuoteApproved">Cotización Aprobada</SelectItem>
                                        <SelectItem value="Processing">En Preparación</SelectItem>
                                        <SelectItem value="Shipped">Despachado</SelectItem>
                                        <SelectItem value="Delivered">Entregado</SelectItem>
                                        <SelectItem value="Cancelled">Cancelado</SelectItem>
                                        <SelectItem value="Refunded">Reembolsado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-border bg-muted/30">
                                        <tr>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Número</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Cliente</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Estado</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Fecha</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Documento</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Items</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Total</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-sm font-medium">{order.order_number}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium">{order.customer_name || order.customer_email}</div>
                                                        {order.customer_name && (
                                                            <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <OrderStatusBadge status={order.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">{format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(order.created_at), "HH:mm", { locale: es })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] uppercase font-bold",
                                                        order.billing_type === "Factura" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-border bg-muted/50 text-muted-foreground"
                                                    )}>
                                                        {order.billing_type || "Boleta"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground">{order.items_count} items</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.total > 0 ? (
                                                        <span className="font-semibold">{formatPriceDisplay(order.total)}</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Por definir</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order.id)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Empty State */}
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No se encontraron resultados</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
