import { API_BASE_URL } from '@/config/api'

/**
 * Normalizes an image URL to be displayed in the frontend.
 * If the URL starts with http, it is returned as is (Supabase absolute URL).
 * If the URL is relative, it prepends the API_BASE_URL (Production Backend or Localhost).
 */
export function getProductImageUrl(url: string | null | undefined): string {
    if (!url) return "/placeholder.svg"

    // If it's already an absolute URL (Supabase or external)
    if (url.startsWith('http')) {
        return url
    }

    // If it's a relative path (Legacy Django media)
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
