"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Loader2, Save, ArrowLeft } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"

interface CouponEditorProps {
    couponId?: string
}

export function CouponEditor({ couponId }: CouponEditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discount_type: "Percentage",
        discount_value: "",
        minimum_purchase_amount: "",
        maximum_discount_amount: "",
        max_uses: "",
        max_uses_per_customer: "1",
        valid_from: new Date(),
        valid_until: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30 days
        is_active: true
    })

    useEffect(() => {
        if (couponId) {
            loadCoupon(couponId)
        }
    }, [couponId])

    const loadCoupon = async (id: string) => {
        try {
            setLoading(true)
            const data = await adminApi.getCoupon(id)
            setFormData({
                code: data.code,
                description: data.description || "",
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                minimum_purchase_amount: data.minimum_purchase_amount || "",
                maximum_discount_amount: data.maximum_discount_amount || "",
                max_uses: data.max_uses || "",
                max_uses_per_customer: data.max_uses_per_customer || "",
                valid_from: new Date(data.valid_from),
                valid_until: new Date(data.valid_until),
                is_active: data.is_active
            })
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar el cupón")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!formData.code || !formData.discount_value) {
            toast.error("Código y valor del descuento son obligatorios")
            return
        }

        if (formData.valid_until <= formData.valid_from) {
            toast.error("La fecha de fin debe ser posterior a la de inicio")
            return
        }

        try {
            setSaving(true)
            const payload = {
                ...formData,
                valid_from: formData.valid_from.toISOString(),
                valid_until: formData.valid_until.toISOString(),
                // Convert safe empty strings to null for backend
                minimum_purchase_amount: formData.minimum_purchase_amount || null,
                maximum_discount_amount: formData.maximum_discount_amount || null,
                max_uses: formData.max_uses || null,
                max_uses_per_customer: formData.max_uses_per_customer || null,
            }

            if (couponId) {
                await adminApi.updateCoupon(couponId, payload)
                toast.success("Cupón actualizado")
            } else {
                await adminApi.createCoupon(payload)
                toast.success("Cupón creado")
            }
            router.push("/admin/coupons")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al guardar cupón")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Cargando...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <h1 className="text-2xl font-bold">{couponId ? "Editar Cupón" : "Nuevo Cupón"}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Código del Cupón</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="ej. VERANO2025"
                                        value={formData.code}
                                        onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                                        className="font-mono uppercase tracking-wider"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Los códigos deben ser únicos.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Textarea
                                    placeholder="Descripción interna de la promoción"
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Descuento</Label>
                                    <Select value={formData.discount_type} onValueChange={(v) => handleChange("discount_type", v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="FixedAmount">Monto Fijo ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.discount_value}
                                        onChange={(e) => handleChange("discount_value", e.target.value)}
                                    />
                                </div>
                            </div>

                            {formData.discount_type === 'Percentage' && (
                                <div className="space-y-2">
                                    <Label>Tope Máximo de Descuento (Opcional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ej. 10000"
                                        value={formData.maximum_discount_amount}
                                        onChange={(e) => handleChange("maximum_discount_amount", e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Monto máximo a descontar si es porcentual.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Restricciones y Límites</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Compra Mínima</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.minimum_purchase_amount}
                                        onChange={(e) => handleChange("minimum_purchase_amount", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Límite de Usos Totales</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ilimitado"
                                        value={formData.max_uses}
                                        onChange={(e) => handleChange("max_uses", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Usos por Cliente</Label>
                                    <Input
                                        type="number"
                                        placeholder="1"
                                        value={formData.max_uses_per_customer}
                                        onChange={(e) => handleChange("max_uses_per_customer", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vigencia</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fecha de Inicio</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.valid_from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.valid_from ? format(formData.valid_from, "PPP", { locale: es }) : <span>Seleccionar</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={formData.valid_from} onSelect={(date) => date && handleChange("valid_from", date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha de Término</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.valid_until && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.valid_until ? format(formData.valid_until, "PPP", { locale: es }) : <span>Seleccionar</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={formData.valid_until} onSelect={(date) => date && handleChange("valid_until", date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="active-mode">Activo</Label>
                                <Switch
                                    id="active-mode"
                                    checked={formData.is_active}
                                    onCheckedChange={(v) => handleChange("is_active", v)}
                                />
                            </div>
                            <div className="pt-4">
                                <Button className="w-full" onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {saving ? "Guardando..." : "Guardar Cupón"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
