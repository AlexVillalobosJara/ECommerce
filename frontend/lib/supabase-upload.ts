/**
 * Supabase Storage upload utility with multi-tenant isolation
 * Ensures each tenant's images are stored in their own folder
 */

import { supabase, SUPABASE_BUCKET } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import { fetchWithAuth, getHeaders, API_BASE_URL } from './api-client'

// Environment detection
const IS_DEV = process.env.NODE_ENV === 'development'

export type ImageFolder = 'products' | 'categories' | 'tenant'

export interface UploadResult {
    url: string
    path: string
    size: number
}

/**
 * Upload an image to Supabase Storage with tenant isolation
 * 
 * @param file - The image file to upload
 * @param folder - The folder type (products, categories, tenant)
 * @param tenantId - The tenant ID for folder isolation
 * @returns Upload result with public URL
 */
export async function uploadImageToSupabase(
    file: File,
    folder: ImageFolder,
    tenantId: string
): Promise<UploadResult> {
    if (!tenantId) {
        throw new Error('Tenant ID is required for image upload')
    }

    // ------------------------------------------------------------------
    // LOCAL DEVELOPMENT OVERRIDE
    // ------------------------------------------------------------------
    if (IS_DEV) {
        console.log('[Upload] Using Local Storage (Dev Environment)')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/media/upload/`, {
                method: 'POST',
                headers: getHeaders(false), // Content-Type handled by fetch for FormData
                body: formData
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Local upload failed')
            }

            const data = await response.json()
            return {
                url: data.url,
                path: data.path,
                size: data.size
            }
        } catch (error) {
            console.error('Local upload failed:', error)
            throw error
        }
    }
    // ------------------------------------------------------------------

    // Generate unique filename with tenant prefix
    const timestamp = Date.now()
    const uuid = uuidv4()
    const extension = file.name.split('.').pop() || 'webp'
    const filename = `${uuid}-${timestamp}.${extension}`

    // Construct path with tenant isolation: {tenant_id}/{folder}/{filename}
    const path = `${tenantId}/${folder}/${filename}`

    if (!supabase) {
        throw new Error('Supabase no está configurado. Por favor, revisa las variables de entorno.')
    }

    try {
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (error) {
            console.error('Supabase upload error:', error)
            throw new Error(`Upload failed: ${error.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(path)

        return {
            url: publicUrl,
            path: data.path,
            size: file.size,
        }
    } catch (error) {
        console.error('Image upload failed:', error)
        throw error instanceof Error
            ? error
            : new Error('Failed to upload image. Please try again.')
    }
}

/**
 * Delete an image from Supabase Storage
 * 
 * @param path - The storage path of the image
 */
export async function deleteImageFromSupabase(path: string): Promise<void> {
    if (IS_DEV) {
        console.log('[Delete] Skipping Supabase delete in Local Dev (Not implemented for local yet)')
        return
    }

    if (!supabase) return

    try {
        const { error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .remove([path])

        if (error) {
            console.error('Supabase delete error:', error)
            throw new Error(`Delete failed: ${error.message}`)
        }
    } catch (error) {
        console.error('Image deletion failed:', error)
        throw error instanceof Error
            ? error
            : new Error('Failed to delete image. Please try again.')
    }
}

/**
 * Extract storage path from Supabase public URL
 * 
 * @param url - The public URL
 * @returns The storage path
 */
export function extractPathFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url)
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
        return pathMatch ? pathMatch[1] : null
    } catch {
        return null
    }
}
