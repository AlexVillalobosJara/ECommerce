"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenantBranding } from "@/components/admin/settings/tenant-branding"
import { TenantStoreSettings } from "@/components/admin/settings/tenant-store-settings"
import { TenantDeliverySettings } from "@/components/admin/settings/tenant-delivery-settings"
import { TenantPaymentSettings } from "@/components/admin/settings/tenant-payment-settings"
import { TenantEmailSettings } from "@/components/admin/settings/tenant-email-settings"
import { TenantLegalInfo } from "@/components/admin/settings/tenant-legal-info"
import { TenantSubscription } from "@/components/admin/settings/tenant-subscription"
import { TenantRegionalSettings } from "@/components/admin/settings/tenant-regional-settings"
import { TenantGeneralSettings } from "@/components/admin/settings/tenant-general-settings"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTenant } from "@/contexts/TenantContext"

export function TenantSettingsForm() {
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("branding")
    const { refreshTenantConfig } = useTenant()

    const [formData, setFormData] = useState({
        // Branding
        name: "",
        slug: "",
        logo_url: "",
        primary_color: "",
        secondary_color: "",
        custom_domain: "",
        // Extra color fields
        success_color: "#10B981",
        danger_color: "#EF4444",
        warning_color: "#F59E0B",
        info_color: "#3B82F6",
        muted_color: "#94A3B8",

        // Store Settings
        hero_image_url: "",
        hero_title: "",
        hero_subtitle: "",

        // CTA Section (Catalog)
        cta_title: "",
        cta_description: "",
        cta_button_text: "",
        cta_link: "",

        // Delivery (UI flags)
        use_shipping_zones: true,
        use_external_delivery: false,
        default_delivery_provider: "starken",

        // Payment Gateways
        transbank_api_key: "",
        transbank_commerce_code: "",
        mercadopago_access_token: "",
        mercadopago_public_key: "",

        // Email (SMTP)
        smtp_host: "",
        smtp_port: 587,
        smtp_username: "",
        smtp_password: "",
        smtp_from_email: "",
        smtp_from_name: "",

        // Legal Info
        legal_name: "",
        tax_id: "",
        phone: "",
        email: "",
        address: "",

        // Subscription
        subscription_plan: "",
        subscription_expires_at: "",
        max_products: 0,
        max_orders_per_month: 0,
        status: "",

        // Regional Settings
        tax_rate: 19.00,
        decimal_separator: ".",
        thousands_separator: ",",
        decimal_places: 0,
        country: "Chile",

        // General Settings
        prices_include_tax: false,
        show_product_ratings: true,
        allow_reviews: true,
        show_related_products: true,

        // Policies
        privacy_policy_mode: "Default",
        privacy_policy_text: "",
        terms_policy_mode: "Default",
        terms_policy_text: "",

        // Terms Variables
        shipping_days_min: 3,
        shipping_days_max: 7,
        return_window_days: 30,
        return_shipping_cost_cover: "Customer",
        warranty_period: "6 meses",

        // Content
        about_us_text: "",
        our_history_text: "",
        mission_text: "",
        vision_text: "",
        faq_text: "",
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setIsLoading(true)
            const data = await adminApi.getTenantSettings()

            // Transform shipping_mode to UI flags
            let useZones = true
            let useExternal = false
            if (data.shipping_mode === 'Hybrid') {
                useZones = true
                useExternal = true
            } else if (data.shipping_mode === 'Provider') {
                useZones = false
                useExternal = true
            } else {
                useZones = true
                useExternal = false
            }

            setFormData(prev => ({
                ...prev,
                ...data,
                use_shipping_zones: useZones,
                use_external_delivery: useExternal,
                // Ensure defaults for nulls
                hero_title: data.hero_title || "",
                hero_subtitle: data.hero_subtitle || "",

                // CTA Defaults
                cta_title: data.cta_title || "",
                cta_description: data.cta_description || "",
                cta_button_text: data.cta_button_text || "",
                cta_link: data.cta_link || "",

                name: data.name || "",
                primary_color: data.primary_color || "#000000",
                secondary_color: data.secondary_color || "#FFFFFF",
                tax_rate: data.tax_rate ?? 19.00,
                country: data.country || "Chile",
                // Terms defaults
                shipping_days_min: data.shipping_days_min || 3,
                shipping_days_max: data.shipping_days_max || 7,
                return_window_days: data.return_window_days || 30,
                return_shipping_cost_cover: data.return_shipping_cost_cover || "Customer",
                warranty_period: data.warranty_period || "6 meses",
            }))
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar configuración")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            // Transform UI flags to shipping_mode
            let shipping_mode = 'Zones'
            if (formData.use_shipping_zones && formData.use_external_delivery) {
                shipping_mode = 'Hybrid'
            } else if (formData.use_external_delivery) {
                shipping_mode = 'Provider'
            } else {
                shipping_mode = 'Zones'
            }

            const payload = {
                ...formData,
                shipping_mode
            }

            await adminApi.updateTenantSettings(payload)
            await refreshTenantConfig()
            toast.success("Configuración actualizada correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar cambios")
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground mt-1">Gestiona la configuración de tu tienda y cuenta</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg flex-wrap gap-1">
                    <TabsTrigger value="branding" className="px-4 py-2.5">Marca</TabsTrigger>
                    <TabsTrigger value="store" className="px-4 py-2.5">Tienda</TabsTrigger>
                    <TabsTrigger value="regional" className="px-4 py-2.5">Regional</TabsTrigger>
                    <TabsTrigger value="general" className="px-4 py-2.5">General</TabsTrigger>
                    <TabsTrigger value="delivery" className="px-4 py-2.5">Envíos</TabsTrigger>
                    <TabsTrigger value="payments" className="px-4 py-2.5">Pagos</TabsTrigger>
                    <TabsTrigger value="email" className="px-4 py-2.5">Email</TabsTrigger>
                    <TabsTrigger value="legal" className="px-4 py-2.5">Legal</TabsTrigger>
                    <TabsTrigger value="subscription" className="px-4 py-2.5">Suscripción</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6">
                    <TenantBranding data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="store" className="space-y-6">
                    <TenantStoreSettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="regional" className="space-y-6">
                    <TenantRegionalSettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="general" className="space-y-6">
                    <TenantGeneralSettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6">
                    <TenantDeliverySettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                    <TenantPaymentSettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="email" className="space-y-6">
                    <TenantEmailSettings data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="legal" className="space-y-6">
                    <TenantLegalInfo data={formData} onChange={updateFormData} />
                </TabsContent>

                <TabsContent value="subscription" className="space-y-6">
                    <TenantSubscription data={formData} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
