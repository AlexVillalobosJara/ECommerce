
// Wrapper for fetch to handle auth errors globally
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init)

    if (response.status === 401) {
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_access_token')
            // Prevent redirect loop if already on login
            if (!window.location.pathname.includes('/admin/login')) {
                window.location.href = '/admin/login'
            }
        }
    }

    return response
}

// Helper function to get auth headers
export function getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {}

    // Add JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Add tenant slug from localStorage to help backend resolve tenant
    const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : null
    if (tenantSlug) {
        headers['X-Tenant'] = tenantSlug
    }

    if (includeContentType) {
        headers['Content-Type'] = 'application/json'
    }

    return headers
}
