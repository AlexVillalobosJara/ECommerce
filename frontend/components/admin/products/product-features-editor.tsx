"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, GripVertical, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { createProductFeature, deleteProductFeature, updateProductFeature } from "@/services/adminProductService"
import { getProductImageUrl } from "@/lib/image-utils"
import { uploadImageToSupabase } from "@/lib/supabase-upload"
import { useTenant } from "@/contexts/TenantContext"
import { optimizeImage, OPTIMIZATION_PRESETS } from "@/lib/image-optimizer"

interface ProductFeature {
    id?: string
    image_url: string
    title: string
    description: string
    sort_order: number
}

interface ProductFeaturesEditorProps {
    productId?: string
    features: ProductFeature[]
    onChange: (features: ProductFeature[]) => void
}

export function ProductFeaturesEditor({ productId, features, onChange }: ProductFeaturesEditorProps) {
    const { tenant } = useTenant()
    const tenantId = tenant?.id
    const [uploading, setUploading] = useState<string | null>(null)

    const handleAddFeature = () => {
        const newFeature: ProductFeature = {
            id: `temp-${Date.now()}`,
            image_url: "",
            title: "",
            description: "",
            sort_order: features.length
        }
        onChange([...features, newFeature])
    }

    const handleRemoveFeature = async (index: number) => {
        const feature = features[index]

        // If it's a persisted feature (has real ID and productId is present)
        if (productId && feature.id && !feature.id.startsWith('temp-')) {
            try {
                await deleteProductFeature(productId, feature.id)
                toast.success("Característica eliminada")
            } catch (error) {
                console.error("Error deleting feature:", error)
                toast.error("Error al eliminar característica")
                return
            }
        }

        const newFeatures = features.filter((_, i) => i !== index)
        onChange(newFeatures)
    }

    const handleUpdateFeature = (index: number, field: keyof ProductFeature, value: any) => {
        const newFeatures = [...features]
        newFeatures[index] = { ...newFeatures[index], [field]: value }
        onChange(newFeatures)
    }

    const handleImageUpload = async (index: number, file: File) => {
        if (!file) return

        if (!tenantId) {
            toast.error("Error: No se ha identificado el comercio (Tenant ID)")
            return
        }

        try {
            setUploading(features[index].id || `temp-${index}`)
            toast.info("Optimizando imagen...")

            // Optimize image before upload
            const { file: optimizedFile } = await optimizeImage(file, OPTIMIZATION_PRESETS.product)

            const { url } = await uploadImageToSupabase(optimizedFile, 'products', tenantId)
            handleUpdateFeature(index, 'image_url', url)
            toast.success("Imagen subida correctamente")
        } catch (error) {
            console.error("Error uploading image:", error)
            toast.error(error instanceof Error ? error.message : "Error al subir imagen")
        } finally {
            setUploading(null)
        }
    }

    // Save individual feature (if needed immediately, though saving usually happens on main form save)
    // However, since we defined API for CRUD, we might want to save immediately OR wait for main save.
    // The main ProductEditor handles "save" by sending everything. But Features have their own table.
    // Strategy: The main ProductSerializer does NOT handle features writing (it was read-only).
    // So we should probably handle CRUD here properly or update the serializer to support writable nested features.
    // Given the previous `serializers.SerializerMethodField` for `features` in `get_features`, it was READ ONLY.
    // So we MUST use the separate API endpoints I created (`product_feature_create`, `product_feature_detail`) to save changes.
    // But `ProductEditor` "Guardar" button calls `updateProduct`.
    // We should probably integrate the saving logic into the `ProductEditor`'s `handleSave` or save immediately here.
    // UX: It's better if "Guardar" in the main bar saves everything.
    // BUT, implementing nested writable serializer for list of items is complex.
    // Simplest approach: Save immediately on "Add/Update" OR create a "Sync" function like `syncVariants`.

    // For now, let's allow editing in state, and `ProductEditor` will call a sync function?
    // Start with strictly UI editing here.

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Características Visuales (Imágenes con Texto)</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddFeature} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Característica
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {features.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                        No hay características agregadas.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <Card key={feature.id || index} className="p-4 border border-border relative group">
                            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRemoveFeature(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Image Upload */}
                                <div className="aspect-video bg-muted rounded-md relative overflow-hidden group/image">
                                    {feature.image_url ? (
                                        <img
                                            src={getProductImageUrl(feature.image_url)}
                                            alt={feature.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <ImageIcon className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors">
                                            {uploading === (feature.id || `temp-${index}`) ? "Subiendo..." : "Cambiar Imagen"}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleImageUpload(index, file)
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Texts */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">Título</label>
                                        <Input
                                            value={feature.title}
                                            onChange={(e) => handleUpdateFeature(index, 'title', e.target.value)}
                                            placeholder="Ej: Motor Brushless"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">Descripción</label>
                                        <Textarea
                                            value={feature.description}
                                            onChange={(e) => handleUpdateFeature(index, 'description', e.target.value)}
                                            placeholder="Detalles de la característica..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
