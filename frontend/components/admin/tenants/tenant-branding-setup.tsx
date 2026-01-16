"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BASIC_PALETTES, type ColorPalette } from "@/constants/colors"
import { toast } from "sonner"
import { Upload, Palette, Sparkles, Check } from "lucide-react"

interface TenantBrandingSetupProps {
    data: any
    onChange: (data: any) => void
}

export function TenantBrandingSetup({ data, onChange }: TenantBrandingSetupProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                onChange({ logo_url: e.target?.result as string })
            }
            reader.readAsDataURL(file)
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
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => {
                onChange({ logo_url: e.target?.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    const applyPalette = (palette: ColorPalette) => {
        onChange({
            primary_color: palette.primary,
            secondary_color: palette.secondary,
            success_color: palette.success || "#10B981",
            danger_color: palette.danger || "#EF4444",
            warning_color: palette.warning || "#F59E0B",
            info_color: palette.info || "#3B82F6",
            muted_color: palette.muted || "#94A3B8",
            // Component specific colors with fallbacks to palette or empty string
            header_bg_color: palette.header_bg_color || "",
            header_text_color: palette.header_text_color || "",
            hero_text_color: palette.hero_text_color || "",
            hero_btn_bg_color: palette.hero_btn_bg_color || "",
            hero_btn_text_color: palette.hero_btn_text_color || "",
            cta_text_color: palette.cta_text_color || "",
            cta_btn_bg_color: palette.cta_btn_bg_color || "",
            cta_btn_text_color: palette.cta_btn_text_color || "",
            footer_bg_color: palette.footer_bg_color || "",
            footer_text_color: palette.footer_text_color || "",
        })
    }

    const isActivePalette = (palette: ColorPalette) => {
        return (
            data.primary_color === palette.primary &&
            data.secondary_color === palette.secondary
        )
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Configuración de Marca</h3>
                        <p className="text-sm text-muted-foreground">Define el look & feel inicial de la tienda</p>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                    <Label>Logo (Opcional)</Label>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                            transition-all duration-200
                            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                        `}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {data.logo_url ? (
                            <div className="flex flex-col items-center gap-2">
                                <img src={data.logo_url || "/placeholder.svg"} alt="Logo" className="h-20 w-auto object-contain" />
                                <p className="text-xs text-muted-foreground">Haz clic o arrastra para cambiar</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Arrastra tu logo o haz clic para subir</p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG hasta 5MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Palettes Section */}
                <div className="space-y-6 pt-4 border-t border-border">
                    <div>
                        <Label className="text-base font-semibold">Paletas de Colores Predefinidas</Label>
                        <p className="text-sm text-muted-foreground mb-4">Aplica un esquema de colores profesional con un clic</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {BASIC_PALETTES.map((palette) => (
                            <button
                                key={palette.name}
                                type="button"
                                onClick={() => applyPalette(palette)}
                                className={`
                                    relative group p-2 rounded-lg border transition-all duration-200
                                    ${isActivePalette(palette)
                                        ? "border-primary ring-2 ring-primary/20 shadow-sm bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }
                                `}
                            >
                                <div className="flex gap-1 mb-2">
                                    <div className="h-6 flex-1 rounded-sm" style={{ backgroundColor: palette.primary }} />
                                    <div className="h-6 w-4 rounded-sm" style={{ backgroundColor: palette.secondary }} />
                                </div>
                                <p className="text-[10px] font-medium truncate">{palette.name}</p>
                                {isActivePalette(palette) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Manual Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div className="space-y-3">
                        <Label htmlFor="primary_color">Color Primario</Label>
                        <div className="flex gap-3 items-center">
                            <input
                                id="primary_color"
                                type="color"
                                value={data.primary_color || "#000000"}
                                onChange={(e) => onChange({ primary_color: e.target.value })}
                                className="h-12 w-20 rounded-lg border border-border cursor-pointer px-1 py-1 bg-white"
                            />
                            <Input
                                value={data.primary_color || "#000000"}
                                onChange={(e) => onChange({ primary_color: e.target.value })}
                                placeholder="#000000"
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="secondary_color">Color Secundario</Label>
                        <div className="flex gap-3 items-center">
                            <input
                                id="secondary_color"
                                type="color"
                                value={data.secondary_color || "#F3F4F6"}
                                onChange={(e) => onChange({ secondary_color: e.target.value })}
                                className="h-12 w-20 rounded-lg border border-border cursor-pointer px-1 py-1 bg-white"
                            />
                            <Input
                                value={data.secondary_color || "#F3F4F6"}
                                onChange={(e) => onChange({ secondary_color: e.target.value })}
                                placeholder="#F3F4F6"
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Premium Palette Colors */}
                <div className="space-y-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold">Colores Premium (Opcional)</Label>
                        <Badge variant="secondary" className="text-primary flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Premium
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground -mt-2">
                        Personaliza los colores adicionales para tu paleta premium. Si no se configuran, se usarán valores por defecto.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Secondary Text Color */}
                        <div className="space-y-3">
                            <Label htmlFor="secondary_text_color">Texto Secundario</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="secondary_text_color"
                                    type="color"
                                    value={data.secondary_text_color || "#F0EFEC"}
                                    onChange={(e) => onChange({ secondary_text_color: e.target.value })}
                                    className="h-12 w-20 rounded-lg border border-border cursor-pointer px-1 py-1 bg-white"
                                />
                                <Input
                                    value={data.secondary_text_color || "#F0EFEC"}
                                    onChange={(e) => onChange({ secondary_text_color: e.target.value })}
                                    placeholder="#F0EFEC"
                                    className="flex-1 font-mono"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Para textos e íconos en fondos oscuros (header, footer, botones)
                            </p>
                        </div>

                        {/* Accent Dark Color */}
                        <div className="space-y-3">
                            <Label htmlFor="accent_dark_color">Acento Oscuro</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="accent_dark_color"
                                    type="color"
                                    value={data.accent_dark_color || "#2B2C30"}
                                    onChange={(e) => onChange({ accent_dark_color: e.target.value })}
                                    className="h-12 w-20 rounded-lg border border-border cursor-pointer px-1 py-1 bg-white"
                                />
                                <Input
                                    value={data.accent_dark_color || "#2B2C30"}
                                    onChange={(e) => onChange({ accent_dark_color: e.target.value })}
                                    placeholder="#2B2C30"
                                    className="flex-1 font-mono"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Para footer, botón Hero y estados hover
                            </p>
                        </div>

                        {/* Accent Medium Color */}
                        <div className="space-y-3">
                            <Label htmlFor="accent_medium_color">Acento Medio</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="accent_medium_color"
                                    type="color"
                                    value={data.accent_medium_color || "#3F4A52"}
                                    onChange={(e) => onChange({ accent_medium_color: e.target.value })}
                                    className="h-12 w-20 rounded-lg border border-border cursor-pointer px-1 py-1 bg-white"
                                />
                                <Input
                                    value={data.accent_medium_color || "#3F4A52"}
                                    onChange={(e) => onChange({ accent_medium_color: e.target.value })}
                                    placeholder="#3F4A52"
                                    className="flex-1 font-mono"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Para botones de Call to Action
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hero Message */}
                <div className="space-y-4">
                    <Label>Mensaje del Banner Principal</Label>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="hero_title" className="text-xs text-muted-foreground">
                                Título
                            </Label>
                            <Input
                                id="hero_title"
                                value={data.hero_title || ""}
                                onChange={(e) => onChange({ hero_title: e.target.value })}
                                placeholder="Bienvenido a nuestra tienda"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hero_subtitle" className="text-xs text-muted-foreground">
                                Descripción
                            </Label>
                            <Textarea
                                id="hero_subtitle"
                                value={data.hero_subtitle || ""}
                                onChange={(e) => onChange({ hero_subtitle: e.target.value })}
                                placeholder="Descubre los mejores productos al mejor precio"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 rounded-lg border border-border space-y-3 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vista Previa del Banner</p>
                    <div
                        className="rounded-lg p-8 text-center border border-border"
                        style={{ backgroundColor: data.secondary_color || "#F3F4F6" }}
                    >
                        {data.logo_url && (
                            <img
                                src={data.logo_url || "/placeholder.svg"}
                                alt="Logo"
                                className="h-12 w-auto object-contain mx-auto mb-4"
                            />
                        )}
                        <h2 className="text-2xl font-bold mb-2" style={{ color: data.primary_color || "#000000" }}>
                            {data.hero_title || "Título del Banner"}
                        </h2>
                        <p className="text-muted-foreground">{data.hero_subtitle || "Descripción del banner principal"}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
