"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Check } from "lucide-react"
import { useState, useRef } from "react"

interface TenantBrandingProps {
    data: any
    onChange: (data: any) => void
}

const COLOR_PALETTES = [
    {
        name: "Classic Black & White",
        description: "Minimalismo atemporal",
        primary: "#000000",
        secondary: "#FFFFFF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#94A3B8",
    },
    {
        name: "Electric Violet",
        description: "Innovación y creatividad",
        primary: "#8B5CF6",
        secondary: "#F5F3FF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#94A3B8",
    },
    {
        name: "Ocean Blue",
        description: "Confianza y profesionalismo",
        primary: "#0EA5E9",
        secondary: "#F0F9FF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#06B6D4",
        muted: "#94A3B8",
    },
    {
        name: "Forest Green",
        description: "Sostenibilidad y crecimiento",
        primary: "#10B981",
        secondary: "#ECFDF5",
        success: "#059669",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#9CA3AF",
    },
    {
        name: "Sunset Orange",
        description: "Energía y creatividad",
        primary: "#F97316",
        secondary: "#FFF7ED",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#FBBF24",
        info: "#3B82F6",
        muted: "#A3A3A3",
    },
    {
        name: "Royal Purple",
        description: "Elegancia y lujo",
        primary: "#9333EA",
        secondary: "#FAF5FF",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#8B5CF6",
        muted: "#94A3B8",
    },
    {
        name: "Modern Slate",
        description: "Minimalismo y sofisticación",
        primary: "#475569",
        secondary: "#F8FAFC",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#94A3B8",
    },
    {
        name: "Rose Gold",
        description: "Belleza y feminidad",
        primary: "#EC4899",
        secondary: "#FDF2F8",
        success: "#10B981",
        danger: "#BE185D",
        warning: "#F59E0B",
        info: "#A855F7",
        muted: "#9CA3AF",
    },
    {
        name: "Deep Indigo",
        description: "Tecnología e innovación",
        primary: "#4F46E5",
        secondary: "#EEF2FF",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#6366F1",
        muted: "#94A3B8",
    },
    {
        name: "Emerald Teal",
        description: "Frescura y modernidad",
        primary: "#14B8A6",
        secondary: "#F0FDFA",
        success: "#059669",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#06B6D4",
        muted: "#94A3B8",
    },
    {
        name: "Amber Gold",
        description: "Calidez y optimismo",
        primary: "#F59E0B",
        secondary: "#FFFBEB",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#FBBF24",
        info: "#3B82F6",
        muted: "#A3A3A3",
    },
    {
        name: "Midnight Blue",
        description: "Elegancia corporativa",
        primary: "#1E40AF",
        secondary: "#EFF6FF",
        success: "#059669",
        danger: "#DC2626",
        warning: "#D97706",
        info: "#3B82F6",
        muted: "#94A3B8",
    },
    {
        name: "Cherry Red",
        description: "Pasión y energía",
        primary: "#DC2626",
        secondary: "#FEF2F2",
        success: "#10B981",
        danger: "#B91C1C",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#9CA3AF",
    },
    {
        name: "Lime Fresh",
        description: "Vitalidad y naturaleza",
        primary: "#84CC16",
        secondary: "#F7FEE7",
        success: "#65A30D",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#A3A3A3",
    },
    {
        name: "Lavender Dream",
        description: "Serenidad y calma",
        primary: "#A78BFA",
        secondary: "#F5F3FF",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#8B5CF6",
        muted: "#A1A1AA",
    },
    {
        name: "Coral Sunset",
        description: "Calidez moderna",
        primary: "#FB7185",
        secondary: "#FFF1F2",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#F472B6",
        muted: "#9CA3AF",
    },
    {
        name: "Turquoise Wave",
        description: "Frescura tropical",
        primary: "#06B6D4",
        secondary: "#ECFEFF",
        success: "#14B8A6",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#94A3B8",
    },
]

export function TenantBranding({ data, onChange }: TenantBrandingProps) {
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

    const applyPalette = (palette: (typeof COLOR_PALETTES)[0]) => {
        onChange({
            primary_color: palette.primary,
            secondary_color: palette.secondary,
            success_color: palette.success,
            danger_color: palette.danger,
            warning_color: palette.warning,
            info_color: palette.info,
            muted_color: palette.muted,
        })
    }

    const isActivePalette = (palette: (typeof COLOR_PALETTES)[0]) => {
        return (
            data.primary_color === palette.primary &&
            data.secondary_color === palette.secondary &&
            data.success_color === palette.success &&
            data.danger_color === palette.danger &&
            data.warning_color === palette.warning
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
                                    <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Arrastra tu logo o haz clic para subir</p>
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
                        <h3 className="text-lg font-semibold mb-1">Paletas de Colores Premium</h3>
                        <p className="text-sm text-muted-foreground">
                            Selecciona una paleta profesional con colores completos para tu sistema de diseño
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {COLOR_PALETTES.map((palette) => (
                            <button
                                key={palette.name}
                                onClick={() => applyPalette(palette)}
                                className={`
                  relative group p-4 rounded-xl border-2 transition-all duration-200
                  ${isActivePalette(palette)
                                        ? "border-primary shadow-md scale-105"
                                        : "border-border hover:border-primary/50 hover:shadow-sm"
                                    }
                `}
                            >
                                {/* Primary & Secondary Preview */}
                                <div className="flex gap-2 mb-3">
                                    <div
                                        className="h-12 flex-1 rounded-lg border border-border"
                                        style={{ backgroundColor: palette.primary }}
                                    />
                                    <div
                                        className="h-12 w-12 rounded-lg border border-border"
                                        style={{ backgroundColor: palette.secondary }}
                                    />
                                </div>



                                {/* Palette Info */}
                                <div className="text-left">
                                    <p className="font-medium text-sm mb-1">{palette.name}</p>
                                    <p className="text-xs text-muted-foreground leading-tight">{palette.description}</p>
                                </div>

                                {/* Active Indicator */}
                                {isActivePalette(palette) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Colores Personalizados</h3>
                        <p className="text-sm text-muted-foreground">
                            Ajusta manualmente todos los colores de tu sistema de diseño
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="primary_color">Color Primario</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="primary_color"
                                    type="color"
                                    value={data.primary_color || "#000000"}
                                    onChange={(e) => onChange({ primary_color: e.target.value })}
                                    className="h-12 w-20 rounded-lg border border-border cursor-pointer"
                                />
                                <Input
                                    value={data.primary_color || "#000000"}
                                    onChange={(e) => onChange({ primary_color: e.target.value })}
                                    placeholder="#8B5CF6"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="secondary_color">Color Secundario</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="secondary_color"
                                    type="color"
                                    value={data.secondary_color || "#FFFFFF"}
                                    onChange={(e) => onChange({ secondary_color: e.target.value })}
                                    className="h-12 w-20 rounded-lg border border-border cursor-pointer"
                                />
                                <Input
                                    value={data.secondary_color || "#FFFFFF"}
                                    onChange={(e) => onChange({ secondary_color: e.target.value })}
                                    placeholder="#F5F3FF"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Other colors omitted in simple implementation but kept in UI if supported later */}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
