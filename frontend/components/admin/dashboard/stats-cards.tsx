import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Percent, ArrowUpRight } from "lucide-react"

interface StatsCardsProps {
    stats: any
}

export function StatsCards({ stats }: StatsCardsProps) {
    const kpis = stats?.kpis || {}

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Netas</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${kpis.total_revenue?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500 font-medium">+0%</span> vs periodo anterior
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilidad (Margen)</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${kpis.total_profit?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <span className="text-blue-600 font-medium">{kpis.margin_percentage}%</span> de margen bruto
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpis.order_count}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <span className="text-muted-foreground font-medium">Transacciones pagadas</span>
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${kpis.avg_ticket?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <span className="text-muted-foreground font-medium">Valor medio por venta</span>
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Percent className="h-4 w-4 text-slate-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_products}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <span className="text-muted-foreground font-medium">En catálogo publicado</span>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
