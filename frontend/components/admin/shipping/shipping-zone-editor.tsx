"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ShippingZoneBasicInfo } from "@/components/admin/shipping/shipping-zone-basic-info"
import { ShippingZoneCommunesSelector } from "@/components/admin/shipping/shipping-zone-communes-selector"
import { ShippingZonePricing } from "@/components/admin/shipping/shipping-zone-pricing"
import { ShippingZoneSettings } from "@/components/admin/shipping/shipping-zone-settings"
import { adminApi } from "@/services/admin-api"
import type { ShippingZoneFormData } from "@/types/shipping"
import { toast } from "sonner"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

interface ShippingZoneEditorProps {
    zoneId?: string
}

export function ShippingZoneEditor({ zoneId }: ShippingZoneEditorProps) {
    const router = useRouter()
    const { tenant } = useTenant()
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(!!zoneId)
    const [formData, setFormData] = useState<ShippingZoneFormData>({
        name: "",
        description: "",
        commune_codes: [],
        base_cost: 0,
        cost_per_kg: 0,
        free_shipping_threshold: null,
        estimated_days: 3,
        allows_store_pickup: false,
        is_active: true,
    })

    const isEditing = !!zoneId

    // Load zone data if editing
    useEffect(() => {
        if (zoneId) {
            const loadZone = async () => {
                try {
                    setIsLoading(true)
                    const zone = await adminApi.getShippingZone(zoneId)
                    setFormData({
                        name: zone.name,
                        description: zone.description,
                        commune_codes: zone.commune_codes,
                        base_cost: zone.base_cost,
                        cost_per_kg: zone.cost_per_kg,
                        free_shipping_threshold: zone.free_shipping_threshold,
                        estimated_days: zone.estimated_days,
                        allows_store_pickup: zone.allows_store_pickup,
                        is_active: zone.is_active,
                    })
                } catch (error) {
                    console.error("Error loading zone:", error)
                    toast.error("Error", {
                        description: "No se pudo cargar la zona de reparto",
                    })
                } finally {
                    setIsLoading(false)
                }
            }

            loadZone()
        }
    }, [zoneId, toast])

    const handleSave = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error("Error", {
                description: "El nombre de la zona es requerido",
            })
            return
        }

        if (formData.commune_codes.length === 0) {
            toast.error("Error", {
                description: "Debe seleccionar al menos una comuna",
            })
            return
        }

        try {
            setIsSaving(true)

            if (isEditing) {
                await adminApi.updateShippingZone(zoneId, formData)
                toast.success("Zona actualizada", {
                    description: "La zona de reparto ha sido actualizada correctamente",
                })
            } else {
                await adminApi.createShippingZone(formData)
                toast.success("Zona creada", {
                    description: "La zona de reparto ha sido creada correctamente",
                })
            }

            router.push("/admin/shipping-zones")
        } catch (error) {
            console.error("Error saving zone:", error)
            toast.error("Error al guardar", {
                description: error instanceof Error ? error.message : "Ocurrió un error al guardar",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<ShippingZoneFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/shipping-zones")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                            <div className="h-6 w-px bg-border" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    {isEditing ? "Editar Zona de Reparto" : "Nueva Zona de Reparto"}
                                </h1>
                                {formData.name && <p className="text-sm text-muted-foreground">{formData.name}</p>}
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <ShippingZoneBasicInfo data={formData} onChange={updateFormData} />

                        <ShippingZoneCommunesSelector data={formData} onChange={updateFormData} />

                        <ShippingZonePricing data={formData} onChange={updateFormData} />
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <ShippingZoneSettings data={formData} onChange={updateFormData} />

                        {/* Summary Card */}
                        <Card className="p-6 space-y-4 sticky top-24">
                            <h3 className="font-semibold text-sm">Resumen</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Comunas:</span>
                                    <span className="font-medium">{formData.commune_codes.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Costo base:</span>
                                    <span className="font-medium">
                                        {formatPrice(formData.base_cost, tenant)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Por kg:</span>
                                    <span className="font-medium">
                                        {formatPrice(formData.cost_per_kg, tenant)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tiempo:</span>
                                    <span className="font-medium">{formData.estimated_days} días</span>
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Estado:</span>
                                        <span className={formData.is_active ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                            {formData.is_active ? "Activa" : "Inactiva"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
