"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/admin/dashboard-shell"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to get auth token
const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_access_token")
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
    }
}

interface MarketingConfig {
    id?: string
    gtm_container_id: string
    ga4_measurement_id: string
    meta_pixel_id: string
    tiktok_pixel_id: string
    is_active: boolean
}

export default function MarketingSettingsPage() {
    const [config, setConfig] = useState<MarketingConfig>({
        gtm_container_id: "",
        ga4_measurement_id: "",
        meta_pixel_id: "",
        tiktok_pixel_id: "",
        is_active: true,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [expandedGTM, setExpandedGTM] = useState(false)
    const [expandedGA4, setExpandedGA4] = useState(false)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/admin/marketing-config/`, {
                headers: getAuthHeaders(),
            })

            if (!response.ok) {
                throw new Error("Failed to load config")
            }

            const data = await response.json()
            if (data) {
                setConfig({
                    ...data,
                    gtm_container_id: data.gtm_container_id || "",
                    ga4_measurement_id: data.ga4_measurement_id || "",
                    meta_pixel_id: data.meta_pixel_id || "",
                    tiktok_pixel_id: data.tiktok_pixel_id || "",
                })
            }
        } catch (error: any) {
            console.error("Error loading marketing config:", error)
            toast.error("Error al cargar la configuración")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Validate GTM format
            if (config.gtm_container_id && !config.gtm_container_id.startsWith("GTM-")) {
                toast.error("El ID de GTM debe comenzar con 'GTM-'")
                return
            }

            // Validate GA4 format
            if (config.ga4_measurement_id && !config.ga4_measurement_id.startsWith("G-")) {
                toast.error("El ID de GA4 debe comenzar con 'G-'")
                return
            }

            const response = await fetch(`${API_URL}/api/admin/marketing-config/`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(config),
            })

            if (!response.ok) {
                const errorData = await response.json()
                const errorMsg = errorData.gtm_container_id?.[0] ||
                    errorData.ga4_measurement_id?.[0] ||
                    "Error al guardar la configuración"
                throw new Error(errorMsg)
            }

            toast.success("Configuración guardada correctamente")
        } catch (error: any) {
            console.error("Error saving marketing config:", error)
            toast.error(error.message || "Error al guardar la configuración")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="space-y-6 p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Marketing & Analytics</h1>
                        <p className="text-muted-foreground mt-2">
                            Configura las integraciones de marketing y analytics para tu tienda
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-primary">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        📊 Las integraciones de analytics te permiten medir el rendimiento de tu tienda y optimizar tus campañas de marketing.
                    </p>
                </div>

                {/* Google Tag Manager */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-white border border-border rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-1 shadow-sm">
                                    <Image
                                        src="/images/marketing/gtm.png"
                                        alt="Google Tag Manager"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle>Google Tag Manager</CardTitle>
                                        {config.gtm_container_id && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                ✓ Configurado
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="mt-1">
                                        Gestiona todas tus etiquetas de marketing desde un solo lugar
                                    </CardDescription>
                                </div>
                            </div>
                            <a
                                href="https://tagmanager.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                            >
                                Abrir GTM <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="gtm_container_id">Container ID</Label>
                            <Input
                                id="gtm_container_id"
                                placeholder="GTM-XXXXXXX"
                                value={config.gtm_container_id}
                                onChange={(e) => setConfig({ ...config, gtm_container_id: e.target.value })}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Formato: GTM-XXXXXXX. Encuentra tu Container ID en Google Tag Manager.
                            </p>
                        </div>

                        {/* Collapsible Instructions */}
                        <div className="border-t pt-4">
                            <button
                                onClick={() => setExpandedGTM(!expandedGTM)}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                {expandedGTM ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                ¿Cómo obtener tu Container ID?
                            </button>
                            {expandedGTM && (
                                <ol className="list-decimal list-inside mt-3 space-y-1 text-sm text-muted-foreground ml-6">
                                    <li>Ve a <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tagmanager.google.com</a></li>
                                    <li>Crea una cuenta y un contenedor</li>
                                    <li>Copia el Container ID (formato: GTM-XXXXXXX)</li>
                                </ol>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Google Analytics 4 */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-white border border-border rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-2 shadow-sm">
                                    <Image
                                        src="/images/marketing/ga4.png"
                                        alt="Google Analytics 4"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle>Google Analytics 4</CardTitle>
                                        {config.ga4_measurement_id && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                ✓ Configurado
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="mt-1">
                                        Rastrea el comportamiento de tus visitantes y conversiones
                                    </CardDescription>
                                </div>
                            </div>
                            <a
                                href="https://analytics.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                            >
                                Abrir GA4 <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ga4_measurement_id">Measurement ID</Label>
                            <Input
                                id="ga4_measurement_id"
                                placeholder="G-XXXXXXXXXX"
                                value={config.ga4_measurement_id}
                                onChange={(e) => setConfig({ ...config, ga4_measurement_id: e.target.value })}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Formato: G-XXXXXXXXXX. Encuentra tu Measurement ID en Google Analytics.
                            </p>
                        </div>

                        {/* Collapsible Instructions */}
                        <div className="border-t pt-4">
                            <button
                                onClick={() => setExpandedGA4(!expandedGA4)}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                {expandedGA4 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                ¿Cómo obtener tu Measurement ID?
                            </button>
                            {expandedGA4 && (
                                <ol className="list-decimal list-inside mt-3 space-y-1 text-sm text-muted-foreground ml-6">
                                    <li>Ve a <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">analytics.google.com</a></li>
                                    <li>Crea una propiedad GA4</li>
                                    <li>Ve a Admin → Flujos de datos</li>
                                    <li>Copia el Measurement ID (formato: G-XXXXXXXXXX)</li>
                                </ol>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Meta Pixel - Coming Soon */}
                <Card className="opacity-60">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle>Meta Pixel (Facebook/Instagram)</CardTitle>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                        Próximamente
                                    </Badge>
                                </div>
                                <CardDescription className="mt-1">
                                    Rastrea conversiones y crea audiencias para tus anuncios en Meta
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="meta_pixel_id">Pixel ID</Label>
                            <Input
                                id="meta_pixel_id"
                                placeholder="1234567890123456"
                                value={config.meta_pixel_id}
                                onChange={(e) => setConfig({ ...config, meta_pixel_id: e.target.value })}
                                disabled
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Disponible próximamente
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* TikTok Pixel - Coming Soon */}
                <Card className="opacity-60">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle>TikTok Pixel</CardTitle>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                        Próximamente
                                    </Badge>
                                </div>
                                <CardDescription className="mt-1">
                                    Rastrea conversiones para tus anuncios en TikTok
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="tiktok_pixel_id">Pixel ID</Label>
                            <Input
                                id="tiktok_pixel_id"
                                placeholder="TikTok Pixel ID"
                                value={config.tiktok_pixel_id}
                                onChange={(e) => setConfig({ ...config, tiktok_pixel_id: e.target.value })}
                                disabled
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Disponible próximamente
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
