/**
 * Converts a relative media URL to an absolute URL pointing to the Django backend
 * @param url - The URL to convert (can be relative or absolute)
 * @returns Absolute URL pointing to Django backend
 */
export function getAbsoluteMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null

    // If already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }

    // Convert relative URL to absolute
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url

    return `${baseUrl}/${cleanUrl}`
}
