/**
 * Image optimization utility for client-side compression and WebP conversion
 * Ensures images meet 1MB size limit for optimal performance and SEO
 */

import imageCompression from 'browser-image-compression'

export interface OptimizeOptions {
    maxWidth?: number
    maxHeight?: number
    maxSizeMB?: number
    quality?: number
    fileType?: string
}

export interface OptimizeResult {
    file: File
    originalSize: number
    optimizedSize: number
    compressionRatio: number
}

/**
 * Optimize an image file by resizing, compressing, and converting to WebP
 * 
 * @param file - The original image file
 * @param options - Optimization options
 * @returns Optimized image file with metadata
 */
export async function optimizeImage(
    file: File,
    options: OptimizeOptions = {}
): Promise<OptimizeResult> {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        maxSizeMB = 1,
        quality = 0.85,
        fileType = 'image/webp'
    } = options

    const originalSize = file.size

    try {
        // Compress and convert to WebP
        const optimizedFile = await imageCompression(file, {
            maxWidthOrHeight: Math.max(maxWidth, maxHeight),
            maxSizeMB,
            useWebWorker: true,
            fileType,
            initialQuality: quality,
        })

        const optimizedSize = optimizedFile.size
        const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

        return {
            file: optimizedFile,
            originalSize,
            optimizedSize,
            compressionRatio: Math.round(compressionRatio * 100) / 100
        }
    } catch (error) {
        console.error('Image optimization failed:', error)
        throw new Error('Failed to optimize image. Please try a different file.')
    }
}

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return validTypes.includes(file.type.toLowerCase())
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Preset optimization options for different image types
 */
export const OPTIMIZATION_PRESETS = {
    product: {
        maxWidth: 1200,
        maxHeight: 1200,
        maxSizeMB: 1,
        quality: 0.85,
    },
    category: {
        maxWidth: 800,
        maxHeight: 800,
        maxSizeMB: 0.5,
        quality: 0.85,
    },
    logo: {
        maxWidth: 400,
        maxHeight: 400,
        maxSizeMB: 0.2,
        quality: 0.9,
    },
    hero: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxSizeMB: 1,
        quality: 0.85,
    },
} as const
