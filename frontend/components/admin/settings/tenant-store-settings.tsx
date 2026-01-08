"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { useTenant } from "@/contexts/TenantContext"
import { toast } from "sonner"
import { optimizeImage, OPTIMIZATION_PRESETS } from "@/lib/image-optimizer"
import { uploadImageToSupabase } from "@/lib/supabase-upload"

interface TenantStoreSettingsProps {
    data: any
    onChange: (data: any) => void
}

export function TenantStoreSettings({ data, onChange }: TenantStoreSettingsProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isUploading, setIsUploading] = useState(false)
    const { tenant } = useTenant()

    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
        const file = e instanceof File ? e : e.target.files?.[0]
        if (!file || !file.type.startsWith("image/")) return

        if (!tenant) {
            toast.error("No se pudo identificar el comercio")
            return
        }

        try {
            setIsUploading(true)

            // Compress hero image
            const { file: optimizedFile, originalSize, optimizedSize, compressionRatio } =
                await optimizeImage(file, OPTIMIZATION_PRESETS.hero)

            console.log(`[TenantStoreSettings] Optimization: ${originalSize} -> ${optimizedSize} (${compressionRatio}% reduction)`)

            // Use shared upload utility for consistent path: {tenantId}/tenant/{filename}
            const { url } = await uploadImageToSupabase(optimizedFile, 'tenant', tenant.id)

            onChange({ hero_image_url: url })
            toast.success("Imagen subida y optimizada")
        } catch (error) {
            console.error("Error uploading hero image:", error)
            toast.error("Error al subir la imagen")
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
        if (file) handleHeroImageUpload(file)
    }

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Sección Hero</h3>
                        <p className="text-sm text-muted-foreground">Configura la imagen y textos principales de tu tienda</p>
                    </div>

                    {/* Hero Image */}
                    <div className="space-y-3">
                        <Label>Imagen Hero</Label>
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
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleHeroImageUpload}
                                className="hidden"
                            />
                            {data.hero_image_url ? (
                                <div className="space-y-3">
                                    <img
                                        src={data.hero_image_url}
                                        alt="Hero"
                                        className="w-full h-48 object-cover rounded-lg mx-auto"
                                    />
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
                                            {isUploading ? "Subiendo imagen..." : "Arrastra la imagen hero o haz clic para subir"}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">Recomendado 1920x600px, PNG o JPG hasta 5MB</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="space-y-2">
                        <Label htmlFor="hero_title">Título Hero</Label>
                        <Input
                            id="hero_title"
                            value={data.hero_title || ""}
                            onChange={(e) => onChange({ hero_title: e.target.value })}
                            placeholder="Bienvenido a nuestra tienda"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hero_subtitle">Subtítulo Hero</Label>
                        <Textarea
                            id="hero_subtitle"
                            value={data.hero_subtitle || ""}
                            onChange={(e) => onChange({ hero_subtitle: e.target.value })}
                            placeholder="Encuentra los mejores productos para tu negocio"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* CTA Section Configuration */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Sección Call to Action (Catálogo)</h3>
                        <p className="text-sm text-muted-foreground">Configura el banner que invita a ver el catálogo completo en el inicio</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cta_title">Título CTA</Label>
                        <Input
                            id="cta_title"
                            value={data.cta_title || ""}
                            onChange={(e) => onChange({ cta_title: e.target.value })}
                            placeholder="Ej: Explora Toda Nuestra Colección"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cta_description">Descripción CTA</Label>
                        <Textarea
                            id="cta_description"
                            value={data.cta_description || ""}
                            onChange={(e) => onChange({ cta_description: e.target.value })}
                            placeholder="Ej: Descubre productos de calidad premium..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cta_button_text">Texto del Botón</Label>
                            <Input
                                id="cta_button_text"
                                value={data.cta_button_text || ""}
                                onChange={(e) => onChange({ cta_button_text: e.target.value })}
                                placeholder="Ej: Ver Catálogo Completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cta_link">Enlace del Botón</Label>
                            <Input
                                id="cta_link"
                                value={data.cta_link || ""}
                                onChange={(e) => onChange({ cta_link: e.target.value })}
                                placeholder="Ej: /products"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative h-64 bg-gradient-to-br from-primary to-primary/70">
                        {data.hero_image_url && (
                            <img
                                src={data.hero_image_url}
                                alt="Hero preview"
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="text-center text-white px-6 max-w-2xl">
                                <h2 className="text-3xl font-bold mb-3">{data.hero_title || "Título Hero"}</h2>
                                <p className="text-lg opacity-90">{data.hero_subtitle || "Subtítulo Hero"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/50">
                        <p className="text-xs text-muted-foreground text-center">Vista previa de la sección hero</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
