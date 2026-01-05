"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { supabase, SUPABASE_BUCKET } from "@/lib/supabase"
import { useTenant } from "@/contexts/TenantContext"
import { toast } from "sonner"
import { optimizeImage, OPTIMIZATION_PRESETS } from "@/lib/image-optimizer"

interface CategoryMediaUploadProps {
    data: {
        image_url: string
    }
    onChange: (data: Partial<CategoryMediaUploadProps["data"]>) => void
}

export function CategoryMediaUpload({ data, onChange }: CategoryMediaUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { tenant } = useTenant()

    const handleFileSelect = async (file: File) => {
        if (!file || !file.type.startsWith("image/")) return

        if (!tenant) {
            toast.error("No se pudo identificar el comercio para la subida")
            return
        }

        if (!supabase) {
            toast.error("Supabase no está configurado")
            return
        }

        try {
            setIsUploading(true)

            // Compress image
            const { file: optimizedFile } = await optimizeImage(file, OPTIMIZATION_PRESETS.category)

            const fileExt = optimizedFile.name.split('.').pop() || 'webp'
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${tenant.slug}/categories/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .upload(filePath, optimizedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from(SUPABASE_BUCKET)
                .getPublicUrl(filePath)

            onChange({ image_url: publicUrl })
            toast.success("Imagen subida y optimizada")
        } catch (error) {
            console.error("Error uploading category image:", error)
            toast.error("Error al subir la imagen")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleRemove = () => {
        onChange({ image_url: "" })
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Imagen</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Imagen de la Categoría</Label>

                                {data.image_url ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                        <Image
                                            src={data.image_url}
                                            alt="Category image"
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={handleRemove}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                                            }`}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Arrastra una imagen aquí</p>
                                                <p className="text-xs text-muted-foreground">o haz click para seleccionar</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4 mr-2" />
                                                )}
                                                {isUploading ? "Subiendo..." : "Seleccionar Imagen"}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFileSelect(file)
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Formatos recomendados: JPG, PNG. Tamaño máximo: 2MB
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
