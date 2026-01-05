"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, Star, X, GripVertical } from "lucide-react"
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
import { ImageUploader } from "./image-uploader"
import { useTenant } from "@/hooks/useTenant"
import Image from "next/image"

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
                <Image
                    src={image.url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    fill
                    className="object-cover"
                />
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
    const { tenantId } = useTenant()
    const [isAddingImage, setIsAddingImage] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleImageUploaded = (url: string) => {
        // Create new image object with Supabase URL
        const newImage: AdminProductImage = {
            id: `temp-${Date.now()}`, // Temporary ID until saved to backend
            url,
            alt_text: '',
            sort_order: images.length,
            is_primary: images.length === 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        onChange([...images, newImage])
        setIsAddingImage(false)
        toast.success("Imagen subida correctamente")
    }

    const handleDelete = (imageId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta imagen?")) {
            return
        }

        onChange(images.filter(img => img.id !== imageId))
        toast.success("Imagen eliminada")
    }

    const handleSetPrimary = (imageId: string) => {
        const updatedImages = images.map(img => ({
            ...img,
            is_primary: img.id === imageId
        }))
        onChange(updatedImages)
        toast.success("Imagen principal actualizada")
    }

    const handleUpdateAltText = (imageId: string, altText: string) => {
        const updatedImages = images.map(img =>
            img.id === imageId ? { ...img, alt_text: altText } : img
        )
        onChange(updatedImages)
        toast.success("Texto alternativo actualizado")
    }

    const handleDragEnd = (event: DragEndEvent) => {
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
        toast.success("Orden actualizado")
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Imágenes del Producto</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Arrastra para reordenar. La primera imagen es la principal.
                        </p>
                    </div>

                    {/* Add Image Button */}
                    {!isAddingImage && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddingImage(true)}
                            className="w-full"
                        >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Agregar Imagen
                        </Button>
                    )}

                    {/* Image Uploader */}
                    {isAddingImage && (
                        <div className="space-y-2">
                            <ImageUploader
                                value=""
                                onChange={handleImageUploaded}
                                folder="products"
                                preset="product"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddingImage(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    )}

                    {/* Images Grid */}
                    {images.length > 0 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((image, index) => (
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
                    )}

                    {images.length === 0 && !isAddingImage && (
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
