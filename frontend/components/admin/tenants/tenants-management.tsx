"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, Store, Activity, AlertCircle, Calendar, ExternalLink, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminTenantService } from "@/services/adminTenantService"
import { toast } from "sonner"

type TenantStatus = "all" | "Active" | "Trial" | "Suspended"

export function TenantsManagement() {
    const [tenants, setTenants] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<TenantStatus>("all")
    const router = useRouter()

    const loadTenants = async () => {
        try {
            setIsLoading(true)
            const data = await adminTenantService.listTenants()
            // Handle paginated response
            const tenantList = Array.isArray(data) ? data : (data.results || [])
            setTenants(tenantList)
        } catch (err: any) {
            toast.error("No se pudieron cargar los tenants")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadTenants()
    }, [])

    const handleCreateTenant = () => {
        router.push("/admin/tenants/new")
    }

    const handleEditTenant = (tenant: any) => {
        router.push(`/admin/tenants/${tenant.id}`)
    }

    const handleDeleteTenant = async (tenantId: string) => {
        if (
            confirm(
                "¿Estás seguro de eliminar este tenant? Esta acción no se puede deshacer y cancelará la suscripción.",
            )
        ) {
            try {
                await adminTenantService.deleteTenant(tenantId)
                toast.success("Tenant eliminado correctament")
                loadTenants()
            } catch (err: any) {
                toast.error(err.message || "No se pudo eliminar el tenant")
            }
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString("es-CL", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Active":
                return <Badge className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
            case "Trial":
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Trial</Badge>
            case "Suspended":
                return <Badge className="bg-red-50 text-red-700 border-red-200">Suspendido</Badge>
            case "Cancelled":
                return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const filteredTenants = tenants.filter((t) => {
        const matchesSearch =
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.legal_name && t.legal_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = statusFilter === "all" || t.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: tenants.length,
        active: tenants.filter((t) => t.status === "Active").length,
        trial: tenants.filter((t) => t.status === "Trial").length,
    }

    if (isLoading && tenants.length === 0) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Tenants</h1>
                    <p className="text-muted-foreground mt-1">Administra todas las tiendas de la plataforma</p>
                </div>
                <Button onClick={handleCreateTenant} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Tenant
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Tenants</p>
                                <p className="text-3xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Store className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Activos</p>
                                <p className="text-3xl font-bold mt-1">{stats.active}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">En Trial</p>
                                <p className="text-3xl font-bold mt-1">{stats.trial}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-none bg-muted/30">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, slug, razón social o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as TenantStatus)} className="w-full">
                            <TabsList className="grid grid-cols-4 w-full h-10">
                                <TabsTrigger value="all">Todos</TabsTrigger>
                                <TabsTrigger value="Active">Activos</TabsTrigger>
                                <TabsTrigger value="Trial">Trial</TabsTrigger>
                                <TabsTrigger value="Suspended">Susp.</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Tenants Table */}
            <Card className="shadow-sm border-none">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/20">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Tienda</th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Información Legal</th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Propietario</th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Estado</th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Creado</th>
                                    <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs border border-border"
                                                    style={{
                                                        backgroundColor: tenant.secondary_color || '#F3F4F6',
                                                        color: tenant.primary_color || '#000000'
                                                    }}
                                                >
                                                    {tenant.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{tenant.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">/{tenant.slug}</div>
                                                    {tenant.custom_domain && (
                                                        <div className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                            {tenant.custom_domain}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-xs">{tenant.legal_name || "N/A"}</div>
                                                <div className="text-[10px] text-muted-foreground">RUT: {tenant.tax_id || "N/A"}</div>
                                                <div className="text-[10px] text-muted-foreground">{tenant.email || "N/A"}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {tenant.owner_info ? (
                                                <div className="space-y-0.5">
                                                    <div className="font-medium text-xs">
                                                        {tenant.owner_info.first_name} {tenant.owner_info.last_name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">{tenant.owner_info.email}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">{getStatusBadge(tenant.status)}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(tenant.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditTenant(tenant)} className="h-8 w-8">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTenant(tenant.id)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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
            {!isLoading && filteredTenants.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border">
                    <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No se encontraron tenants</h3>
                    <p className="text-sm text-muted-foreground/60 mt-1">Intenta con otros términos de búsqueda o filtros</p>
                    <Button onClick={handleCreateTenant} variant="outline" className="mt-6">
                        Crear el primer tenant
                    </Button>
                </div>
            )}
        </div>
    )
}
