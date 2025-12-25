"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, MapPin, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { adminApi } from "@/services/admin-api"
import type { ShippingZone } from "@/types/shipping"
import { useToast } from "@/hooks/use-toast"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CarrierConfigList } from "./carrier-config"

export function ShippingZonesManagement() {
    const [zones, setZones] = useState<ShippingZone[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const { toast } = useToast()

    // ... (rest of logic: loadZones, handlers)

    // Re-verify the logic block to ensure it matches original but wrapped in function
    // Load zones from API
    useEffect(() => {
        loadZones()
    }, [])

    const loadZones = async () => {
        try {
            setIsLoading(true)
            const response = await adminApi.listShippingZones()
            const data = response.results || response
            setZones(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error loading zones:", error)
            setZones([])
            toast({
                title: "Error",
                description: "No se pudieron cargar las zonas de reparto",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateZone = () => {
        router.push("/admin/shipping-zones/new")
    }

    const handleEditZone = (zone: ShippingZone) => {
        router.push(`/admin/shipping-zones/${zone.id}`)
    }

    const handleDeleteZone = async (zone: ShippingZone) => {
        if (!confirm(`¿Estás seguro de eliminar la zona "${zone.name}"?`)) {
            return
        }

        try {
            await adminApi.deleteShippingZone(zone.id)
            toast({
                title: "Éxito",
                description: "Zona de reparto eliminada correctamente",
            })
            loadZones()
        } catch (error) {
            console.error("Error deleting zone:", error)
            toast({
                title: "Error",
                description: "No se pudo eliminar la zona de reparto",
                variant: "destructive",
            })
        }
    }

    const filteredZones = zones.filter((z) => {
        const matchesSearch = z.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? z.is_active : !z.is_active)
        return matchesSearch && matchesStatus
    })

    const { tenant } = useTenant()

    const formatCurrency = (value: number) => {
        return formatPrice(value, tenant)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Envíos y Despachos</h1>
                        <p className="text-muted-foreground mt-2">Configura las zonas de despacho y transportistas</p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    Cargando configuración...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Envíos y Despachos</h1>
                    <p className="text-muted-foreground mt-2">Configura cómo se envían tus productos</p>
                </div>
            </div>

            <Tabs defaultValue="zones" className="w-full">
                <TabsList>
                    <TabsTrigger value="zones" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Zonas Propias (Manual)
                    </TabsTrigger>
                    <TabsTrigger value="carriers" className="flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Transportistas Externos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="zones" className="space-y-6 mt-6">
                    {/* Header for Zones Tab */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Configuración de Zonas</h2>
                        <Button onClick={handleCreateZone} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Zona
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre..."
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
                                        <SelectItem value="active">Activas</SelectItem>
                                        <SelectItem value="inactive">Inactivas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zones Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredZones.map((zone) => (
                            <Card key={zone.id} className="shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Truck className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{zone.name}</h3>
                                                    <Badge variant={zone.is_active ? "default" : "secondary"} className="text-xs">
                                                        {zone.is_active ? "Activa" : "Inactiva"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{zone.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Communes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>COMUNAS INCLUIDAS ({zone.commune_count})</span>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Costo Base</p>
                                            <p className="font-semibold">{formatCurrency(zone.base_cost)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Por Kg</p>
                                            <p className="font-semibold">{formatCurrency(zone.cost_per_kg)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Envío Gratis desde</p>
                                            <p className="font-semibold">
                                                {zone.free_shipping_threshold ? formatCurrency(zone.free_shipping_threshold) : "No aplica"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Tiempo Estimado</p>
                                            <p className="font-semibold">{zone.estimated_days} días</p>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    {zone.allows_store_pickup && (
                                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>Permite retiro en tienda</span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-border">
                                        <Button variant="outline" size="sm" onClick={() => handleEditZone(zone)} className="flex-1">
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteZone(zone)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredZones.length === 0 && (
                        <div className="text-center py-12">
                            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {zones.length === 0 ? "No hay zonas de reparto creadas" : "No se encontraron zonas de reparto"}
                            </p>
                            {zones.length === 0 && (
                                <Button onClick={handleCreateZone} className="mt-4 gap-2">
                                    <Plus className="w-4 h-4" />
                                    Crear Primera Zona
                                </Button>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="carriers" className="mt-6">
                    <CarrierConfigList />
                </TabsContent>
            </Tabs>
        </div>
    )
}
