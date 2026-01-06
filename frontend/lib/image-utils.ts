import { API_BASE_URL } from '@/config/api'

/**
 * Normalizes an image URL to be displayed in the frontend.
 * - Handles absolute URLs (Supabase/external).
 * - Handles Base64 data URIs (skips normalization).
 * - Handles relative paths (prepends API_BASE_URL).
 */
export function getImageUrl(url: string | null | undefined): string {
    if (!url) return "/placeholder.svg"

    // If it's already an absolute URL (Supabase or external) or a base64 data URI
    if (url.startsWith('http') || url.startsWith('data:')) {
        return url
    }

    // If it's a relative path (Legacy Django media)
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// Keep alias for backward compatibility
export const getProductImageUrl = getImageUrl
