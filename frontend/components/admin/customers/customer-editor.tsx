"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CustomerBasicInfo } from "./customer-basic-info"
import { CustomerBusinessInfo } from "./customer-business-info"
import { CustomerSettings } from "./customer-settings"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"

interface CustomerEditorProps {
    customerId?: string
}

export function CustomerEditor({ customerId }: CustomerEditorProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(!!customerId)
    const [formData, setFormData] = useState({
        customer_type: "Individual" as "Individual" | "Corporate",
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        company_name: "",
        tax_id: "",
        legal_representative: "",
        business_sector: "",
        credit_limit: 0,
        payment_terms_days: 0,
        discount_percentage: 0,
        price_list_type: "Retail" as "Retail" | "Wholesale" | "VIP",
        is_active: true,
        is_verified: false,
    })

    const isEditing = !!customerId

    useEffect(() => {
        if (customerId) {
            setLoading(true)
            adminApi.getCustomer(customerId)
                .then(data => {
                    // Ensure nulls are handled (API might return null for optional fields)
                    setFormData(prev => ({
                        ...prev,
                        ...data,
                        // Ensure enums match exact casing if backend differs, but should match model choices
                    }))
                })
                .catch(err => {
                    console.error(err)
                    toast.error("Error al cargar cliente")
                })
                .finally(() => setLoading(false))
        }
    }, [customerId])

    const handleSave = async () => {
        // Basic Validation
        if (!formData.email) return toast.error("El email es obligatorio")
        if (formData.customer_type === "Individual") {
            if (!formData.first_name || !formData.last_name) return toast.error("Nombre y apellido son obligatorios")
        } else {
            if (!formData.company_name) return toast.error("La razón social es obligatoria")
        }

        try {
            setIsSaving(true)
            if (isEditing && customerId) {
                await adminApi.updateCustomer(customerId, formData)
                toast.success("Cliente actualizado")
            } else {
                await adminApi.createCustomer(formData)
                toast.success("Cliente creado")
            }
            router.push("/admin/customers")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al guardar cliente")
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    const getCustomerDisplayName = () => {
        if (formData.customer_type === "Individual") {
            return formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}`.trim() : null
        }
        return formData.company_name
    }

    if (loading) {
        return <div className="p-8 text-center">Cargando datos del cliente...</div>
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-12">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                            <div className="h-6 w-px bg-border" />
                            <div>
                                <h1 className="text-xl font-semibold">{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</h1>
                                {getCustomerDisplayName() && (
                                    <p className="text-sm text-muted-foreground">{getCustomerDisplayName()}</p>
                                )}
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
                        <CustomerBasicInfo data={formData} onChange={updateFormData} />

                        {formData.customer_type === "Corporate" && (
                            <CustomerBusinessInfo data={formData} onChange={updateFormData} />
                        )}
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <CustomerSettings data={formData} onChange={updateFormData} />

                        {/* Preview Card */}
                        <Card className="p-6 space-y-4 sticky top-24">
                            <h3 className="font-semibold text-sm">Resumen</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Tipo de Cliente</p>
                                    <p className="font-medium">
                                        {formData.customer_type === "Individual" ? "Individual" : "Corporativo"}
                                    </p>
                                </div>
                                {formData.customer_type === "Individual" ? (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Nombre</p>
                                        <p className="font-medium">
                                            {getCustomerDisplayName() || <span className="text-muted-foreground">Sin nombre</span>}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Empresa</p>
                                            <p className="font-medium">
                                                {formData.company_name || <span className="text-muted-foreground">Sin nombre</span>}
                                            </p>
                                        </div>
                                        {formData.tax_id && (
                                            <div>
                                                <p className="text-muted-foreground text-xs">RUT</p>
                                                <p className="font-medium font-mono">{formData.tax_id}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div>
                                    <p className="text-muted-foreground text-xs">Email</p>
                                    <p className="font-medium">
                                        {formData.email || <span className="text-muted-foreground">Sin email</span>}
                                    </p>
                                </div>
                                {formData.phone && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Teléfono</p>
                                        <p className="font-medium">{formData.phone}</p>
                                    </div>
                                )}
                                {formData.customer_type === "Corporate" && formData.discount_percentage > 0 && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Descuento</p>
                                        <p className="font-medium text-green-600">{formData.discount_percentage}%</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
