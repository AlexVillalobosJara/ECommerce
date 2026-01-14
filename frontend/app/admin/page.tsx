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
import { StatsCards } from "@/components/admin/dashboard/stats-cards"
import { TopRankings } from "@/components/admin/dashboard/top-rankings"

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
                <StatsCards stats={stats} />

                {/* Main Stats and Recent Sales */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Resumen de Ventas</CardTitle>
                                <CardDescription>Tendencia de ingresos de los últimos 30 días</CardDescription>
                            </div>
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

                {/* Advanced Rankings */}
                <TopRankings rankings={stats?.rankings} />
            </div>
        </DashboardShell>
    )
}
