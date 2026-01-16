"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TenantIdentity } from "./tenant-identity"
import { TenantOwner } from "./tenant-owner"
import { TenantLegalInfo } from "./tenant-legal-info"
import { TenantBrandingSetup } from "./tenant-branding-setup"
import { adminTenantService } from "@/services/adminTenantService"
import { toast } from "sonner"

interface TenantEditorProps {
    tenantId?: string
}

export function TenantEditor({ tenantId }: TenantEditorProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(!!tenantId)
    const [formData, setFormData] = useState({
        // Identity
        name: "",
        slug: "",
        status: "Trial",
        // Owner
        owner_username: "",
        owner_email: "",
        owner_name: "",
        owner_last_name: "",
        owner_password: "",
        owner_confirm_password: "",
        // Legal Info
        legal_name: "",
        tax_id: "",
        email: "",
        phone: "",
        address: "",
        // Branding
        logo_url: "",
        primary_color: "#000000",
        secondary_color: "#F3F4F6",
        hero_title: "",
        hero_subtitle: "",
        // Premium palette colors
        secondary_text_color: "#F0EFEC",
        accent_dark_color: "#2B2C30",
        accent_medium_color: "#3F4A52",
        // Component Specific Colors
        header_bg_color: "",
        header_text_color: "",
        hero_text_color: "",
        hero_btn_bg_color: "",
        hero_btn_text_color: "",
        cta_text_color: "",
        cta_btn_bg_color: "",
        cta_btn_text_color: "",
        footer_bg_color: "",
        footer_text_color: "",
        primary_btn_text_color: "",
    })

    const isEditing = !!tenantId

    useEffect(() => {
        async function loadTenant() {
            if (tenantId) {
                try {
                    setIsLoading(true)
                    const data = await adminTenantService.getTenant(tenantId)
                    setFormData({
                        ...data,
                        owner_username: "",
                        owner_email: "",
                        owner_name: "",
                        owner_last_name: "",
                        owner_password: "",
                        owner_confirm_password: "",
                    })
                } catch (err: any) {
                    toast.error("No se pudo cargar el tenant")
                    router.push("/admin/tenants")
                } finally {
                    setIsLoading(false)
                }
            }
        }
        loadTenant()
    }, [tenantId, router])

    const handleSave = async () => {
        // Validate required fields
        if (!formData.name || !formData.slug) {
            toast.error("El nombre y slug son obligatorios")
            return
        }

        if (!isEditing) {
            // Validate owner data for new tenant
            if (!formData.owner_username || !formData.owner_email || !formData.owner_password) {
                toast.error("Debes completar la información del propietario")
                return
            }

            if (formData.owner_password !== formData.owner_confirm_password) {
                toast.error("Las contraseñas no coinciden")
                return
            }

            if (formData.owner_password.length < 8) {
                toast.error("La contraseña debe tener al menos 8 caracteres")
                return
            }
        }

        if (!formData.legal_name || !formData.tax_id) {
            toast.error("La razón social y RUT son obligatorios")
            return
        }

        try {
            setIsSaving(true)
            if (isEditing) {
                // Prepare payload for update (exclude owner fields if they are empty)
                const { owner_username, owner_email, owner_password, owner_confirm_password, owner_name, owner_last_name, ...rawPayload } = formData

                // Sanitize colors: empty strings to null
                const payload = { ...rawPayload };
                const colorFields = [
                    'header_bg_color', 'header_text_color',
                    'hero_text_color', 'hero_btn_bg_color', 'hero_btn_text_color',
                    'cta_text_color', 'cta_btn_bg_color', 'cta_btn_text_color',
                    'footer_bg_color', 'footer_text_color', 'primary_btn_text_color'
                ];
                colorFields.forEach(field => {
                    if ((payload as any)[field] === "") (payload as any)[field] = null;
                });

                await adminTenantService.updateTenant(tenantId!, payload)
                toast.success("Tenant actualizado correctamente")
            } else {
                // Sanitize colors for create
                const payload = { ...formData };
                const colorFields = [
                    'header_bg_color', 'header_text_color',
                    'hero_text_color', 'hero_btn_bg_color', 'hero_btn_text_color',
                    'cta_text_color', 'cta_btn_bg_color', 'cta_btn_text_color',
                    'footer_bg_color', 'footer_text_color', 'primary_btn_text_color'
                ];
                colorFields.forEach(field => {
                    if ((payload as any)[field] === "") (payload as any)[field] = null;
                });

                await adminTenantService.createTenant(payload)
                toast.success("Tenant creado correctamente")
            }
            router.push("/admin/tenants")
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || "No se pudo guardar el tenant")
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/tenants")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                            <div className="h-6 w-px bg-border" />
                            <div>
                                <h1 className="text-xl font-bold">{isEditing ? "Editar Tenant" : "Nuevo Tenant"}</h1>
                                {formData.name && <p className="text-sm text-muted-foreground font-medium">{formData.name}</p>}
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-sm px-6">
                            <Save className="w-4 h-4" />
                            {isSaving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Tenant"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <TenantIdentity data={formData} onChange={updateFormData} />
                        {!isEditing && <TenantOwner data={formData} onChange={updateFormData} />}
                        <TenantLegalInfo data={formData} onChange={updateFormData} />
                        <TenantBrandingSetup data={formData} onChange={updateFormData} />
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <Card className="p-6 space-y-5 sticky top-24 border-none shadow-md">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Resumen de la Tienda</h3>
                            <div className="space-y-5">
                                {/* Logo Preview */}
                                <div className="flex justify-center p-6 bg-muted/30 rounded-xl border border-dashed border-border overflow-hidden">
                                    {formData.logo_url ? (
                                        <img
                                            src={formData.logo_url}
                                            alt="Logo"
                                            className="max-h-24 w-auto object-contain transition-transform hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                            <Loader2 className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px] font-medium">SIN LOGO</span>
                                        </div>
                                    )}
                                </div>

                                {/* Colors Preview */}
                                <div className="space-y-2">
                                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Paleta de Colores</p>
                                    <div className="flex gap-2">
                                        <div
                                            className="flex-1 h-14 rounded-xl border border-border shadow-inner group relative cursor-help"
                                            style={{ backgroundColor: formData.primary_color }}
                                            title={`Primario: ${formData.primary_color}`}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-black/20 text-white rounded-xl transition-opacity">
                                                {formData.primary_color}
                                            </span>
                                        </div>
                                        <div
                                            className="flex-1 h-14 rounded-xl border border-border shadow-inner group relative cursor-help"
                                            style={{ backgroundColor: formData.secondary_color }}
                                            title={`Secundario: ${formData.secondary_color}`}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-black/20 text-white rounded-xl transition-opacity">
                                                {formData.secondary_color}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="border-b border-border pb-3">
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Nombre</p>
                                        <p className="font-semibold text-sm">
                                            {formData.name || <span className="text-muted-foreground/40 italic font-normal">Pendiente...</span>}
                                        </p>
                                    </div>

                                    <div className="border-b border-border pb-3">
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">URL de la Tienda</p>
                                        <p className="font-mono text-xs text-primary font-bold">
                                            {formData.slug ? (
                                                `${formData.slug}.zumi.app`
                                            ) : (
                                                <span className="text-muted-foreground/40 italic font-normal font-sans text-sm">Pendiente...</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="border-b border-border pb-3">
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Estado</p>
                                        <div className="pt-0.5">
                                            {formData.status === 'Active' ? (
                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">ACTIVO</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">EN PRUEBA</span>
                                            )}
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="pt-2">
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Propietario</p>
                                            <p className="font-medium text-xs">
                                                {formData.owner_name || formData.owner_last_name ? (
                                                    `${formData.owner_name} ${formData.owner_last_name}`.trim()
                                                ) : (
                                                    <span className="text-muted-foreground/40 italic font-normal text-sm">Pendiente...</span>
                                                )}
                                            </p>
                                            {formData.owner_email && <p className="text-[10px] text-muted-foreground mt-0.5">{formData.owner_email}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
