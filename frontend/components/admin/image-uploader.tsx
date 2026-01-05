/**
 * Reusable Image Uploader Component with Supabase Storage integration
 * Features: Drag & drop, image preview, upload progress, optimization status
 */

'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { optimizeImage, isValidImageType, formatFileSize, OPTIMIZATION_PRESETS } from '@/lib/image-optimizer'
import { uploadImageToSupabase, ImageFolder } from '@/lib/supabase-upload'
import { useTenant } from '@/hooks/useTenant'
import Image from 'next/image'

interface ImageUploaderProps {
    value?: string
    onChange: (url: string) => void
    folder: ImageFolder
    label?: string
    preset?: keyof typeof OPTIMIZATION_PRESETS
    className?: string
}

export function ImageUploader({
    value,
    onChange,
    folder,
    label = 'Imagen',
    preset = 'product',
    className = '',
}: ImageUploaderProps) {
    const { tenantId, isLoading: tenantLoading } = useTenant()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [optimizationInfo, setOptimizationInfo] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (file: File) => {
        setError(null)
        setOptimizationInfo(null)
        setUploadProgress(0)

        // Validate tenant
        if (!tenantId) {
            setError('No se pudo obtener el ID del tenant. Por favor, recarga la página.')
            return
        }

        // Validate file type
        if (!isValidImageType(file)) {
            setError('Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.')
            return
        }

        try {
            setIsUploading(true)
            setUploadProgress(10)

            // Optimize image
            const optimizationOptions = OPTIMIZATION_PRESETS[preset]
            const { file: optimizedFile, originalSize, optimizedSize, compressionRatio } =
                await optimizeImage(file, optimizationOptions)

            setOptimizationInfo(
                `Optimizado: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${compressionRatio}% reducción)`
            )
            setUploadProgress(50)

            // Upload to Supabase
            const { url } = await uploadImageToSupabase(optimizedFile, folder, tenantId)

            setUploadProgress(100)
            onChange(url)

            // Clear optimization info after success
            setTimeout(() => setOptimizationInfo(null), 3000)
        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Error al subir la imagen')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleRemove = () => {
        onChange('')
        setError(null)
        setOptimizationInfo(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    if (tenantLoading) {
        return (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <Label>{label}</Label>}

            {/* Upload Area */}
            {!value && (
                <div
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={isUploading}
                    />

                    <div className="flex flex-col items-center gap-2">
                        {isUploading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        ) : (
                            <Upload className="w-10 h-10 text-muted-foreground" />
                        )}

                        <div className="text-sm">
                            <span className="font-medium text-primary">Haz clic para subir</span>
                            {' o arrastra y suelta'}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            JPEG, PNG o WebP (máx. 1MB)
                        </p>
                    </div>

                    {isUploading && (
                        <div className="mt-4 space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {uploadProgress < 50 ? 'Optimizando...' : 'Subiendo...'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Image Preview */}
            {value && !isUploading && (
                <div className="relative group">
                    <div className="relative aspect-square w-full max-w-xs rounded-lg overflow-hidden border">
                        <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Optimization Info */}
            {optimizationInfo && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {optimizationInfo}
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {error}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
