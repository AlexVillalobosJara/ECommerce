"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Save, X, Palette, Trash2 } from "lucide-react"
import { adminPremiumPaletteService } from "@/services/adminPremiumPaletteService"
import { PremiumPalette } from "@/types/tenant"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface PremiumPaletteFormProps {
    paletteId?: string
}

export function PremiumPaletteForm({ paletteId }: PremiumPaletteFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<PremiumPalette>>({
        name: "",
        primary_color: "#6FA9D2",
        secondary_color: "#F3F4F6",
        secondary_text_color: "#F0EFEC",
        accent_dark_color: "#2B2C30",
        accent_medium_color: "#3F4A52",
        header_bg_color: "#2B2C30",
        header_text_color: "#F0EFEC",
        hero_text_color: "#FFFFFF",
        hero_btn_bg_color: "#2B2C30",
        hero_btn_text_color: "#F0EFEC",
        cta_text_color: "#2B2C30",
        cta_btn_bg_color: "#3F4A52",
        cta_btn_text_color: "#F0EFEC",
        footer_bg_color: "#2B2C30",
        footer_text_color: "#F0EFEC",
        primary_btn_text_color: "#FFFFFF",
        is_active: true,
    })

    useEffect(() => {
        if (paletteId) {
            loadPalette()
        }
    }, [paletteId])

    async function loadPalette() {
        try {
            setIsLoading(true)
            const data = await adminPremiumPaletteService.getPalette(paletteId!)
            setFormData(data)
        } catch (error: any) {
            toast.error("Error al cargar la paleta")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            setIsLoading(true)

            const sanitizedData = { ...formData };
            const colorFields = [
                'header_bg_color', 'header_text_color',
                'hero_text_color', 'hero_btn_bg_color', 'hero_btn_text_color',
                'cta_text_color', 'cta_btn_bg_color', 'cta_btn_text_color',
                'footer_bg_color', 'footer_text_color', 'primary_btn_text_color'
            ];
            colorFields.forEach(field => {
                if ((sanitizedData as any)[field] === "") (sanitizedData as any)[field] = null;
            });

            if (paletteId) {
                await adminPremiumPaletteService.updatePalette(paletteId, sanitizedData)
                toast.success("Paleta actualizada exitosamente")
            } else {
                await adminPremiumPaletteService.createPalette(sanitizedData)
                toast.success("Paleta creada exitosamente")
            }
            router.push("/admin/premium-palettes")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la paleta")
        } finally {
            setIsLoading(false)
        }
    }

    const updateColor = (key: keyof PremiumPalette, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {paletteId ? "Editar Paleta Premium" : "Nueva Paleta Premium"}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Guardando..." : "Guardar Paleta"}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        Información General
                    </CardTitle>
                    <CardDescription>
                        Define el nombre y estado de esta combinación de colores.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Paleta</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => updateColor("name", e.target.value)}
                            placeholder="Ej: Calidad industrial, Elegancia Moderna..."
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="palette_type">Tipo de Paleta</Label>
                        <select
                            id="palette_type"
                            value={formData.palette_type || 'premium'}
                            onChange={(e) => updateColor("palette_type" as any, e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="basic">Básica (disponible para todos)</option>
                            <option value="premium">Premium (requiere plan premium)</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Colores Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Color Primario</Label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => updateColor("primary_color", e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={formData.primary_color}
                                    onChange={(e) => updateColor("primary_color", e.target.value)}
                                    placeholder="#Hex"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Color Secundario</Label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={formData.secondary_color}
                                    onChange={(e) => updateColor("secondary_color", e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={formData.secondary_color}
                                    onChange={(e) => updateColor("secondary_color", e.target.value)}
                                    placeholder="#Hex"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Letras de Botones Primarios</Label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={formData.primary_btn_text_color || "#FFFFFF"}
                                    onChange={(e) => updateColor("primary_btn_text_color" as any, e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={formData.primary_btn_text_color || "#FFFFFF"}
                                    onChange={(e) => updateColor("primary_btn_text_color" as any, e.target.value)}
                                    placeholder="#Hex"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Acentos del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ColorField id="secondary_text_color" label="Texto Secundario" value={formData.secondary_text_color || ""} onChange={(v) => updateColor("secondary_text_color" as any, v)} />
                        <ColorField id="accent_dark_color" label="Acento Oscuro" value={formData.accent_dark_color || ""} onChange={(v) => updateColor("accent_dark_color" as any, v)} />
                        <ColorField id="accent_medium_color" label="Acento Medio" value={formData.accent_medium_color || ""} onChange={(v) => updateColor("accent_medium_color" as any, v)} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Ajustes por Componente
                    </CardTitle>
                    <CardDescription>
                        Define colores específicos para las secciones principales de la tienda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Header/Footer Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="space-y-4">
                            <h5 className="font-medium text-sm">Header (Cabecera)</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ColorField id="header_bg_color" label="Fondo" value={formData.header_bg_color || ""} onChange={(v) => updateColor("header_bg_color" as any, v)} />
                                <ColorField id="header_text_color" label="Texto" value={formData.header_text_color || ""} onChange={(v) => updateColor("header_text_color" as any, v)} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="font-medium text-sm">Footer (Pie de página)</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ColorField id="footer_bg_color" label="Fondo" value={formData.footer_bg_color || ""} onChange={(v) => updateColor("footer_bg_color" as any, v)} />
                                <ColorField id="footer_text_color" label="Texto" value={formData.footer_text_color || ""} onChange={(v) => updateColor("footer_text_color" as any, v)} />
                            </div>
                        </div>
                    </div>

                    {/* Hero Group */}
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                        <h5 className="font-medium text-sm">Sección Hero (Principal)</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <ColorField id="hero_text_color" label="Texto" value={formData.hero_text_color || ""} onChange={(v) => updateColor("hero_text_color" as any, v)} />
                            <ColorField id="hero_btn_bg_color" label="Fondo Botón" value={formData.hero_btn_bg_color || ""} onChange={(v) => updateColor("hero_btn_bg_color" as any, v)} />
                            <ColorField id="hero_btn_text_color" label="Texto Botón" value={formData.hero_btn_text_color || ""} onChange={(v) => updateColor("hero_btn_text_color" as any, v)} />
                        </div>
                    </div>

                    {/* CTA Group */}
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                        <h5 className="font-medium text-sm">Sección CTA</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <ColorField id="cta_text_color" label="Texto" value={formData.cta_text_color || ""} onChange={(v) => updateColor("cta_text_color" as any, v)} />
                            <ColorField id="cta_btn_bg_color" label="Fondo Botón" value={formData.cta_btn_bg_color || ""} onChange={(v) => updateColor("cta_btn_bg_color" as any, v)} />
                            <ColorField id="cta_btn_text_color" label="Texto Botón" value={formData.cta_btn_text_color || ""} onChange={(v) => updateColor("cta_btn_text_color" as any, v)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Vista Previa de Componentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Header/Footer Preview */}
                        <div>
                            <p className="text-sm font-medium mb-3">Header Preview</p>
                            <div
                                className="p-6 rounded-lg border flex items-center justify-between"
                                style={{ backgroundColor: formData.header_bg_color || formData.primary_color }}
                            >
                                <span className="font-serif text-lg" style={{ color: formData.header_text_color || formData.secondary_text_color }}>
                                    Nombre Tienda
                                </span>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: (formData.header_text_color || formData.secondary_text_color) + '20' }} />
                                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: (formData.header_text_color || formData.secondary_text_color) + '20' }} />
                                </div>
                            </div>
                        </div>

                        {/* Buttons Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-3">Botón Hero</p>
                                <div
                                    className="py-3 px-6 rounded-md text-center inline-block cursor-pointer font-medium"
                                    style={{
                                        backgroundColor: formData.hero_btn_bg_color || formData.accent_dark_color,
                                        color: formData.hero_btn_text_color || formData.secondary_text_color
                                    }}
                                >
                                    Ver Colección
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-3">Botón CTA</p>
                                <div
                                    className="py-3 px-6 rounded-md text-center inline-block cursor-pointer font-medium"
                                    style={{
                                        backgroundColor: formData.cta_btn_bg_color || formData.accent_medium_color,
                                        color: formData.cta_btn_text_color || formData.secondary_text_color
                                    }}
                                >
                                    Ir al Catálogo
                                </div>
                            </div>
                        </div>

                        {/* Storefront Elements */}
                        <div>
                            <p className="text-sm font-medium mb-3">Identidad Primaria (Botón Compra / Variantes)</p>
                            <div className="flex gap-4">
                                <div
                                    className="py-4 px-10 rounded-xl text-center cursor-pointer font-bold uppercase tracking-wider"
                                    style={{
                                        backgroundColor: formData.primary_color,
                                        color: formData.secondary_text_color
                                    }}
                                >
                                    Agregar al Carrito
                                </div>
                                <div
                                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold"
                                    style={{
                                        borderColor: formData.primary_color,
                                        backgroundColor: formData.primary_color,
                                        color: formData.secondary_text_color
                                    }}
                                >
                                    XL
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form >
    )
}

function ColorField({ id, label, value, onChange }: { id: string, label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</Label>
            <div className="flex gap-2">
                <input
                    id={id}
                    type="color"
                    value={value || "#000000"}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-8 rounded border cursor-pointer flex-shrink-0"
                />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#Hex"
                    className="h-8 text-[10px] font-mono"
                />
            </div>
        </div>
    )
}
