"use client"

import { DashboardShell } from "@/components/admin/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, Users, TrendingUp } from "lucide-react"
import { Overview } from "@/components/admin/dashboard/overview"
import { RecentSales } from "@/components/admin/dashboard/recent-sales"
import { useEffect, useState } from "react"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminApi.getDashboardStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error)
                toast.error("Error al cargar estadísticas")
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <DashboardShell>
                <div className="space-y-8">
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <Skeleton className="h-9 w-64 mb-2" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Skeleton className="col-span-4 h-[400px] rounded-xl" />
                        <Skeleton className="col-span-3 h-[400px] rounded-xl" />
                    </div>
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground">
                            Resumen de actividad y rendimiento de tu tienda
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats?.total_sales?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-green-500 font-medium">+0%</span> vs mes anterior
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_customers}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span className="text-muted-foreground font-medium">Total Registrados</span>
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
                            <div className="text-2xl font-bold">{stats?.total_orders}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span className="text-muted-foreground font-medium">Procesadas</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_products}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span className="text-muted-foreground font-medium">En Catálogo</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts & Recent Sales */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Resumen de Ventas</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <Overview data={stats?.sales_chart || []} />
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Ventas Recientes</CardTitle>
                            <CardDescription>
                                Últimas 5 transacciones realizadas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentSales orders={stats?.recent_orders || []} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    )
}
