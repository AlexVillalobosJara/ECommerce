"use client"

import { useState, useCallback } from "react"
import { Upload, X, Star, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import type { AdminProductImage } from "@/types/admin"
import { uploadProductImage, deleteProductImage, setProductImagePrimary, updateProductImage } from "@/services/adminProductService"

interface ImageManagerProps {
    productId: string
    images: AdminProductImage[]
    onImagesChange: (images: AdminProductImage[]) => void
}

export function ImageManager({ productId, images, onImagesChange }: ImageManagerProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = Array.from(e.dataTransfer.files)
        await handleFiles(files)
    }, [productId])

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            await handleFiles(files)
        }
    }, [productId])

    const handleFiles = async (files: File[]) => {
        // Validate files
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`)
                return false
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 5MB limit`)
                return false
            }
            return true
        })

        if (validFiles.length === 0) return

        setUploading(true)

        try {
            // Upload files sequentially
            const uploadedImages: AdminProductImage[] = []
            for (const file of validFiles) {
                const image = await uploadProductImage(productId, file, {
                    alt_text: file.name,
                    sort_order: images.length + uploadedImages.length,
                    is_primary: images.length === 0 && uploadedImages.length === 0
                })
                uploadedImages.push(image)
            }

            onImagesChange([...images, ...uploadedImages])
            toast.success(`Uploaded ${uploadedImages.length} image(s)`)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload images')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (imageId: string) => {
        try {
            await deleteProductImage(productId, imageId)
            onImagesChange(images.filter(img => img.id !== imageId))
            toast.success('Image deleted')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete image')
        }
    }

    const handleSetPrimary = async (imageId: string) => {
        try {
            await setProductImagePrimary(productId, imageId)
            const updatedImages = images.map(img => ({
                ...img,
                is_primary: img.id === imageId
            }))
            onImagesChange(updatedImages)
            toast.success('Primary image updated')
        } catch (error) {
            console.error('Set primary error:', error)
            toast.error('Failed to set primary image')
        }
    }

    const handleUpdateAltText = async (imageId: string, altText: string) => {
        try {
            await updateProductImage(productId, imageId, { alt_text: altText })
            const updatedImages = images.map(img =>
                img.id === imageId ? { ...img, alt_text: altText } : img
            )
            onImagesChange(updatedImages)
        } catch (error) {
            console.error('Update alt text error:', error)
            toast.error('Failed to update alt text')
        }
    }

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border"
                    } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-4">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {uploading ? "Uploading..." : "Drag and drop images here"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            or click to browse (JPEG, PNG, WebP, max 5MB)
                        </p>
                    </div>
                    <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileInput}
                        disabled={uploading}
                        className="hidden"
                        id="image-upload"
                    />
                    <Label htmlFor="image-upload">
                        <Button variant="outline" disabled={uploading} asChild>
                            <span>Browse Files</span>
                        </Button>
                    </Label>
                </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <Card key={image.id} className="p-2 relative group">
                            {/* Image Preview */}
                            <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                                <Image
                                    src={image.url.startsWith('http')
                                        ? image.url
                                        : `http://localhost:8000${image.url}`}
                                    alt={image.alt_text || "Product image"}
                                    fill
                                    className="object-cover"
                                />
                                {image.is_primary && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
                                        <Star className="w-3 h-3 fill-current" />
                                    </div>
                                )}
                            </div>

                            {/* Alt Text Input */}
                            <Input
                                placeholder="Alt text"
                                value={image.alt_text || ""}
                                onChange={(e) => handleUpdateAltText(image.id, e.target.value)}
                                className="text-xs mb-2"
                            />

                            {/* Actions */}
                            <div className="flex gap-1">
                                {!image.is_primary && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetPrimary(image.id)}
                                        className="flex-1 text-xs"
                                    >
                                        <Star className="w-3 h-3 mr-1" />
                                        Primary
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(image.id)}
                                    className="text-xs"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {images.length === 0 && !uploading && (
                <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images uploaded yet</p>
                </div>
            )}
        </div>
    )
}
