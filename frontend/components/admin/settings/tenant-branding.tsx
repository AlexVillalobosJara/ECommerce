"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Check, Loader2, Sparkles, Palette, Lock } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTenant } from "@/contexts/TenantContext"
import { toast } from "sonner"
import { optimizeImage, OPTIMIZATION_PRESETS } from "@/lib/image-optimizer"
import { uploadImageToSupabase } from "@/lib/supabase-upload"
import { adminPremiumPaletteService } from "@/services/adminPremiumPaletteService"
import { PremiumPalette } from "@/types/tenant"

interface TenantBrandingProps {
    data: any
    onChange: (updates: any) => void
}

export function TenantBranding({ data, onChange }: TenantBrandingProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [dbPalettes, setDbPalettes] = useState<PremiumPalette[]>([])
    const [isLoadingPalettes, setIsLoadingPalettes] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isUploading, setIsUploading] = useState(false)
    const { tenant } = useTenant()

    // Unified plan check using subscription_plan or manual override
    const hasPremiumPlan = data.is_premium ||
        ['Premium', 'Business', 'Unlimited'].includes(data.subscription_plan || '')

    useEffect(() => {
        loadPremiumPalettes()
    }, [])

    async function loadPremiumPalettes() {
        try {
            setIsLoadingPalettes(true)
            const palettes = await adminPremiumPaletteService.listPalettes()
            setDbPalettes(palettes)
        } catch (error) {
            console.error("Error loading premium palettes:", error)
        } finally {
            setIsLoadingPalettes(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
        const file = e instanceof File ? e : e.target.files?.[0]
        if (!file || !file.type.startsWith("image/")) return

        if (!tenant) {
            toast.error("No se pudo identificar el comercio")
            return
        }

        try {
            setIsUploading(true)

            // Compress logo
            const { file: optimizedFile, originalSize, optimizedSize, compressionRatio } =
                await optimizeImage(file, OPTIMIZATION_PRESETS.logo)

            console.log(`[TenantBranding] Optimization: ${originalSize} -> ${optimizedSize} (${compressionRatio}% reduction)`)

            // Use shared upload utility for consistent path: {tenantId}/tenant/{filename}
            const { url } = await uploadImageToSupabase(optimizedFile, 'tenant', tenant.id)

            onChange({ logo_url: url })
            toast.success("Logo subido y optimizado")
        } catch (error) {
            console.error("Error uploading logo:", error)
            toast.error("Error al subir el logo")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleLogoUpload(file)
    }


    const applyPalette = (palette: PremiumPalette) => {
        // Check if palette is premium and user doesn't have premium plan
        if (palette.palette_type === 'premium' && !hasPremiumPlan) {
            toast.error("Esta paleta está disponible para planes Premium o superior. ¡Mejora tu plan para activarla!")
            return
        }

        onChange({
            primary_color: palette.primary_color,
            secondary_color: palette.secondary_color,
            secondary_text_color: palette.secondary_text_color,
            accent_dark_color: palette.accent_dark_color,
            accent_medium_color: palette.accent_medium_color,
            header_bg_color: palette.header_bg_color,
            header_text_color: palette.header_text_color,
            hero_text_color: palette.hero_text_color,
            hero_btn_bg_color: palette.hero_btn_bg_color,
            hero_btn_text_color: palette.hero_btn_text_color,
            cta_text_color: palette.cta_text_color,
            cta_btn_bg_color: palette.cta_btn_bg_color,
            cta_btn_text_color: palette.cta_btn_text_color,
            footer_bg_color: palette.footer_bg_color,
            footer_text_color: palette.footer_text_color,
            primary_btn_text_color: palette.primary_btn_text_color,
        })
        toast.success(`Paleta "${palette.name}" aplicada correctamente`)
    }

    const isActivePalette = (palette: PremiumPalette) => {
        return (
            data.primary_color === palette.primary_color &&
            data.secondary_color === palette.secondary_color &&
            data.secondary_text_color === palette.secondary_text_color &&
            data.accent_dark_color === palette.accent_dark_color &&
            data.accent_medium_color === palette.accent_medium_color &&
            data.primary_btn_text_color === palette.primary_btn_text_color
        )
    }

    return (
        <div className="space-y-6">
            {/* Brand Identity */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Identidad de Marca</h3>
                        <p className="text-sm text-muted-foreground">Define los elementos visuales de tu tienda</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Tienda</Label>
                            <Input
                                id="name"
                                value={data.name || ""}
                                onChange={(e) => onChange({ name: e.target.value })}
                                placeholder="Mi Tienda Zumi"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={data.slug || ""}
                                onChange={(e) => onChange({ slug: e.target.value })}
                                placeholder="mi-tienda"
                                disabled
                            />
                            <p className="text-xs text-muted-foreground">zumi.app/{data.slug || "mi-tienda"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom_domain">Dominio Personalizado (Opcional)</Label>
                        <Input
                            id="custom_domain"
                            value={data.custom_domain || ""}
                            onChange={(e) => onChange({ custom_domain: e.target.value })}
                            placeholder="www.mitienda.com"
                        />
                        <p className="text-xs text-muted-foreground">Conecta tu propio dominio a tu tienda</p>
                    </div>
                </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Logo</h3>
                        <p className="text-sm text-muted-foreground">Sube el logo de tu tienda (recomendado 500x500px)</p>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
            `}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {data.logo_url ? (
                            <div className="flex flex-col items-center gap-3">
                                <img src={data.logo_url || "/placeholder.svg"} alt="Logo" className="h-24 w-auto object-contain" />
                                <p className="text-sm text-muted-foreground">Haz clic o arrastra para cambiar</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    {isUploading ? (
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    ) : (
                                        <Upload className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {isUploading ? "Subiendo logo..." : "Arrastra tu logo o haz clic para subir"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, SVG hasta 5MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Paletas de Colores Predefinidas</h3>
                        <p className="text-sm text-muted-foreground">
                            Selecciona una paleta profesional para aplicar a tu tienda instantáneamente
                        </p>
                    </div>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="basic" className="flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Básicas
                            </TabsTrigger>
                            <TabsTrigger value="premium" className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Premium
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {isLoadingPalettes ? (
                                    <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
                                        Cargando paletas básicas...
                                    </div>
                                ) : dbPalettes.filter(p => p.palette_type === 'basic').length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
                                        No hay paletas básicas disponibles.
                                    </div>
                                ) : (
                                    dbPalettes.filter(p => p.palette_type === 'basic').map((palette) => (
                                        <button
                                            key={palette.name}
                                            type="button"
                                            onClick={() => applyPalette(palette)}
                                            className={`
                                            relative group p-4 rounded-xl border-2 transition-all duration-200
                                            ${isActivePalette(palette)
                                                    ? "border-primary shadow-md scale-105 bg-primary/5"
                                                    : "border-border hover:border-primary/50 hover:shadow-sm"
                                                }
                                        `}
                                        >
                                            <div className="flex gap-2 mb-3">
                                                <div
                                                    className="h-12 flex-1 rounded-lg border border-border"
                                                    style={{ backgroundColor: palette.primary_color }}
                                                />
                                                <div
                                                    className="h-12 w-12 rounded-lg border border-border"
                                                    style={{ backgroundColor: palette.secondary_color }}
                                                />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm mb-1">{palette.name}</p>
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    Paleta Básica #{String(palette.id).slice(0, 4)}
                                                </p>
                                            </div>
                                            {data.primary_color === palette.primary_color &&
                                                data.secondary_color === palette.secondary_color &&
                                                data.secondary_text_color === palette.secondary_text_color &&
                                                data.accent_dark_color === palette.accent_dark_color &&
                                                data.accent_medium_color === palette.accent_medium_color &&
                                                data.primary_btn_text_color === palette.primary_btn_text_color && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="premium" className="space-y-4 outline-none">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-sm text-muted-foreground">Diseños exclusivos para marcas con plan Premium</p>
                                <Badge className="bg-primary/10 text-primary border-primary/20">RECOMENDADO</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {isLoadingPalettes ? (
                                    <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
                                        Cargando paletas premium...
                                    </div>
                                ) : dbPalettes.filter(p => p.palette_type === 'premium').length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
                                        No hay paletas premium disponibles.
                                    </div>
                                ) : (
                                    dbPalettes.filter(p => p.palette_type === 'premium').map((palette) => (
                                        <button
                                            key={palette.id}
                                            type="button"
                                            onClick={() => applyPalette(palette)}
                                            className={`
                                                relative group p-4 rounded-xl border-2 transition-all duration-200
                                                ${isActivePalette(palette)
                                                    ? "border-primary shadow-md scale-105 bg-primary/5"
                                                    : "border-border hover:border-primary/50 hover:shadow-sm"
                                                }
                                                ${!hasPremiumPlan ? "opacity-90" : ""}
                                            `}
                                        >
                                            <div className="flex gap-2 mb-3">
                                                <div
                                                    className="h-12 flex-1 rounded-lg border border-border"
                                                    style={{ backgroundColor: palette.primary_color }}
                                                />
                                                <div
                                                    className="h-12 w-12 rounded-lg border border-border"
                                                    style={{ backgroundColor: palette.secondary_color }}
                                                />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-1">
                                                    <p className="font-medium text-sm mb-1">{palette.name}</p>
                                                    {!hasPremiumPlan && <Lock className="w-3 h-3 text-muted-foreground" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    Paleta Premium #{String(palette.id).slice(0, 4)}
                                                </p>
                                            </div>
                                            {isActivePalette(palette) && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

interface ColorPickerFieldProps {
    id: string;
    label: string;
    value: string;
    defaultValue?: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

function ColorPickerField({ id, label, value, defaultValue, onChange, disabled }: ColorPickerFieldProps) {
    const displayValue = value || defaultValue || "#000000";

    return (
        <div className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
            <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
            <div className="flex gap-2 items-center">
                <input
                    id={id}
                    type="color"
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-12 rounded border border-border cursor-pointer flex-shrink-0"
                />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={defaultValue || "#000000"}
                    className="h-9 text-xs font-mono"
                />
            </div>
        </div>
    )
}
