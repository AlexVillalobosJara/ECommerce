"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Star, Loader2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AdminProductImage } from "@/types/admin"
import {
    uploadProductImage,
    deleteProductImage,
    updateProductImage,
    setProductImagePrimary,
} from "@/services/adminProductService"

interface ProductMediaUploadProps {
    productId?: string
    images: AdminProductImage[]
    onChange: (images: AdminProductImage[]) => void
}

interface SortableImageProps {
    image: AdminProductImage
    index: number
    onDelete: (id: string) => void
    onSetPrimary: (id: string) => void
    onUpdateAltText: (id: string, altText: string) => void
}

function SortableImage({ image, index, onDelete, onSetPrimary, onUpdateAltText }: SortableImageProps) {
    const [isEditingAlt, setIsEditingAlt] = useState(false)
    const [altText, setAltText] = useState(image.alt_text || '')
    const [imageError, setImageError] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const handleSaveAltText = () => {
        onUpdateAltText(image.id, altText)
        setIsEditingAlt(false)
    }

    const imageUrl = `http://localhost:8000${image.url}`
    console.log('[SortableImage] Rendering image:', { id: image.id, url: image.url, fullUrl: imageUrl })

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group bg-muted rounded-lg overflow-hidden"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Image */}
            <div className="aspect-square relative bg-muted flex items-center justify-center">
                {!imageError ? (
                    <img
                        src={imageUrl}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('[SortableImage] Failed to load image:', imageUrl)
                            setImageError(true)
                        }}
                    />
                ) : (
                    <div className="text-center p-4">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">Error al cargar imagen</p>
                    </div>
                )}
            </div>

            {/* Primary Badge */}
            {image.is_primary && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Principal
                </div>
            )}

            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!image.is_primary && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSetPrimary(image.id)}
                        className="gap-1"
                    >
                        <Star className="w-3 h-3" />
                        Marcar como principal
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(image.id)}
                    className="gap-1"
                >
                    <X className="w-3 h-3" />
                    Eliminar
                </Button>
            </div>

            {/* Alt Text */}
            <div className="p-2 bg-background">
                {isEditingAlt ? (
                    <div className="flex gap-1">
                        <Input
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="Texto alternativo"
                            className="h-7 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAltText()
                                if (e.key === 'Escape') setIsEditingAlt(false)
                            }}
                        />
                        <Button size="sm" onClick={handleSaveAltText} className="h-7 px-2">
                            ✓
                        </Button>
                    </div>
                ) : (
                    <p
                        onClick={() => setIsEditingAlt(true)}
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground truncate"
                        title={image.alt_text || 'Click para agregar texto alternativo'}
                    >
                        {image.alt_text || 'Sin texto alternativo'}
                    </p>
                )}
            </div>
        </div>
    )
}

export function ProductMediaUpload({ productId, images, onChange }: ProductMediaUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

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

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }

    const handleFiles = async (files: File[]) => {
        if (!productId) {
            toast.error("Debes guardar el producto primero antes de subir imágenes")
            return
        }

        const imageFiles = files.filter(file => file.type.startsWith("image/"))

        if (imageFiles.length === 0) {
            toast.error("No se encontraron archivos de imagen válidos")
            return
        }

        setIsUploading(true)

        try {
            const uploadPromises = imageFiles.map((file, index) =>
                uploadProductImage(productId, file, {
                    sort_order: images.length + index,
                    is_primary: index === 0 && images.length === 0
                })
            )

            const uploadedImages = await Promise.all(uploadPromises)
            onChange([...images, ...uploadedImages])
            toast.success(`${uploadedImages.length} imagen(es) subida(s) correctamente`)
        } catch (error) {
            console.error("Error uploading images:", error)
            toast.error(error instanceof Error ? error.message : "Error al subir imágenes")
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        handleFiles(files)
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (imageId: string) => {
        if (!productId) return

        if (!confirm("¿Estás seguro de eliminar esta imagen?")) {
            return
        }

        try {
            await deleteProductImage(productId, imageId)
            onChange(images.filter(img => img.id !== imageId))
            toast.success("Imagen eliminada correctamente")
        } catch (error) {
            console.error("Error deleting image:", error)
            // If 404, the image might already be deleted, so remove it from UI anyway
            if (error instanceof Error && error.message.includes('404')) {
                onChange(images.filter(img => img.id !== imageId))
                toast.info("Imagen ya no existe en el servidor, removida de la lista")
            } else {
                toast.error(error instanceof Error ? error.message : "Error al eliminar imagen")
            }
        }
    }

    const handleSetPrimary = async (imageId: string) => {
        if (!productId) return

        try {
            await setProductImagePrimary(productId, imageId)
            const updatedImages = images.map(img => ({
                ...img,
                is_primary: img.id === imageId
            }))
            onChange(updatedImages)
            toast.success("Imagen principal actualizada")
        } catch (error) {
            console.error("Error setting primary image:", error)
            toast.error("Error al marcar como principal")
        }
    }

    const handleUpdateAltText = async (imageId: string, altText: string) => {
        if (!productId) return

        try {
            await updateProductImage(productId, imageId, { alt_text: altText })
            const updatedImages = images.map(img =>
                img.id === imageId ? { ...img, alt_text: altText } : img
            )
            onChange(updatedImages)
            toast.success("Texto alternativo actualizado")
        } catch (error) {
            console.error("Error updating alt text:", error)
            toast.error("Error al actualizar texto alternativo")
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) {
            return
        }

        const oldIndex = images.findIndex(img => img.id === active.id)
        const newIndex = images.findIndex(img => img.id === over.id)

        const reorderedImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
            ...img,
            sort_order: index
        }))

        onChange(reorderedImages)

        // Update sort_order in backend
        if (productId) {
            try {
                await Promise.all(
                    reorderedImages.map(img =>
                        updateProductImage(productId, img.id, { sort_order: img.sort_order })
                    )
                )
                toast.success("Orden actualizado")
            } catch (error) {
                console.error("Error updating order:", error)
                toast.error("Error al actualizar orden")
            }
        }
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Imágenes del Producto</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {productId
                                ? "Arrastra para reordenar. La primera imagen es la principal."
                                : "Guarda el producto primero para poder subir imágenes"}
                        </p>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => productId && fileInputRef.current?.click()}
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                            transition-all duration-200
                            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                            ${!productId ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                            disabled={!productId}
                        />
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
                                    {isUploading
                                        ? "Subiendo imágenes..."
                                        : isDragging
                                            ? "Suelta las imágenes aquí"
                                            : "Arrastra imágenes o haz clic para subir"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP hasta 5MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Images Grid */}
                    {images.length > 0 && (() => {
                        console.log('[ProductMediaUpload] Rendering images:', images)
                        const validImages = images.filter(img => img && img.id && img.url)
                        console.log('[ProductMediaUpload] Valid images:', validImages)

                        if (validImages.length === 0) {
                            return null
                        }

                        return (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={validImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {validImages.map((image, index) => (
                                            <SortableImage
                                                key={image.id}
                                                image={image}
                                                index={index}
                                                onDelete={handleDelete}
                                                onSetPrimary={handleSetPrimary}
                                                onUpdateAltText={handleUpdateAltText}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )
                    })()}

                    {images.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No hay imágenes todavía</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
