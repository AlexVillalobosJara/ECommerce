"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, TicketPercent, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const debouncedSearch = useDebounce(searchQuery, 500)
    const router = useRouter()

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true)
            const data = await adminApi.listCoupons({
                search: debouncedSearch,
                status: statusFilter === "all" ? undefined : statusFilter
            })
            if (data.results) {
                setCoupons(data.results)
            } else if (Array.isArray(data)) {
                setCoupons(data)
            } else {
                setCoupons([])
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar cupones")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, statusFilter])

    useEffect(() => {
        fetchCoupons()
    }, [fetchCoupons])

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este cupón?")) {
            try {
                await adminApi.deleteCoupon(id)
                toast.success("Cupón eliminado")
                fetchCoupons()
            } catch (error) {
                toast.error("Error al eliminar cupón")
            }
        }
    }

    const { tenant } = useTenant()

    const formatCurrency = (amount: number) => {
        return formatPrice(amount, tenant)
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Cupones de Descuento</h1>
                        <p className="text-muted-foreground mt-2">Gestiona tus campañas promocionales</p>
                    </div>
                    <Button onClick={() => router.push("/admin/coupons/new")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Cupón
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por código..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Activos</SelectItem>
                                    <SelectItem value="inactive">Inactivos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Código</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Descuento</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Uso</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Vigencia</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Estado</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr>
                                    ) : coupons.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay cupones registrados</td></tr>
                                    ) : (
                                        coupons.map((coupon) => (
                                            <tr key={coupon.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                            <TicketPercent className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-base">{coupon.code}</div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{coupon.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="text-sm font-medium">
                                                        {coupon.discount_type === 'Percentage'
                                                            ? `${parseFloat(coupon.discount_value)}%`
                                                            : formatCurrency(parseFloat(coupon.discount_value))
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{coupon.current_uses}</span>
                                                        <span className="text-muted-foreground"> / {coupon.max_uses || '∞'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(new Date(coupon.valid_from), 'dd/MM/yyyy')}</span>
                                                        </div>
                                                        <span className="pl-4">al {format(new Date(coupon.valid_until), 'dd/MM/yyyy')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                                                        {coupon.is_active ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/coupons/${coupon.id}`)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)} className="text-destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
